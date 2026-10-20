#!/usr/bin/env python3
"""Phase-1 hotel enrichment: source evidence only, no DB writes, no invented hotel amenities.
Public Nominatim usage is explicitly opted in, sequential, >=1.2s/request and cached.
Only explicit OSM/Wikidata hotel identity links may supply Commons property photos.
"""
from __future__ import annotations
import argparse
import hashlib
import html
import json
import math
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

UA = "GTHPRO-HotelPhase1/1.0 (https://gthproglobal.com/contact; official@gthproglobal.com)"
NOMINATIM = "https://nominatim.openstreetmap.org/reverse"
OVERPASS = "https://overpass-api.de/api/interpreter"
COMMONS = "https://commons.wikimedia.org/w/api.php"
ENTITY = "https://www.wikidata.org/wiki/Special:EntityData/"
ID = re.compile(r"^osm-(node|way|relation)-([1-9][0-9]*)$")
QID = re.compile(r"^Q[1-9][0-9]{0,14}$")
LICENSES = {"CC BY 4.0", "CC BY-SA 4.0", "CC BY 3.0", "CC BY-SA 3.0",
            "CC0", "CC0 1.0", "Public domain"}
STATES = {"Digha": "West Bengal", "Puri": "Odisha", "Mumbai": "Maharashtra"}
REQUIRED = ("id", "name", "locality", "city", "lat", "lon", "source_url")

def text(v, limit=400):
    return v.strip()[:limit] if isinstance(v, str) and v.strip() else None

def plain(v):
    return text(html.unescape(re.sub(r"<[^>]*>", "", str(v or ""))), 400) or ""

def name_key(v):
    return " ".join(re.findall(r"[^\W_]+", str(v or "").casefold(), re.UNICODE))

def https(v, hosts):
    if not isinstance(v, str):
        return None
    p = urlsplit(v.strip())
    return v.strip() if p.scheme == "https" and p.hostname in hosts and not (p.username or p.password or p.port) else None

