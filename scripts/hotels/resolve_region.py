#!/usr/bin/env python3
"""Resolve one licensed, small, sovereign-country Geofabrik extract per run.

Official global machine-readable registry, not HTML scraping. Selects ONLY
entries with exactly one ISO2 country code and a Geofabrik-hosted PBF URL.
HEAD size cap avoids gigantic extracts and CI budget exhaustion.
No data is labeled to the wrong country. Never follows off-domain redirects.
"""
import argparse
import json
import re
import sys
from urllib.parse import urlparse
from urllib.request import Request, urlopen

INDEX="https://download.geofabrik.de/index-v1-nogeom.json"
MAX_INDEX_BYTES=7_000_000
MAX_PBF_BYTES=450_000_000
FALLBACK=[
 ("europe/monaco","MC"),("europe/andorra","AD"),
 ("europe/luxembourg","LU"),("europe/liechtenstein","LI"),
 ("asia/nepal","NP"),("asia/sri-lanka","LK"),
 ("asia/bangladesh","BD"),("europe/cyprus","CY"),
]
def geofabrik_url(url):
    if not isinstance(url,str) or len(url)>260:return False
    parsed=urlparse(url)
    return (parsed.scheme=="https" and parsed.hostname=="download.geofabrik.de"
      and not parsed.username and not parsed.password and not parsed.query and not parsed.fragment
      and re.fullmatch(r"/[a-z0-9/_-]+-latest\.osm\.pbf",parsed.path) is not None)

def candidates(data):
    if not isinstance(data,dict) or not isinstance(data.get("features"),list):
        raise ValueError("Unexpected Geofabrik index")
    unique={}
    for row in data["features"]:
        if not isinstance(row,dict):continue
        props=row.get("properties")
        if not isinstance(props,dict):continue
        countries=props.get("iso3166-1:alpha2")
        if not isinstance(countries,list) or len(countries)!=1:continue
        country=countries[0]
        urls=props.get("urls")
        if not isinstance(country,str) or not re.fullmatch("[A-Z]{2}",country) or not isinstance(urls,dict):continue
        link=urls.get("pbf")
        if not geofabrik_url(link):continue
        region=link[len("https://download.geofabrik.de/"):-len("-latest.osm.pbf")]
        if region.count("/")<1:continue # Avoid continent-scale downloads
        unique[region]=(region,country,link)
    return sorted(unique.values(),key=lambda v:v[0])

def fetch_index():
    req=Request(INDEX,headers={"User-Agent":"GTH-PRO-OSM-Hotel-Catalog/1.0"})
    with urlopen(req,timeout=18) as response:
        if urlparse(response.geturl()).hostname not in ("download.geofabrik.de","download-ext2.geofabrik.de"):
            raise ValueError("Untrusted index redirect")
        raw=response.read(MAX_INDEX_BYTES+1)
    if len(raw)>MAX_INDEX_BYTES:raise ValueError("Oversized index")
    return json.loads(raw)

def acceptable_size(url):
    if not geofabrik_url(url):return False
    req=Request(url,method="HEAD",headers={"User-Agent":"GTH-PRO-OSM-Hotel-Catalog/1.0"})
    try:
        with urlopen(req,timeout=15) as response:
            final=urlparse(response.geturl())
            if final.scheme!="https" or not (final.hostname=="download.geofabrik.de" or
                final.hostname.endswith(".geofabrik.de")):return False
            size=int(response.headers.get("Content-Length","0"))
            return 1000<size<=MAX_PBF_BYTES
    except (OSError,ValueError):return False

def resolve(slot):
    try:
        options=candidates(fetch_index())
        if options:
            # Rotating deterministic cursor, bound HEAD requests per run.
            start=slot%len(options)
            for i in range(min(16,len(options))):
                region,country,url=options[(start+i)%len(options)]
                if acceptable_size(url):return region,country
    except (OSError,ValueError,json.JSONDecodeError):
        pass
    return FALLBACK[slot%len(FALLBACK)]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--slot",type=int,required=True)
    args=parser.parse_args()
    if args.slot<0:parser.error("Invalid slot")
    region,country=resolve(args.slot)
    if not re.fullmatch(r"[a-z0-9/_-]{3,180}",region) or not re.fullmatch(r"[A-Z]{2}",country):
        parser.error("Invalid resolved region")
    print(f"REGION={region}")
    print(f"COUNTRY={country}")
    return 0

if __name__=="__main__":sys.exit(main())
