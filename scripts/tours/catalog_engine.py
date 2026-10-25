#!/usr/bin/env python3
"""Audit legacy tour exports, fetch original WeGoTrip products, or convert confirmed product URLs.

No database writes. Supplier files contain public product fields only. Existing
Travelpayouts link generation is reused; credentials stay in server environment.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
from datetime import datetime, timezone
import re
import sys
import time
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

API = "https://app.wegotrip.com/api/v2"
MAX_BYTES = 1_500_000
DOC = "https://support.travelpayouts.com/hc/en-us/articles/360016170039-WeGoTrip-affiliate-program-API"

def safe_url(value, hosts):
    if not isinstance(value, str) or len(value) > 2048:
        return None
    try:
        u = urlparse(value)
        return u if u.scheme == "https" and u.hostname in hosts and not u.username and not u.password and u.port is None and not u.fragment else None
    except ValueError:
        return None

def product_url(provider, ident, value):
    patterns = {
        "wegotrip": ({"wegotrip.com", "www.wegotrip.com"}, r"^/[a-z0-9-]+-d[1-9]\d*/[a-z0-9-]+-p([1-9]\d*)/$"),
        "klook": ({"klook.com", "www.klook.com"}, r"^/(?:[a-z]{2}(?:-[A-Z]{2})?/)?activity/([1-9]\d*)-[a-z0-9-]+/?$"),
        "kkday": ({"kkday.com", "www.kkday.com"}, r"^/(?:[a-z]{2}(?:-[a-z]{2})?/)?product/([1-9]\d*)(?:-[a-z0-9-]+)?/?$"),
        "tiqets": ({"tiqets.com", "www.tiqets.com"}, r"^/[a-z]{2}/[a-z0-9-]+/[a-z0-9-]+-p([1-9]\d*)/?$"),
    }
    if provider not in patterns or not re.fullmatch(r"[1-9][0-9]{0,18}",str(ident)):
        raise ValueError("Unknown provider or missing supplier product ID")
    hosts, pattern = patterns[provider]
    u = safe_url(value, hosts)
    match = re.fullmatch(pattern, u.path) if u and not u.query else None
    if not match or match.group(1) != str(ident):
        raise ValueError("Product URL does not match the confirmed supplier ID")
    return value

def audit(rows):
    ids, names, images, links = {}, {}, {}, {}
    counts = {"records":len(rows),"missing_source":0,"missing_provider":0,"stock_or_missing_image":0,"unreviewed_media":0,"unpublished":0,"generic_or_missing_booking_link":0,"seed_title_pattern":0}
    for row in rows:
        for store, key in [(ids,str(row.get("id",""))), (names," ".join(str(row.get("title","")).lower().split())+":"+str(row.get("city_slug") or row.get("city") or "").lower()), (images,str(row.get("image_url") or "")), (links,str(row.get("affiliate_link") or ""))]:
            if key: store[key] = store.get(key,0)+1
        counts["missing_source"] += not bool(row.get("source_url"))
        counts["missing_provider"] += not bool(row.get("provider"))
        image = str(row.get("image_url") or "")
        counts["stock_or_missing_image"] += not image or any(x in image for x in ["pexels.com","unsplash.com","placeholder"])
        counts["unreviewed_media"] += row.get("media_rights_verified") is not True
        counts["unpublished"] += row.get("is_public") is not True
        link = safe_url(row.get("affiliate_link"), {"tp.media","klook.tpo.lv","wegotrip.tpo.lv","kkday.tpo.lv","gocity.tpo.lv","www.klook.com","wegotrip.com","www.tiqets.com","www.kkday.com"})
        counts["generic_or_missing_booking_link"] += not link or link.path in ("", "/", "/r")
        counts["seed_title_pattern"] += bool(re.fullmatch(r".+ (?:Guided Tour|City Tour|Adventure Experience)",str(row.get("title") or ""),re.I))
    return {**counts,"duplicate_id_groups":sum(v>1 for v in ids.values()),"possible_duplicate_title_city_groups":sum(v>1 for v in names.values()),"repeated_image_groups":sum(v>1 for v in images.values()),"unique_booking_link_values":len(links),"database_mutated":False}

def fetch_data(path, params, opener=urlopen):
    req = Request(API+path+"?"+urlencode(params),headers={"Accept":"application/json","Accept-Language":"en","User-Agent":"GTHPRO-SupplierCatalog/1.0"})
    with opener(req,timeout=25) as response:
        if "application/json" not in response.headers.get("Content-Type", ""):
            raise ValueError("Supplier did not return JSON")
        raw = response.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES:
        raise ValueError("Supplier response exceeds limit")
    data=json.loads(raw).get("data")
    if not isinstance(data,dict): raise ValueError("Invalid supplier response")
    return data

def collect(city, limit, opener=urlopen, sleeper=time.sleep):
    search=fetch_data("/search/",{"query":city,"currency":"USD"},opener)
    places=[p for p in search.get("results",[]) if p.get("type")=="city" and p.get("available") is True and (str(p.get("name","")).casefold()==city.casefold() or str(p.get("slug","")).replace("-"," ").casefold()==city.casefold())]
    if len(places)!=1: raise ValueError("Destination is missing or ambiguous; no guessed city match")
    place=places[0]
    if type(place.get("id")) is not int or place["id"]<1: raise ValueError("Invalid supplier city ID")
    source=fetch_data("/products/popular/",{"city":place["id"],"lang":"en","currency":"USD","page":1},opener)
    print(json.dumps({"stage":"supplier_products","listed":len(source.get("results",[]))}),flush=True)
    products=[];seen=set()
    for row in source.get("results",[])[:min(20,limit*3)]:
        if len(products)>=limit: break
        if not isinstance(row,dict) or type(row.get("id")) is not int or row["id"]<1 or row["id"] in seen:continue
        if row.get("locale")!="en" or row.get("tags",{}).get("available") is not True:continue
        # Detail record supplies current publication status and the canonical URL.
        sleeper(0.5)
        detail=fetch_data(f"/products/{row['id']}/",{"currency":"USD"},opener)
        if detail.get("id")!=row["id"] or detail.get("published") is not True or detail.get("available") is not True or detail.get("status")!="approved":continue
        image=detail.get("preview");photo=safe_url(image,{"wgt-prod-storage.s3.amazonaws.com","app.wegotrip.com"})
        if not photo or not photo.path.startswith("/media/") or not re.search(r"\.(?:jpg|jpeg|png|webp)$",photo.path,re.I):continue
        href=product_url("wegotrip",row["id"],detail.get("url"))
        if detail.get("city",{}).get("id")!=place["id"]:continue
        if not isinstance(detail.get("title"),str) or not detail["title"].strip():continue
        with opener(Request(image,headers={"User-Agent":"GTHPRO-SupplierCatalog/1.0"}),timeout=20) as response:
            if not response.headers.get("Content-Type","").startswith("image/") or not response.read(32):continue
        seen.add(row["id"])
        products.append({"provider":"wegotrip","provider_product_id":str(row["id"]),"title":detail["title"].strip()[:240],"city":place["name"],"country":place.get("country",{}).get("name",""),"source_url":href,"image_url":image,"media_evidence_url":DOC,"price_numeric":detail.get("price"),"currency":detail.get("currencyCode"),"supplier_available":True,"supplier_published":True})
    return products

def generate_links(rows, opener=urlopen):
    token=os.getenv("TRAVELPAYOUTS_API_TOKEN") or os.getenv("TRAVELPAYOUTS_TOKEN")
    marker,trs=os.getenv("TRAVELPAYOUTS_MARKER",""),os.getenv("TRAVELPAYOUTS_TRS","")
    if not token or not marker.isdecimal() or not trs.isdecimal():raise ValueError("Configure server-only Travelpayouts token, marker and project ID")
    validated=[];seen=set()
    for row in rows:
        provider,ident=row.get("provider"),row.get("provider_product_id")
        url=product_url(provider,ident,row.get("source_url"))
        key=(provider,ident)
        if key in seen:raise ValueError("Duplicate supplier product identity")
        seen.add(key);validated.append({"provider":provider,"provider_product_id":ident,"source_url":url})
    # Reuse the existing tested transport; legacy keys are only input adapters for URL/sub_id.
    path=Path(__file__).resolve().parents[1]/"hotels/generate_travelpayouts_klook_links.py"
    spec=importlib.util.spec_from_file_location("existing_partner_transport",path);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    converted=[]
    for start in range(0,len(validated),10):
        if start:time.sleep(0.75)
        batch=validated[start:start+10]
        response=mod.api_batch([{"osm_source_id":r["provider"]+"_"+r["provider_product_id"],"provider_property_url":r["source_url"]} for r in batch],token=token,marker=marker,trs=trs,opener=opener)
        indexed={r.get("url"):r for r in response if isinstance(r,dict)}
        for row in batch:
            item=indexed.get(row["source_url"],{});target=item.get("partner_url")
            allowed={"tp.media",row["provider"]+".tpo.lv",row["provider"]+".tp.st"}
            if item.get("code")!="success" or not safe_url(target,allowed):raise ValueError("No matching verified affiliate conversion")
            converted.append({**row,"affiliate_url":target})
    return converted

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__);p.add_argument("mode",choices=["audit","fetch","links"]);p.add_argument("--input");p.add_argument("--output");p.add_argument("--city",default="Edinburgh");p.add_argument("--limit",type=int,default=4);args=p.parse_args(argv)
    if not 1<=args.limit<=20:p.error("Limit must be 1..20")
    if args.mode=="fetch":rows=collect(args.city,args.limit)
    else:
        if not args.input:p.error("--input is required")
        path=Path(args.input)
        if path.stat().st_size>15_000_000:p.error("Input too large")
        rows=json.loads(path.read_text());rows=rows.get("products",[]) if isinstance(rows,dict) else rows
        if not isinstance(rows,list) or len(rows)>25000 or any(not isinstance(row,dict) for row in rows):p.error("Expected bounded record list")
        if args.mode=="audit":print(json.dumps(audit(rows),indent=2));return 0
        rows=generate_links(rows)
    if not rows:raise ValueError("No original supplier products passed validation")
    if not args.output:p.error("--output is required")
    if args.input and Path(args.input).resolve()==Path(args.output).resolve():p.error("Never overwrite the source export")
    Path(args.output).write_text(json.dumps({"schema":1,"fetched_at":datetime.now(timezone.utc).isoformat(),"products":rows,"database_mutated":False},indent=2))
    print(json.dumps({"mode":args.mode,"products":len(rows),"image_source":"supplier" if args.mode=="fetch" else None,"database_mutated":False,"public_flags_changed":0}))
    return 0
if __name__=="__main__":
    try:sys.exit(main())
    except Exception as exc:
        # Never emit transport URLs, response bodies or credential-bearing errors.
        print("Tour engine could not complete; check supplier connectivity and configured input.",file=sys.stderr);sys.exit(1)
