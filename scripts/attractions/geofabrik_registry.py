#!/usr/bin/env python3
"""Resolve reviewed HTTPS Geofabrik leaf extracts to source-declared single ISO countries.
No guessing download paths, admin borders or private OSM contributor metadata.
"""
import argparse
import json
import re
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from urllib.request import Request, urlopen

INDEX = "https://download.geofabrik.de/index-v1-nogeom.json"
BASE = "https://download.geofabrik.de/"
PATH = re.compile(r"^[a-z0-9-]+(?:/[a-z0-9-]+){0,5}$")
CODE = re.compile(r"^[A-Z]{2}$")


def eligible_regions(document):
    features = document.get("features") if isinstance(document, dict) else None
    if not isinstance(features, list):
        raise ValueError("Invalid Geofabrik regional index")
    props = [f.get("properties") for f in features if isinstance(f, dict)]
    props = [p for p in props if isinstance(p, dict) and isinstance(p.get("id"), str)]
    by_id = {p["id"]: p for p in props}
    has_children = {p.get("parent") for p in props}
    accepted = []
    for p in props:
        key = p["id"]
        if key in has_children:
            continue
        url = (p.get("urls") or {}).get("pbf")
        if not isinstance(url, str) or not url.startswith(BASE) or not url.endswith("-latest.osm.pbf"):
            continue
        region = url[len(BASE):-len("-latest.osm.pbf")]
        if not PATH.fullmatch(region):
            continue
        visited = set()
        ancestor = p
        country = None
        while ancestor and ancestor.get("id") not in visited:
            visited.add(ancestor["id"])
            codes = ancestor.get("iso3166-1:alpha2")
            if isinstance(codes, list):
                # Multi-country Geofabrik extracts cannot certify a place's ISO country.
                if len(codes) != 1 or not isinstance(codes[0], str) or not CODE.fullmatch(codes[0]):
                    country = None
                    break
                country = (codes[0], ancestor.get("name"))
                break
            ancestor = by_id.get(ancestor.get("parent"))
        if not country:
            continue
        code, name = country
        if not isinstance(name, str) or not 2 <= len(name) <= 100 or any(ord(c) < 32 for c in name):
            continue
        accepted.append({"region": region, "country_code": code, "country_name": name, "url": url})
    return sorted(accepted, key=lambda x: (x["country_code"], x["region"]))


def resolve(document, slot=0, requested=None):
    regions = eligible_regions(document)
    if not regions:
        raise ValueError("No single-country licensed regions in source index")
    if requested:
        return next((r for r in regions if r["region"] == requested), None) or (
            (_ for _ in ()).throw(ValueError("Requested region is not a reviewed single-country extract"))
        )
    return regions[slot % len(regions)]


# One hosted run per hour; schedule geographical groups in approximate
# low-traffic local windows (NOT authoritative timezone information).
# Each window rotates through all eligible, single-country Geofabrik leaves.
UTC_SOURCE_WINDOWS = (
    frozenset(("europe", "africa")),                # 00–05 UTC
    frozenset(("north-america", "central-america", "south-america")),  # 06–11 UTC
    frozenset(("australia-oceania",)),              # 12–17 UTC
    frozenset(("asia",)),                           # 18–23 UTC
)


# Representative country time zones. Use the IANA tzdata country list for
# other countries; never infer time zones from POI names or coordinates.
PREFERRED_COUNTRY_ZONES = {
    "US": "America/New_York", "CA": "America/Toronto",
    "AU": "Australia/Sydney", "NZ": "Pacific/Auckland",
    "IN": "Asia/Kolkata", "FR": "Europe/Paris",
    "RU": "Europe/Moscow", "BR": "America/Sao_Paulo",
    "CN": "Asia/Shanghai",
}


@lru_cache(maxsize=1)
def country_time_zones():
    found = {}
    try:
        # Ubuntu GitHub runners ship this public IANA tzdata country registry.
        for line in Path("/usr/share/zoneinfo/zone.tab").read_text(encoding="utf-8").splitlines():
            if line.startswith("#") or not line.strip():
                continue
            fields = line.split("\t")
            if len(fields) >= 3 and CODE.fullmatch(fields[0]):
                found.setdefault(fields[0], fields[2])
    except OSError:
        pass
    found.update(PREFERRED_COUNTRY_ZONES)
    return found


