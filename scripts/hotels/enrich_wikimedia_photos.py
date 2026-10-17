#!/usr/bin/env python3
"""Licensed photo overlays for OSM-linked Wikidata hotels, not an image scraper.

Scans the same OSM GeoJSONSeq already downloaded by the existing licensed
Geofabrik workflow. Uses *explicit* OSM wikidata=Q... source links, checks
Wikidata hotel name and optional location, then validates one photo's exact
Commons license and author before sending metadata through GitHub OIDC.
Never copies image bytes into GTH PRO; no API keys, paid Google, or RapidAPI.
"""
import argparse
import html
import json
import math
import os
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from import_osm_hotels import convert

USER_AGENT = "GTHProHotelCommonsBot/1.0 (https://www.gthproglobal.com/contact; OSM-attributed public hotel photo enrichment)"
WIKIDATA = "https://www.wikidata.org/wiki/Special:EntityData/"
COMMONS = "https://commons.wikimedia.org/w/api.php"
GATEWAY = "https://dqprqjmhxjnrllczqyhz.supabase.co/functions/v1/gth-hotel-wikimedia"
LICENCES = {
    "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
    "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
    "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
    "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
    "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "Public domain": "https://creativecommons.org/publicdomain/mark/1.0/",
}
QID = re.compile(r"Q[1-9][0-9]{0,14}\Z")
IMAGE_FILE = re.compile(r"\.(?:jpe?g|png|webp)\Z", re.I)


def normalized(value):
    import unicodedata
    if not isinstance(value, str):
        return ""
    value = unicodedata.normalize("NFKD", value).casefold()
    return " ".join(re.findall(r"[^\W_]+", value, flags=re.UNICODE))


def distance(a, b):
    lat1, lon1 = a
    lat2, lon2 = b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat, dlon = p2 - p1, math.radians(lon2-lon1)
    h = math.sin(dlat/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dlon/2)**2
    return 2 * 6371008.8 * math.asin(min(1, math.sqrt(max(0, h))))


def get_json(url, attempts=3):
    for retry in range(attempts):
        request = Request(url, headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json"
        })
        try:
            with urlopen(request, timeout=15) as response:
                if response.headers.get("Content-Length") and int(response.headers["Content-Length"]) > 1_000_000:
                    return None
                body = response.read(1_000_001)
                if len(body) > 1_000_000:
                    return None
                return json.loads(body)
        except HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504):
                return None
            if retry + 1 == attempts:
                return None
            header = error.headers.get("Retry-After", "")
            delay = min(30, max(2, int(header))) if header.isdecimal() else 2**retry * 2
            time.sleep(delay)
        except (URLError, TimeoutError, ValueError, json.JSONDecodeError):
            if retry + 1 == attempts:
                return None
            time.sleep(2 ** retry)
    return None


def valid_url(value, host, prefix=None):
    if not isinstance(value, str) or len(value) > 1600:
        return False
    try:
        u = urlparse(value)
        return (u.scheme == "https" and u.hostname == host and not u.username and not u.password
                and not u.port and not u.query and not u.fragment
                and (prefix is None or u.path.startswith(prefix)))
    except ValueError:
        return False


def clean(value, maxlen):
    if not isinstance(value, str):
        return ""
    value = html.unescape(re.sub(r"<[^>]*>", " ", value))
    return re.sub(r"\s+", " ", value).strip()[:maxlen]


def entity_photo(qid, hotel_name, lat, lon):
    entity_data = get_json(WIKIDATA + qid + ".json")
    item = ((entity_data or {}).get("entities") or {}).get(qid) or {}
    if not isinstance(item, dict):
        return None
    labels = item.get("labels") or {}
    aliases = item.get("aliases") or {}
    valid_names = [entry.get("value") for entry in labels.values() if isinstance(entry, dict)]
    valid_names += [entry.get("value") for values in aliases.values()
                    if isinstance(values, list) for entry in values if isinstance(entry, dict)]
    if normalized(hotel_name) not in {normalized(x) for x in valid_names if isinstance(x, str)}:
        return None
    claims = item.get("claims") or {}
    coordinates = claims.get("P625") or []
    if coordinates:
        geo = (coordinates[0].get("mainsnak") or {}).get("datavalue") or {}
        coord = geo.get("value") or {}
        if not isinstance(coord, dict):
            return None
        wikilat, wikilon = coord.get("latitude"), coord.get("longitude")
        if not isinstance(wikilat, (int, float)) or not isinstance(wikilon, (int, float)):
            return None
        if not math.isfinite(wikilat) or not math.isfinite(wikilon) or distance((lat, lon), (wikilat, wikilon)) > 1200:
            return None
    image_claims = claims.get("P18") or []
    if not image_claims:
        return None
    filename = ((image_claims[0].get("mainsnak") or {}).get("datavalue") or {}).get("value")
    if not isinstance(filename, str) or len(filename) > 240 or not IMAGE_FILE.search(filename) or any(c in filename for c in "<>\r\n|"):
        return None
    return filename


