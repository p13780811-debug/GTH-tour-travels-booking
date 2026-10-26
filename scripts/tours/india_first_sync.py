#!/usr/bin/env python3
"""India-first supplier inventory sync. Public WeGoTrip API only; zero synthetic tours.

Dry-run is the default. Database writes require --write and protected server secrets.
Legacy public.tours and public.activities are never read or modified.
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

API = "https://app.wegotrip.com/api/v2"
MEDIA_HOSTS = {"wgt-prod-storage.s3.amazonaws.com", "app.wegotrip.com"}
URL_RE = re.compile(r"^/([a-z0-9-]+)-d([1-9]\d*)/([a-z0-9-]+)-p([1-9]\d*)/$")
IMAGE_RE = re.compile(r"^/media/[^?#]+\.(?:jpe?g|png|webp)$", re.I)
MAX_BYTES = 1_500_000
MAX_COUNTRY_PAGES = 10
MAX_PRODUCT_PAGES = 5

def safe_url(value, hostnames):
    if not isinstance(value, str) or not 10 <= len(value) <= 2048:
        return None
    try:
        u = urlparse(value)
        if u.scheme == "https" and u.hostname in hostnames and u.port is None and not u.username and not u.password and not u.fragment:
            return u
    except ValueError:
        pass
    return None

def read_api(path, params, opener=urlopen):
    target = API + path + "?" + urlencode(params)
    with opener(Request(target, headers={"Accept": "application/json", "Accept-Language": "en",
        "User-Agent": "GTHPRO-SourceCatalog/1.0"}), timeout=22) as response:
        if "application/json" not in response.headers.get("Content-Type", ""):
            raise ValueError("Supplier returned non-JSON")
        if response.geturl() != target:
            raise ValueError("Unexpected supplier redirect")
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("Supplier body too large")
    doc = json.loads(raw)
    if not isinstance(doc, dict) or not isinstance(doc.get("data"), dict):
        raise ValueError("Invalid supplier envelope")
    return doc["data"]

def pages(path, params, max_pages, reader=read_api, sleeper=time.sleep):
    result = []
    for page in range(1, max_pages + 1):
        obj = reader(path, {**params, "page": str(page)})
        rows = obj.get("results")
        if not isinstance(rows, list) or len(rows) > 100:
            raise ValueError("Malformed supplier page")
        result.extend(rows)
        if not obj.get("next"):
            return result
        sleeper(0.4)
    return result

def countries(reader=read_api, sleeper=time.sleep):
    rows = pages("/countries/", {}, MAX_COUNTRY_PAGES, reader, sleeper)
    found = {}
    for item in rows:
        if not isinstance(item, dict):
            continue
        code, ident, name = item.get("code"), item.get("id"), item.get("name")
        if (isinstance(code, str) and re.fullmatch("[A-Z]{2}", code) and
                type(ident) is int and ident > 0 and isinstance(name, str) and name.strip()):
            found[code] = {"code": code, "id": ident, "name": name.strip()}
    if not found or "IN" not in found:
        raise ValueError("Supplier country catalogue missing India")
    return found

def image_check(image, opener=urlopen):
    u = safe_url(image, MEDIA_HOSTS)
    if not u or not IMAGE_RE.fullmatch(u.path) or u.query:
        return False
    try:
        with opener(Request(image, headers={"User-Agent":"GTHPRO-SourceCatalog/1.0",
                "Range":"bytes=0-63"}), timeout=14) as response:
            if response.geturl() != image or not response.headers.get("Content-Type", "").lower().startswith("image/"):
                return False
            sample = response.read(64)
            return bool(sample)
    except (OSError, ValueError, TimeoutError):
        return False

def normalize(row, detail, country, checked_at, photo_validator=image_check):
    if not isinstance(row, dict) or not isinstance(detail, dict):
        return None
    ident, city = row.get("id"), detail.get("city")
    if type(ident) is not int or ident <= 0 or detail.get("id") != ident:
        return None
    if detail.get("published") is not True or detail.get("available") is not True or detail.get("status") != "approved":
        return None
    if not isinstance(city, dict) or type(city.get("id")) is not int:
        return None
    if isinstance(row.get("city"), dict) and row["city"].get("id") != city["id"]:
        return None
    kind = detail.get("type", row.get("type"))
    if type(kind) is not int or kind not in (1, 2, 3):
        return None
    title, slug, city_slug, city_name = detail.get("title"), detail.get("slug"), city.get("slug"), city.get("name")
    if (not isinstance(title, str) or not 3 <= len(title.strip()) <= 240 or
            not isinstance(slug, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or
            not isinstance(city_slug, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", city_slug) or
            not isinstance(city_name, str) or not 2 <= len(city_name.strip()) <= 120):
        return None
    url = safe_url(detail.get("url"), {"wegotrip.com", "www.wegotrip.com"})
    m = URL_RE.fullmatch(url.path) if url and not url.query else None
    if not m or m.group(1) != city_slug or int(m.group(2)) != city["id"] or m.group(3) != slug or int(m.group(4)) != ident:
        return None
    image = detail.get("preview")
    if not photo_validator(image):
        return None
    cur, price = detail.get("currencyCode"), detail.get("price")
    if not isinstance(cur, str) or not re.fullmatch("[A-Z]{3}", cur):
        return None
    price = float(price) if type(price) in (float, int) and price > 0 else None
    return {
        "provider":"wegotrip", "provider_product_id":str(ident), "title":title.strip(),
        "country_code":country["code"], "country_name":country["name"],
        "city_id":city["id"], "city_name":city_name.strip(), "city_slug":city_slug,
        "product_slug":slug, "product_type":kind,
        "source_url":url.geturl(), "image_url":image, "currency":cur,
        "price_numeric":price, "source_verified":True, "image_verified":True,
        "available":True, "last_verified_at":checked_at,
    }

def collect_products(country, filters, *, reader=read_api,
                     photo_validator=image_check, sleeper=time.sleep,
                     max_products=20, max_pages=3, checked_at=None):
    checked_at = checked_at or datetime.now(timezone.utc).isoformat()
    candidates = pages("/products/popular/", {**filters, "lang":"en", "currency":"USD"},
                       max_pages, reader, sleeper)
    results, seen = [], set()
    for row in candidates:
        if len(results) >= max_products:
            break
        if not isinstance(row, dict) or type(row.get("id")) is not int or row["id"] in seen:
            continue
        seen.add(row["id"])
        if row.get("tags", {}).get("available") is not True or row.get("locale") != "en":
            continue
        sleeper(0.35)
        try:
            detail = reader("/products/%d/" % row["id"], {"currency":"USD"})
            product = normalize(row, detail, country, checked_at, photo_validator)
            if product:
                results.append(product)
        except (OSError, ValueError, TimeoutError, KeyError):
            continue
    return results, len(candidates)


def collect_country(country, *, reader=read_api, photo_validator=image_check,
                    sleeper=time.sleep, max_products=20, max_pages=3, checked_at=None):
    return collect_products(country, {"country":str(country["id"])}, reader=reader,
        photo_validator=photo_validator, sleeper=sleeper,
        max_products=max_products, max_pages=max_pages, checked_at=checked_at)


def collect_city(country, name, *, reader=read_api, photo_validator=image_check,
                 sleeper=time.sleep, max_products=8, checked_at=None):
    """Only use an exact available city belonging to the selected supplier country."""
    data=reader("/search/", {"query":name,"currency":"USD"})
    results=data.get("results")
    if not isinstance(results,list) or len(results)>100:
        raise ValueError("Invalid city search response")
    matches=[]
    for row in results:
        if not isinstance(row,dict) or row.get("type")!="city" or row.get("available") is not True:
            continue
        parent=row.get("country")
        if (isinstance(parent,dict) and parent.get("name")==country["name"]
                and isinstance(row.get("name"),str)
                and row["name"].casefold()==name.casefold()
                and type(row.get("id")) is int and row["id"]>0):
            matches.append(row)
    if len(matches)!=1:
        return [],0
    return collect_products(country, {"city":str(matches[0]["id"])},reader=reader,
        photo_validator=photo_validator,sleeper=sleeper,
        max_products=max_products,max_pages=2,checked_at=checked_at)

def upsert(rows, *, opener=urlopen, env=os.environ):
    if not rows:
        return 0
    edge = env.get("GTH_TOURS_EDGE_URL", "")
    oidc = env.get("GTH_TOURS_OIDC_TOKEN", "")
    if oidc:
        exact = "https://dqprqjmhxjnrllczqyhz.supabase.co/functions/v1/gth-tour-supplier-ingest"
        if edge != exact or len(oidc)>6000:
            raise ValueError("Invalid protected tour gateway")
        count = 0
        for offset in range(0,len(rows),30):
            data = json.dumps({"rows":rows[offset:offset+30]}).encode("utf-8")
            request = Request(exact, method="POST", data=data, headers={
                "Content-Type":"application/json","Authorization":"Bearer "+oidc,
                "User-Agent":"GTHPRO-SignedTourIngestion/1.0"})
            with opener(request,timeout=25) as response:
                if response.geturl()!=exact or response.status!=200:
                    raise ValueError("Signed tour inventory write rejected")
                result=json.loads(response.read(6000))
                if result.get("accepted")!=len(rows[offset:offset+30]):
                    raise ValueError("Signed tour write count mismatch")
            count+=len(rows[offset:offset+30])
        return count
    # Manual protected service-role path; scheduled cloud sync uses GitHub OIDC.
    origin = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    u = safe_url(origin, {urlparse(origin).hostname} if origin else set())
    if not key or not u or not (u.hostname or "").endswith(".supabase.co") or u.path:
        raise ValueError("Protected Supabase write configuration missing")
    endpoint = origin + "/rest/v1/tour_supplier_products?on_conflict=provider,provider_product_id"
    # Never persist a record without verified original product and supplier photo.
    if any(row.get("source_verified") is not True or row.get("image_verified") is not True for row in rows):
        raise ValueError("Unverified inventory cannot be written")
    total = 0
    for i in range(0, len(rows), 30):
        data = json.dumps(rows[i:i+30]).encode("utf-8")
        request = Request(endpoint, data=data, method="POST", headers={
            "apikey":key, "Authorization":"Bearer " + key, "Content-Type":"application/json",
            "Prefer":"resolution=merge-duplicates,return=minimal"})
        with opener(request, timeout=25) as response:
            if response.status not in (200, 201, 204):
                raise ValueError("Supplier inventory upsert rejected")
        total += len(rows[i:i+30])
    return total

def run(scope, *, reader=read_api, photo_validator=image_check, sleeper=time.sleep,
        writer=upsert, write=False, per_country=12, world_batch=8, today=None):
    today = today or datetime.now(timezone.utc).date()
    mapping = countries(reader, sleeper)
    if scope == "india":
        selected = [mapping["IN"]]
    elif scope == "world":
        others = sorted((v for k,v in mapping.items() if k != "IN"), key=lambda v:v["code"])
        if not others:
            raise ValueError("No worldwide supplier countries")
        # Sequential modulo rotation covers all available supplier countries across runs.
        index = today.toordinal() % ((len(others) + world_batch - 1) // world_batch)
        selected = others[index*world_batch:(index+1)*world_batch]
    else:
        raise ValueError("Unknown catalogue scope")
    products, summaries = [], []
    for country in selected:
        try:
            found, seen = collect_country(country, reader=reader, photo_validator=photo_validator,
                sleeper=sleeper, max_products=per_country)
            products.extend(found)
            summaries.append({"country":country["code"],"supplier_candidates":seen,
                "verified_products":len(found)})
        except (OSError, ValueError, TimeoutError, KeyError):
            summaries.append({"country":country["code"], "error":"supplier_unavailable"})
        sleeper(0.5)
    # Country-wide popular products are not a complete city inventory.
    # Revisit key Indian cities daily without fabricating products or depending on
    # the vendor's worldwide popularity ordering. Only approved detail/photos upsert.
    city_status=[]
    if scope=="india":
        for city in ("Mumbai","Agra","Jaipur"):
            try:
                found, seen = collect_city(mapping["IN"],city,reader=reader,
                    photo_validator=photo_validator,sleeper=sleeper,
                    max_products=min(8,per_country))
                products.extend(found)
                city_status.append({"city":city,"supplier_candidates":seen,
                    "verified_products":len(found)})
            except (OSError,ValueError,TimeoutError,KeyError):
                city_status.append({"city":city,"error":"supplier_unavailable"})
            sleeper(0.4)
    # Distinct supplier ID is the upsert identity, even when country and city
    # requests return the same valid item. An outage never deletes previous rows.
    products=list({(p["provider"],p["provider_product_id"]):p for p in products}.values())
    if not any("verified_products" in s for s in summaries+city_status):
        raise ValueError("All supplier countries failed")
    written = writer(products) if write else 0
    return {"scope":scope, "supplier_countries":len(mapping),
        "countries_checked":len(selected), "verified_products":len(products),
        "upserted":written, "dry_run":not write,"countries":summaries,\n        "india_city_checks":city_status}

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--scope", choices=["india", "world"], default="india")
    p.add_argument("--write", action="store_true")
    p.add_argument("--per-country", type=int, default=12)
    p.add_argument("--world-batch", type=int, default=8)
    args=p.parse_args(argv)
    if not 1 <= args.per_country <= 30 or not 1 <= args.world_batch <= 12:
        p.error("Outside conservative supplier quota")
    result=run(args.scope, write=args.write, per_country=args.per_country, world_batch=args.world_batch)
    print(json.dumps(result, ensure_ascii=False))
    return 0

if __name__=="__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, TimeoutError):
        # Never emit tokens, full response bodies or privileged URLs.
        print("Original supplier synchronization failed; check source and protected configuration.",file=sys.stderr)
        sys.exit(1)