def select_scheduled_region(regions, now=None, status=None):
    """Choose one single-country extract in its representative local 01-06h.

    UTC regional fallback covers missing IANA timezone mappings. Selection
    advances daily and works without secrets or persistent cursor state.
    Multi-time-zone countries use one representative zone, not city-level time.
    """
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError("UTC-aware scheduling clock required")
    utc = now.astimezone(timezone.utc)
    group = utc.hour // 6
    allowed = UTC_SOURCE_WINDOWS[group]
    zones = country_time_zones()
    local_night = []
    for item in regions:
        zone = zones.get(item["country_code"])
        if not zone:
            continue
        try:
            country_hour = utc.astimezone(ZoneInfo(zone)).hour
        except ZoneInfoNotFoundError:
            continue
        if 1 <= country_hour < 6:
            local_night.append(item)
    # A country-aware local overnight selection takes precedence. If a
    # timezone is absent or no source is eligible, retain the safe reviewed
    # regional UTC fallback rather than silently disabling synchronization.
    candidates = local_night or [r for r in regions if r["region"].split("/", 1)[0] in allowed]
    if not candidates:
        raise ValueError("No licensed source in this UTC region window")
    # With signed DB receipts, finish partial extracts first, then visit regions
    # never scanned, then refresh the oldest completed extract. One source/hour.
    # No in-memory or GitHub runner-local cursor may silently reset progress.
    if status is not None:
        def priority(item):
            run = status.get(item["region"])
            if run and not run["complete"]:
                return (0, run["last_completed_at"], item["region"])
            if run is None:
                return (1, "", item["region"])
            return (2, run["last_completed_at"], item["region"])
        return min(candidates, key=priority), group
    # Offline/backward compatible selection for tests and standalone previews.
    slot = (utc.date().toordinal() + utc.hour) % len(candidates)
    return candidates[slot], group

def read_source_status(path):
    """Read a bounded, authenticated gateway status snapshot from runner disk."""
    if path is None:
        return None
    if path.stat().st_size > 300000:
        raise ValueError("Source status too large")
    doc = json.loads(path.read_text(encoding="utf-8"))
    rows = doc.get("regions") if isinstance(doc, dict) else None
    if not isinstance(rows, list) or len(rows) > 3000:
        raise ValueError("Invalid source status")
    result = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Invalid source status row")
        region = row.get("source_region")
        offset = row.get("next_offset")
        complete = row.get("complete")
        completed_at = row.get("last_completed_at")
        if (not isinstance(region, str) or not PATH.fullmatch(region)
                or type(offset) is not int or not 0 <= offset <= 10000000
                or type(complete) is not bool or not isinstance(completed_at, str)
                or len(completed_at) > 80 or (not complete and offset == 0)
                or region in result):
            raise ValueError("Invalid region resume marker")
        result[region] = {"next_offset": offset, "complete": complete,
                          "last_completed_at": completed_at}
    return result


def scheduled_window_label(group):
    return ("Europe/Africa", "Americas", "Oceania", "Asia")[group]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slot", type=int, default=0)
    parser.add_argument("--auto-window", action="store_true")
    parser.add_argument("--region")
    parser.add_argument("--state-file", type=Path)
    parser.add_argument("--env-file", required=True)
    args = parser.parse_args()
    if args.auto_window and args.region:
        parser.error("Choose manual region or the automatic timezone window")
    if not 0 <= args.slot < 1000000000:
        parser.error("Invalid rotation slot")
    # Fixed official domain, bounded index response, strict JSON, no arbitrary URL input.
    with urlopen(Request(INDEX, headers={"User-Agent": "GTH-PRO-OpenAttractions/1.0"}), timeout=35) as response:
        raw = response.read(2_500_001)
    if len(raw) > 2_500_000:
        raise ValueError("Geofabrik registry exceeds reviewed size")
    regions = eligible_regions(json.loads(raw))
    status = read_source_status(args.state_file)
    item = None
    if args.region:
        item = next((r for r in regions if r["region"] == args.region), None)
        if item is None:
            raise ValueError("Region is not in reviewed official Geofabrik index")
    elif args.auto_window:
        item, group = select_scheduled_region(regions, status=status)
        print(json.dumps({"utc_window": scheduled_window_label(group), "auto": True}))
    else:
        item = regions[args.slot % len(regions)]
    previous = status.get(item["region"]) if status is not None else None
    offset = previous["next_offset"] if previous and not previous["complete"] else 0
    with open(args.env_file, "a", encoding="utf-8") as f:
        for key, value in (("REGION", item["region"]), ("COUNTRY_CODE", item["country_code"]),
                           ("COUNTRY_NAME", item["country_name"]), ("PBF_URL", item["url"]),
                           ("REGISTERED_REGION_COUNT", str(len(regions))), ("START_OFFSET", str(offset))):
            if "\n" in value or "\r" in value:
                raise ValueError("Untrusted registry newline")
            f.write(key + "=" + value + "\n")
    print(json.dumps({"region": item["region"], "country_code": item["country_code"],
                      "registered_leaf_extracts": len(regions), "start_offset": offset,
                      "source": INDEX}))


if __name__ == "__main__":
    main()
