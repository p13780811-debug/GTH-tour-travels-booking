#!/usr/bin/env python3
"""Stage source-backed Klook, KKday and Tiqets products for human-reviewed publication.

No scraping, no database writes, no public flags. Takes only an approved
supplier feed/export with product IDs, exact URLs and photo-rights evidence.
"""
import argparse
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlparse
from catalog_engine import product_url

PARTNERS={"klook","kkday","tiqets"}
CATEGORIES={"city-tour","audio-tour","day-trip","attraction-ticket","city-pass","outdoor"}

def product(row, now=None):
    now=now or datetime.now(timezone.utc)
    if not isinstance(row,dict):raise ValueError("Invalid supplier row")
    provider=row.get("provider")
    if provider not in PARTNERS:raise ValueError("Unsupported supplier: no verified product feed")
    if row.get("source_type")!="approved_partner_feed" or row.get("media_rights_verified") is not True:
        raise ValueError("Missing authorized feed and confirmed image rights")
    if row.get("experience_category") not in CATEGORIES:raise ValueError("Unsupported experience type")
    ident=row.get("provider_product_id")
    if not isinstance(ident,str):raise ValueError("Missing supplier product identity")
    target=product_url(provider,ident,row.get("source_url"))
    image=row.get("image_url")
    if not isinstance(image,str) or len(image)>2048:raise ValueError("Missing approved supplier photo")
    u=urlparse(image)
    if u.scheme!="https" or not u.hostname or "." not in u.hostname or u.hostname=="localhost" or u.username or u.password or u.port or u.fragment:
        raise ValueError("Invalid approved photo HTTPS URL")
    if any(type(row.get(k)) is not int for k in ("image_width","image_height")) or row["image_width"]<640 or row["image_height"]<360:
        raise ValueError("Photo dimensions below threshold")
    for key,low,high in (("title",5,240),("city",2,100),("country",2,100)):
        val=row.get(key)
        if not isinstance(val,str) or not low<=len(val.strip())<=high:raise ValueError("Incomplete genuine product metadata")
    when=row.get("source_checked_at")
    try: checked=datetime.fromisoformat(when.replace("Z","+00:00")) if isinstance(when,str) and when.endswith("Z") else None
    except ValueError:checked=None
    if not checked or checked>now or now-checked>timedelta(days=30):
        raise ValueError("Supplier source check is expired or missing")
    price=row.get("price_numeric")
    if price is not None and (type(price) not in (float,int) or not 0<price<100000000):
        raise ValueError("Price is not source backed")
    curr=row.get("currency")
    if curr is not None and (not isinstance(curr,str) or len(curr)!=3 or not curr.isupper()):
        raise ValueError("Invalid supplier currency")
    # Source provenance is a human-review record; this tool does not grant image licences.
    return {key:row.get(key) for key in ("provider","provider_product_id","title","city","country","experience_category","image_url","image_width","image_height","media_rights_verified","source_type","source_checked_at","price_numeric","currency")} | {"source_url":target}

def review(rows,now=None):
    if not isinstance(rows,list) or len(rows)>1000:raise ValueError("Expected 0-1000 supplier products")
    approved=[];seen=set()
    for row in rows:
        candidate=product(row,now)
        key=(candidate["provider"],candidate["provider_product_id"])
        if key in seen:raise ValueError("Repeated supplier product identity")
        seen.add(key);approved.append(candidate)
    return approved

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input",required=True,help="Authorized supplier export with reviewed image rights")
    parser.add_argument("--output",required=True,help="Separate JSON staging file (never overwrite source)")
    args=parser.parse_args(argv)
    source,output=Path(args.input).resolve(),Path(args.output).resolve()
    if source==output or source.stat().st_size>5_000_000:parser.error("Unsafe input size or output path")
    data=json.loads(source.read_text(encoding="utf8"))
    rows=data.get("products") if isinstance(data,dict) else data
    vetted=review(rows)
    if not vetted:parser.error("No approved supplier products; do not publish empty/demo inventory")
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(vetted,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"source_rows":len(rows),"reviewed_product_rows":len(vetted),"database_mutated":False,"publication_flags_changed":0}))
if __name__=="__main__":main()
