#!/usr/bin/env python3
"""Resolve reviewed HTTPS Geofabrik leaf extracts to source-declared single ISO countries.
No guessing download paths, admin borders or private OSM contributor metadata.
"""
import argparse
import json
import re
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slot", type=int, default=0)
    parser.add_argument("--region")
    parser.add_argument("--env-file", required=True)
    args = parser.parse_args()
    if not 0 <= args.slot < 1000000000:
        parser.error("Invalid rotation slot")
    # Fixed official domain, bounded index response, strict JSON, no arbitrary URL input.
    with urlopen(Request(INDEX, headers={"User-Agent": "GTH-PRO-OpenAttractions/1.0"}), timeout=35) as response:
        raw = response.read(2_500_001)
    if len(raw) > 2_500_000:
        raise ValueError("Geofabrik registry exceeds reviewed size")
    regions = eligible_regions(json.loads(raw))
    item = None
    if args.region:
        item = next((r for r in regions if r["region"] == args.region), None)
        if item is None:
            raise ValueError("Region is not in reviewed official Geofabrik index")
    else:
        item = regions[args.slot % len(regions)]
    with open(args.env_file, "a", encoding="utf-8") as f:
        for key, value in (("REGION", item["region"]), ("COUNTRY_CODE", item["country_code"]),
                           ("COUNTRY_NAME", item["country_name"]), ("PBF_URL", item["url"]),
                           ("REGISTERED_REGION_COUNT", str(len(regions)))):
            if "\n" in value or "\r" in value:
                raise ValueError("Untrusted registry newline")
            f.write(key + "=" + value + "\n")
    print(json.dumps({"region": item["region"], "country_code": item["country_code"],
                      "registered_leaf_extracts": len(regions), "source": INDEX}))


if __name__ == "__main__":
    main()
