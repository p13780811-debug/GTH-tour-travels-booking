#!/usr/bin/env python3
"""Import OSM accommodation GeoJSONSeq into the protected GTH PRO catalog.

Input: 'osmium export --geometry-types=point,linestring,polygon -f geojsonseq region.osm.pbf -o hotels.geojsonseq'
Runs locally/CI with GTH_INGESTION_ENABLED=true and server-only Supabase credentials.
No network scraping or API quota consumption; requires an ODbL-compatible source.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ALLOWED = {"hotel", "motel", "hostel", "guest_house", "apartment", "resort"}
BATCH = 200

def text_value(value, limit=240):
    return value.strip()[:limit] if isinstance(value, str) and value.strip() else None

def https_url(value):
    candidate = text_value(value, 500)
    if not candidate:
        return None
    try:
        parsed = urlparse(candidate)
        return candidate if parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password else None
    except ValueError:
        return None

def point_coords(geometry):
    """Use point geometry only: never invent polygon centroids as hotel entrances."""
    if not isinstance(geometry, dict) or geometry.get("type") != "Point":
        return None
    coords = geometry.get("coordinates")
    if not isinstance(coords, list) or len(coords) < 2:
        return None
    lon, lat = coords[:2]
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return None
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    return float(lat), float(lon)

def convert(feature):
    if not isinstance(feature, dict) or feature.get("type") != "Feature":
        return None
    props = feature.get("properties") or {}
    if not isinstance(props, dict):
        return None
    category = props.get("tourism")
    name = text_value(props.get("name"))
    position = point_coords(feature.get("geometry"))
    if category not in ALLOWED or not name or position is None:
        return None
    identifier = feature.get("id") or props.get("@id") or props.get("id")
    if not isinstance(identifier, (str, int)) or not text_value(str(identifier), 100):
        return None
    identifier = text_value(str(identifier), 100)
    # Osmium `--add-unique-id=type_id` exports n123 / w123, not node/123.
    # Map only identity-preserving node/way IDs; never use export counters.
    if __import__("re").fullmatch(r"n[0-9]+", identifier):
        identifier = "node/" + identifier[1:]
    elif __import__("re").fullmatch(r"w[0-9]+", identifier):
        identifier = "way/" + identifier[1:]
    # OSM identifiers must contain type and numeric id to avoid cross-type collisions.
    if not identifier or not __import__("re").fullmatch(r"(?:node|way|relation)/[0-9]+", identifier):
        return None
    city = text_value(props.get("addr:city") or props.get("is_in:city") or props.get("addr:place") or props.get("city"), 100)
    country = text_value(props.get("addr:country"), 2)
    street = " ".join(filter(None, [text_value(props.get("addr:housenumber"), 30), text_value(props.get("addr:street"), 150)]))
    image = https_url(props.get("image") or props.get("contact:image"))
    return {
        "source": "osm", "source_id": identifier, "name": name,
        "city": city, "country_code": country.upper() if country else None,
        "address": street or None, "latitude": position[0], "longitude": position[1],
        "image_url": image, "image_source": "osm_tag" if image else None,
        "website": https_url(props.get("website") or props.get("contact:website")),
        "phone": text_value(props.get("phone") or props.get("contact:phone"), 100),
        "category": category, "source_license": "ODbL-1.0",
        "source_url": "https://www.openstreetmap.org/" + identifier,
    }

def request_json(base, key, path, method="POST", payload=None, extra=None):
    url = base.rstrip("/") + "/rest/v1/" + path
    headers = {"apikey": key, "Authorization": "Bearer " + key,
               "Content-Type": "application/json", "Prefer": "return=minimal"}
    if extra:
        headers.update(extra)
    body = json.dumps(payload, separators=(",", ":")).encode() if payload is not None else None
    req = Request(url, data=body, method=method, headers=headers)
    for attempt in range(4):
        try:
            with urlopen(req, timeout=45) as response:
                return response.read()
        except HTTPError as err:
            if err.code in (429, 502, 503, 504) and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"Supabase request failed (HTTP {err.code})") from None
        except URLError:
            if attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError("Supabase connection unavailable") from None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path, help="OSM GeoJSONSeq / NDJSON point features")
    parser.add_argument("--limit", type=int, default=0, help="Maximum accepted records; 0 = all")
    parser.add_argument("--dry-run", action="store_true", help="Parse and count without writes")
    args = parser.parse_args()
    if not args.file.is_file() or args.limit < 0:
        parser.error("File must exist and --limit must be nonnegative")
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_INGESTION_KEY", "")
    if not args.dry_run:
        if os.environ.get("GTH_INGESTION_ENABLED") != "true":
            parser.error("Import disabled: set GTH_INGESTION_ENABLED=true")
        if not base.startswith("https://") or not key:
            parser.error("Missing valid NEXT_PUBLIC_SUPABASE_URL or server-side SUPABASE_INGESTION_KEY")
    batch, accepted, rejected = [], 0, 0

    def flush():
        if batch and not args.dry_run:
            request_json(base, key, "hotel_catalog?on_conflict=source,source_id",
                         payload=batch, extra={"Prefer": "resolution=merge-duplicates,return=minimal"})
        batch.clear()

    with args.file.open("r", encoding="utf-8") as stream:
        for line in stream:
            line = line.strip().lstrip("\x1e")
            if not line:
                continue
            try:
                record = convert(json.loads(line))
            except (ValueError, TypeError):
                record = None
            if record is None:
                rejected += 1
                continue
            batch.append(record)
            accepted += 1
            if len(batch) >= BATCH:
                flush()
                print(f"processed={accepted} rejected={rejected}", file=sys.stderr)
            if args.limit and accepted >= args.limit:
                break
    flush()
    print(json.dumps({"accepted": accepted, "rejected": rejected, "dry_run": args.dry_run,
                      "source_license": "ODbL-1.0", "verified_hotels": 0}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