def fetch_json(url, host, *, payload=None, retries=2):
    if not https(url, {host}):
        raise ValueError("unapproved network destination")
    headers = {"User-Agent": UA, "Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    for attempt in range(retries + 1):
        try:
            req = Request(url, data=payload, headers=headers)
            with urlopen(req, timeout=30) as res:
                if int(res.headers.get("Content-Length", "0")) > 4_000_000:
                    raise ValueError("response too large")
                blob = res.read(4_000_001)
                if len(blob) > 4_000_000:
                    raise ValueError("response too large")
                return json.loads(blob)
        except HTTPError as exc:
            if exc.code in (429, 502, 503, 504) and attempt < retries:
                wait = min(30, max(2 ** (attempt + 1), int(exc.headers.get("Retry-After", "0") or 0)))
                time.sleep(wait)
                continue
            raise
        except URLError:
            if attempt < retries:
                time.sleep(2 ** (attempt + 1))
                continue
            raise

class JsonCache:
    def __init__(self, path):
        self.path = Path(path)
        self.data = json.loads(self.path.read_text(encoding="utf8")) if self.path.exists() else {}
        if not isinstance(self.data, dict):
            raise ValueError("invalid cache format")

    def get(self, key):
        return self.data.get(key)

    def put(self, key, value):
        self.data[key] = value
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(".tmp")
        temp.write_text(json.dumps(self.data, ensure_ascii=False), encoding="utf8")
        temp.replace(self.path)

class PublicNominatim:
    """Opt-in single-thread cache; not for scheduled/bulk website lookups."""
    def __init__(self, cache, enabled=False, sleep=time.sleep, fetch=fetch_json):
        self.cache, self.enabled, self.sleep, self.fetch = cache, enabled, sleep, fetch
        self.last = None

    def reverse(self, rec):
        key = "reverse:v1:%.6f:%.6f" % (rec["lat"], rec["lon"])
        result = self.cache.get(key)
        if result is not None:
            return result
        if not self.enabled:
            return None
        if self.last is not None:
            self.sleep(max(0, 1.2 - (time.monotonic() - self.last)))
        self.last = time.monotonic()
        args = urlencode({"format":"jsonv2", "addressdetails":1, "lat":rec["lat"], "lon":rec["lon"],
                          "zoom":18, "email":"official@gthproglobal.com"})
        try:
            data = self.fetch(NOMINATIM + "?" + args, "nominatim.openstreetmap.org")
        except (HTTPError, URLError, ValueError, TimeoutError):
            return None
        if isinstance(data, dict) and data.get("address"):
            self.cache.put(key, data)
            return data
        return None

def osm_tags_query(records):
    terms = []
    for rec in records:
        m = ID.fullmatch(str(rec.get("id", "")))
        if m:
            terms.append(m.group(1) + "(id:" + m.group(2) + ");")
    return "[out:json][timeout:45];(" + "".join(terms) + ");out center tags;"

def refresh_tags(records, cache, enabled=False, fetch=fetch_json, sleep=time.sleep):
    """Query ONLY snapshot element IDs; never city-wide. Existing identities stay untouched."""
    result = {}
    if not enabled:
        return result
    for offset in range(0, len(records), 25):
        batch = records[offset:offset + 25]
        key = "osm-tags:v1:" + hashlib.sha256(osm_tags_query(batch).encode()).hexdigest()
        data = cache.get(key)
        if data is None:
            try:
                data = fetch(OVERPASS, "overpass-api.de",
                             payload=urlencode({"data":osm_tags_query(batch)}).encode())
            except (HTTPError, URLError, ValueError, TimeoutError):
                sleep(2)
                continue
            cache.put(key, data)
            sleep(2)
        for el in data.get("elements", []):
            eid = "osm-%s-%s" % (el.get("type"), el.get("id"))
            if any(row["id"] == eid for row in batch) and isinstance(el.get("tags"), dict):
                result[eid] = el["tags"]
    return result

def tagged_address(tags):
    full = text(tags.get("addr:full"))
    if full:
        return full
    fields = [text(tags.get(x)) for x in ("addr:housenumber", "addr:street", "addr:suburb",
                                          "addr:neighbourhood", "addr:city", "addr:district",
                                          "addr:state", "addr:postcode")]
    fields = list(dict.fromkeys(x for x in fields if x))
    return ", ".join(fields) if fields else None

def address_with_source(record, tags, reverse):
    exact = tagged_address(tags)
    if exact:
        return exact, "osm_element_address_tag", exact, None
    old = text(record.get("address"))
    if old:
        return old, "existing_osm_catalog_address", old, None
    nearby = None
    if isinstance(reverse, dict):
        osm = ID.fullmatch(record["id"])
        same = (osm and str(reverse.get("osm_id")) == osm.group(2)
                and str(reverse.get("osm_type")) == osm.group(1))
        if same:
            adr = reverse.get("address") or {}
            street = text(adr.get("road") or adr.get("pedestrian") or adr.get("residential"))
            house = text(adr.get("house_number"))
            if street:
                addr = ", ".join(x for x in [house, street, text(adr.get("suburb")),
                              text(adr.get("postcode"))] if x)
                return addr, "nominatim_same_osm_element", addr, None
        # Reverse geocoding often returns a nearby unrelated feature: vicinity only.
        nearby = text((reverse.get("address") or {}).get("road"))
    # This is *display-only*, not a verified street or registration address.
    display = ", ".join([record["name"], record["locality"], record["city"], STATES[record["city"]]])
    return display, "locality_display_fallback_not_street_verified", None, nearby

def amenities(tags):
    """Only map positively recorded source tags; no silent feature assumptions."""
    out = []
    def add(label, good):
        if good and label not in out:
            out.append(label)
    yes = lambda k: str(tags.get(k, "")).lower() in ("yes", "true", "1", "designated")
    wifi = str(tags.get("internet_access", "")).lower() in ("wlan", "wifi") or yes("internet_access:wlan")
    add("Wi-Fi", wifi)
    add("Free Wi-Fi", wifi and (str(tags.get("internet_access:fee", "")).lower() in ("no", "free")
                               or str(tags.get("fee:internet", "")).lower() in ("no", "free")))
    add("Air conditioning", yes("air_conditioning") or yes("air_conditioned"))
    add("Swimming pool", yes("swimming_pool") or yes("pool"))
    add("Parking", yes("parking") or text(tags.get("parking")) in ("surface", "underground", "multi-storey"))
    add("Restaurant", yes("restaurant") or str(tags.get("amenity", "")).lower() == "restaurant")
    add("Wheelchair accessible", str(tags.get("wheelchair", "")).lower() == "yes")
    add("Room service", yes("room_service"))
    add("24/7 Room Service", yes("room_service:24_7") or str(tags.get("room_service:opening_hours", "")) == "24/7")
    add("TV", yes("television") or yes("tv"))
    add("Smart TV", yes("smart_tv"))
    add("Power backup", yes("backup_generator") or yes("power_backup"))
    add("CCTV security", yes("surveillance") and str(tags.get("surveillance:type", "")).lower() == "camera")
    return out

def tagged_stars(tags):
    v = tags.get("stars")
    return int(v) if isinstance(v, str) and re.fullmatch("[1-5]", v) else None

def wikidata_photos(tags, hotel_name, cache, fetch=fetch_json):
    """Only exact OSM wikidata tag + name-confirmed entity P18, plus explicit Commons File."""
    files = []
    candidate = text(tags.get("wikimedia_commons"))
    if candidate and candidate.startswith("File:"):
        files.append(candidate[5:])
    qid = text(tags.get("wikidata"))
    if qid and QID.fullmatch(qid):
        url = ENTITY + qid + ".json"
        key = "wikidata:v1:" + qid
        data = cache.get(key)
        if data is None:
            try:
                data = fetch(url, "www.wikidata.org")
                cache.put(key, data)
            except (HTTPError, URLError, ValueError, TimeoutError):
                data = {}
        item = (data.get("entities") or {}).get(qid, {})
        names = [v.get("value", "") for v in (item.get("labels") or {}).values()]
        names += [v.get("value", "") for arr in (item.get("aliases") or {}).values() for v in arr]
        if name_key(hotel_name) in {name_key(x) for x in names}:
            for claim in (item.get("claims") or {}).get("P18", [])[:5]:
                filename = (claim.get("mainsnak", {}).get("datavalue") or {}).get("value")
                if isinstance(filename, str):
                    files.append(filename)
    return list(dict.fromkeys(files))[:5]

def commons_file(filename, cache, fetch=fetch_json, verify_head=True):
    if not isinstance(filename, str) or not 3 <= len(filename) <= 200:
        return None
    # Only local Wikimedia API file names; no external URL or Commons search result.
    if "/" in filename or "\\" in filename or any(c in filename for c in "\r\n\0"):
        return None
    filename = filename.removeprefix("File:")
    key = "commons:v1:" + filename
    data = cache.get(key)
    if data is None:
        url = COMMONS + "?" + urlencode({
            "action":"query", "format":"json", "prop":"imageinfo", "titles":"File:" + filename,
            "iiprop":"url|mime|extmetadata", "iiurlwidth":"1000"})
        try:
            data = fetch(url, "commons.wikimedia.org")
            cache.put(key, data)
        except (HTTPError, URLError, ValueError, TimeoutError):
            return None
    pages = (data.get("query") or {}).get("pages") or {}
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        license_name = plain((meta.get("LicenseShortName") or {}).get("value"))
        artist = plain((meta.get("Artist") or {}).get("value"))
        url = https(info.get("thumburl") or info.get("url"), {"upload.wikimedia.org"})
        if license_name not in LICENSES or not artist or not url:
            continue
        if str(info.get("mime", "")).lower() not in ("image/jpeg", "image/png", "image/webp"):
            continue
        if verify_head:
            try:
                with urlopen(Request(url, headers={"User-Agent":UA}, method="HEAD"), timeout=20) as response:
                    if response.status != 200 or not response.headers.get("Content-Type", "").startswith("image/"):
                        continue
            except (HTTPError, URLError, TimeoutError):
                continue
        return {"url":url, "file_page":"https://commons.wikimedia.org/wiki/File:" + filename.replace(" ","_"),
                "license":license_name, "license_url":plain((meta.get("LicenseUrl") or {}).get("value")),
                "artist":artist, "kind":"hotel_property_photo", "verified_identity":"explicit_osm_link"}
    return None

def validate(records, initial):
    ids = [r.get("id") for r in records]
    issues = []
    if len(records) != 166:
        issues.append("expected exactly 166 existing Phase 1 OSM source IDs")
    if len(set(ids)) != len(ids):
        issues.append("duplicate OSM IDs")
    for r in records:
        if any(not r.get(k) for k in ("id", "name", "city", "locality", "source_url")):
            issues.append("missing source identity")
        if not isinstance(r.get("lat"), (int, float)) or not isinstance(r.get("lon"), (int, float)):
            issues.append("invalid coordinates")
        elif not (-90 <= r["lat"] <= 90 and -180 <= r["lon"] <= 180 and math.isfinite(r["lat"]) and math.isfinite(r["lon"])):
            issues.append("invalid coordinates")
    original = {r["id"]:(r["name"],r["lat"],r["lon"]) for r in initial}
    if set(original) != set(ids) or any(original[r["id"]] != (r["name"],r["lat"],r["lon"]) for r in records if r["id"] in original):
        issues.append("original OSM identity/name/coordinates mutated")
    counts = {"property_photos":sum(bool(r["gallery"]) for r in records),
              "missing_verified_street_addresses":sum(not r["street_address"] for r in records),
              "missing_property_photos":sum(not r["gallery"] for r in records),
              "missing_documented_amenities":sum(not r["facilities"] for r in records),
              "missing_ratings":sum(r["stars"] is None for r in records),
              "missing_exact_affiliates":sum(r["affiliate_url"] is None for r in records)}
    return {"structurally_valid":not issues, "issues":list(dict.fromkeys(issues)),
            "counts":counts,"fully_enriched":not issues and all(v == 0 for k,v in counts.items() if k != "property_photos")}

def enrich(snapshot, cache, nominatim, tags_by_id=None, commons=True, fetch=fetch_json):
    initial = snapshot["records"]
    seen = set()
    output = []
    for raw in initial:
        rid = raw.get("id")
        if rid in seen:
            raise ValueError("duplicate record " + str(rid))
        seen.add(rid)
        if not ID.fullmatch(str(rid)) or raw.get("city") not in STATES:
            raise ValueError("outside Phase 1 or invalid OSM source ID")
        rec = dict(raw)
        tags = (tags_by_id or {}).get(rid, {})
        near = nominatim.reverse(rec) if not raw.get("address") and not tagged_address(tags) else None
        address, source, street, vicinity = address_with_source(rec, tags, near)
        rec.update({"address":address, "street_address":street, "address_source":source,
                    "vicinity_road_unverified":vicinity, "state":STATES[rec["city"]],
                    "stars":tagged_stars(tags), "stars_source":"osm_tag_not_government_certification" if tagged_stars(tags) else None,
                    "facilities":amenities(tags), "facilities_source":"osm_element_tags" if amenities(tags) else None,
                    "thumbnail":None, "gallery":[], "media_evidence":[], "illustrative_gallery":[],
                    "affiliate_url":None, "affiliate_status":"requires_exact_provider_property_id"})
        if commons:
            for file in wikidata_photos(tags, rec["name"], cache, fetch=fetch):
                media = commons_file(file, cache, fetch=fetch)
                if media and media["url"] not in rec["gallery"]:
                    rec["media_evidence"].append(media)
                    rec["gallery"].append(media["url"])
        if rec["gallery"]:
            rec["thumbnail"] = rec["gallery"][0]
        output.append(rec)
    report = validate(output, initial)
    return {"phase":1, "dataset_type":"OSM-sourced enrichment; not an official registry",
            "source_snapshot":"phase1-existing-osm-catalog-snapshot.json", "hotel_count":len(output),
            "nominatim_attribution":"© OpenStreetMap contributors, ODbL 1.0",
            "readiness":report, "records":output}

def main(argv=None):
    p=argparse.ArgumentParser(description="NO DB writes or deployed website changes")
    p.add_argument("--input", type=Path, default=Path("docs/hotels/phase1-existing-osm-catalog-snapshot.json"))
    p.add_argument("--output", type=Path, default=Path("final_enriched_hotels_166.json"))
    p.add_argument("--cache", type=Path, default=Path(".cache/hotels/phase1_enrichment.json"))
    p.add_argument("--refresh-osm-tags", action="store_true", help="Fetch source tags for exact 166 IDs only")
    p.add_argument("--allow-public-nominatim", action="store_true", help="One-time/manual, cached, 1 request/1.2s; read OSMF policy first")
    p.add_argument("--no-commons", action="store_true", help="Skip Commons media API checks")
    args=p.parse_args(argv)
    source=json.loads(args.input.read_text(encoding="utf8"))
    cache=JsonCache(args.cache)
    rows=source.get("records")
    if not isinstance(rows, list) or len(rows)!=166:
        p.error("phase 1 source must contain exactly 166 verified OSM source identities")
    osm_tags=refresh_tags(rows, cache, enabled=args.refresh_osm_tags)
    result=enrich(source, cache, PublicNominatim(cache, args.allow_public_nominatim),
                  tags_by_id=osm_tags, commons=not args.no_commons)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False)+"\n", encoding="utf8")
    print(json.dumps(result["readiness"], indent=2))
    return 0 if result["readiness"]["structurally_valid"] else 2

if __name__ == "__main__":
    raise SystemExit(main())