def commons_metadata(filename):
    query = urlencode({
        "action": "query", "format": "json", "formatversion": "2", "prop": "imageinfo",
        "titles": "File:" + filename, "iiprop": "url|mime|extmetadata",
        "iiurlwidth": "960", "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Attribution|NonFree|Restrictions",
    })
    result = get_json(COMMONS + "?" + query)
    pages = ((result or {}).get("query") or {}).get("pages") or []
    if not pages or not isinstance(pages[0], dict):
        return None
    info = (pages[0].get("imageinfo") or [])
    if not info or not isinstance(info[0], dict):
        return None
    meta = info[0].get("extmetadata") or {}
    field = lambda key: (meta.get(key) or {}).get("value")
    if clean(field("NonFree"), 40).lower() == "true" or clean(field("Restrictions"), 100):
        return None
    label = clean(field("LicenseShortName"), 80)
    license_url = clean(field("LicenseUrl"), 180)
    if license_url.startswith("http://creativecommons.org/"):
        license_url = "https://" + license_url[len("http://"):]
    if label not in LICENCES or license_url != LICENCES[label]:
        return None
    author = clean(field("Attribution") or field("Artist"), 400)
    if not author:
        if label in ("CC0", "Public domain"):
            author = "Creator unknown; see Wikimedia Commons source"
        else:
            return None
    image_url = info[0].get("thumburl") or info[0].get("url")
    title = pages[0].get("title")
    if not isinstance(title, str) or not title.startswith("File:"):
        return None
    from urllib.parse import quote
    commons_page = "https://commons.wikimedia.org/wiki/" + quote(title.replace(" ", "_"), safe=":_()-")
    if not (valid_url(image_url, "upload.wikimedia.org", "/wikipedia/commons/")
            and IMAGE_FILE.search(urlparse(image_url).path)
            and valid_url(commons_page, "commons.wikimedia.org", "/wiki/File:")):
        return None
    return {"image_url": image_url, "commons_page": commons_page,
            "author": author, "license_name": label, "license_url": license_url}


def candidates(path):
    found = {}
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            line = line.strip().lstrip("\x1e")
            if not line:
                continue
            try:
                feature = json.loads(line)
                props = feature.get("properties") or {}
                qid = props.get("wikidata")
                if not isinstance(qid, str) or not QID.fullmatch(qid):
                    continue
                hotel = convert(feature)
                if hotel is not None:
                    found[hotel["source_id"]] = (qid, hotel)
            except (ValueError, TypeError, AttributeError):
                continue
    return sorted(found.items())


def upload(records, edge_url, token):
    if edge_url != GATEWAY or not token or len(records) > 24:
        raise RuntimeError("Protected Wikimedia gateway not configured")
    data = json.dumps({"records": records}, separators=(",", ":")).encode()
    request = Request(edge_url, method="POST", data=data, headers={
        "Content-Type": "application/json", "Authorization": "Bearer " + token
    })
    try:
        with urlopen(request, timeout=35) as response:
            reply = json.load(response)
        return reply.get("accepted") == len(records)
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError):
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--rotation-slot", type=int, default=0)
    parser.add_argument("--edge-url", default="")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not args.file.is_file() or not 1 <= args.limit <= 24 or args.rotation_slot < 0:
        parser.error("Invalid source file, limit or rotation slot")
    rows = candidates(args.file)
    pages = max(1, math.ceil(len(rows)/args.limit))
    batch = rows[(args.rotation_slot % pages)*args.limit:(args.rotation_slot % pages+1)*args.limit]
    if args.dry_run:
        print(json.dumps({"candidates": len(rows), "sampled": len(batch), "mode": "dry-run"}))
        return 0
    if os.environ.get("GTH_INGESTION_ENABLED") != "true":
        parser.error("Public enrichment disabled")
    token = os.environ.get("GTH_HOTEL_OIDC_TOKEN", "")
    if not token or args.edge_url != GATEWAY:
        parser.error("GitHub OIDC token and project-bound gateway required")
    processed, approved = 0, []
    for source_id, (qid, hotel) in batch:
        processed += 1
        filename = entity_photo(qid, hotel["name"], hotel["latitude"], hotel["longitude"])
        if not filename:
            time.sleep(0.6)
            continue
        media = commons_metadata(filename)
        if media:
            approved.append({"source": "osm", "source_id": source_id, "wikidata_qid": qid, **media})
        time.sleep(1.0)
    if approved and not upload(approved, args.edge_url, token):
        print("Wikimedia media overlay sync unavailable; OSM directory remains intact.", file=sys.stderr)
        return 1
    print(json.dumps({"candidates": len(rows), "checked": processed, "licensed_media": len(approved),
                      "verified_booking_inventory": 0, "source": "Wikimedia Commons"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
