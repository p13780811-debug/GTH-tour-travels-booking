#!/usr/bin/env python3
"""Batch-convert authorized Klook hotel detail URLs to tracked Travelpayouts affiliate links.

This is not a Klook property lookup tool: a genuine mapped Klook ID and detail URL
are prerequisites. No guessed URLs, hotel-name-only joins, or auto-publication.

Input CSV columns:
  osm_source_id,provider,provider_property_id,provider_property_url,hotel_name_at_provider
Output adds: affiliate_url (accepted by stage_exact_affiliate_links.py).
Defaults to OFFLINE dry-run. Use --generate to call the API. No Supabase writes.

Official API: https://api.travelpayouts.com/links/v1/create
100 requests/minute/marker and at most 10 links per request.
"""
import argparse
import csv
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ENDPOINT = "https://api.travelpayouts.com/links/v1/create"
COLUMNS = ("osm_source_id", "provider", "provider_property_id",
           "provider_property_url", "hotel_name_at_provider")
OUTPUT = COLUMNS + ("affiliate_url",)
OSM_ID = re.compile(r"^(?:node|way|relation)/\d{1,19}$")
# Hotel IDs must be resolved from an authorized partner source, not estimated from OSM numbers.
KLOOK_PATH = re.compile(r"^/hotels/detail/(\d+)-([a-z0-9-]+)/?$")
SAFE_SUB = re.compile(r"[^a-zA-Z0-9_-]")
MAX_BYTES = 15_000_000


def validate(row):
    """Fail closed on missing identities, ambiguous destinations and unsafe redirects."""
    source = (row.get("osm_source_id") or "").strip()
    provider = (row.get("provider") or "").strip()
    ident = (row.get("provider_property_id") or "").strip()
    dest = (row.get("provider_property_url") or "").strip()
    hotel = (row.get("hotel_name_at_provider") or "").strip()
    if not OSM_ID.fullmatch(source) or provider != "klook" or not ident.isdecimal():
        raise ValueError("Invalid OSM source, provider or Klook property ID")
    if not (3 <= len(hotel) <= 240):
        raise ValueError("Missing genuine supplier hotel name")
    if len(dest) > 1600:
        raise ValueError("Property URL too long")
    try:
        url = urlparse(dest)
        match = KLOOK_PATH.fullmatch(url.path)
        if (url.scheme != "https" or url.hostname not in ("www.klook.com", "klook.com") or
                url.username or url.password or url.port is not None or url.query or url.fragment or
                not match or match.group(1) != ident):
            raise ValueError("Not a confirmed Klook hotel detail URL for this supplier ID")
    except (ValueError, TypeError):
        raise ValueError("Not a confirmed Klook hotel detail URL for this supplier ID") from None
    return {name: (row.get(name) or "").strip() for name in COLUMNS}


def valid_result(item, dest):
    if not isinstance(item, dict) or item.get("url") != dest or item.get("code") != "success":
        return None
    target = item.get("partner_url")
    if not isinstance(target, str) or not (10 <= len(target) <= 2048):
        return None
    try:
        url = urlparse(target)
        host = (url.hostname or "").lower()
        if (url.scheme != "https" or host not in ("klook.tpo.lv", "klook.tp.st", "tp.media") or
                url.username or url.password or url.port is not None or "hotellook" in target.lower()):
            return None
        return target
    except (TypeError, ValueError):
        return None


def api_batch(batch, *, token, marker, trs, opener=urlopen, sleeper=time.sleep, retry=3):
    """Return per-item link results. HTTP 429/5xx retried with bounded exponential delays."""
    payload = {
        "trs": int(trs),
        "marker": int(marker),
        "shorten": True,
        "links": [{"url": row["provider_property_url"],
                   "sub_id": SAFE_SUB.sub("_", row["osm_source_id"]).replace("/", "_")[:100]}
                  for row in batch],
    }
    body = json.dumps(payload).encode("utf-8")
    for attempt in range(retry):
        req = Request(ENDPOINT, data=body, method="POST",
                      headers={"X-Access-Token": token,
                               "Content-Type": "application/json",
                               "Accept": "application/json"})
        try:
            with opener(req, timeout=25) as response:
                result = json.loads(response.read(250_000))
            if not isinstance(result, dict) or result.get("code") != "success":
                raise ValueError("Travelpayouts rejected this link generation batch")
            links = result.get("result", {}).get("links", [])
            if not isinstance(links, list) or len(links) != len(batch):
                raise ValueError("Unexpected link generation response length")
            return links
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == retry-1:
                raise ValueError("Travelpayouts returned HTTP " + str(exc.code)) from None
            sleeper(min(15, 2 ** attempt + 2))
        except (URLError, TimeoutError, OSError) as exc:
            if attempt == retry-1:
                raise ValueError("Travelpayouts link generation unavailable") from None
            sleeper(min(15, 2 ** attempt + 2))
    return []


def main(argv=None, *, opener=urlopen, sleeper=time.sleep):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True, help="Authorized verified property-ID mapping CSV")
    parser.add_argument("--output", required=True, help="Output CSV; never overwrite input")
    parser.add_argument("--generate", action="store_true", help="Send partner links to Travelpayouts API")
    parser.add_argument("--max-rows", type=int, default=25000)
    args = parser.parse_args(argv)
    path = Path(args.csv).resolve()
    output = Path(args.output).resolve()
    if path == output:
        parser.error("Output cannot overwrite input")
    if not 1 <= args.max_rows <= 25000 or path.stat().st_size > MAX_BYTES:
        parser.error("Input outside bounded row/file limits")
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or not set(COLUMNS).issubset(reader.fieldnames):
            parser.error("Missing hotel ID/URL input columns")
        candidate = [r for _, r in zip(range(args.max_rows+1), reader)]
    if len(candidate) > args.max_rows:
        parser.error("CSV exceeds --max-rows")
    valid = []
    rejected = []
    seen = set()
    for line, row in enumerate(candidate, 2):
        try:
            record = validate(row)
            key = (record["osm_source_id"], record["provider"])
            if key in seen:
                raise ValueError("Duplicate OSM hotel and partner program")
            seen.add(key)
            valid.append(record)
        except ValueError as exc:
            rejected.append({"row": line, "reason": str(exc)})
    # Never generate any request for an input with inconsistent hotel IDs.
    print(json.dumps({"input_rows": len(candidate), "valid": len(valid),
                      "rejected": len(rejected), "sample_rejections": rejected[:8],
                      "dry_run": not args.generate, "batches": (len(valid)+9)//10},
                     indent=2))
    if rejected:
        return 1
    if not args.generate:
        return 0
    token = os.environ.get("TRAVELPAYOUTS_API_TOKEN") or os.environ.get("TRAVELPAYOUTS_TOKEN")
    marker = os.environ.get("TRAVELPAYOUTS_MARKER", "")
    trs = os.environ.get("TRAVELPAYOUTS_TRS", "")
    if not token or not marker.isdecimal() or not trs.isdecimal():
        parser.error("Set server-only TRAVELPAYOUTS_API_TOKEN, TRAVELPAYOUTS_MARKER and TRAVELPAYOUTS_TRS")
    converted = []
    errors = []
    for start in range(0, len(valid), 10):
        batch = valid[start:start+10]
        if start:
            sleeper(0.75)  # < 100 requests/minute/marker; no unbounded concurrency.
        try:
            response = api_batch(batch, token=token, marker=marker, trs=trs,
                                 opener=opener, sleeper=sleeper)
            indexed = {r.get("url"): r for r in response if isinstance(r, dict)}
            for row in batch:
                affiliate = valid_result(indexed.get(row["provider_property_url"]),
                                         row["provider_property_url"])
                if affiliate:
                    converted.append({**row, "affiliate_url": affiliate})
                else:
                    errors.append({"source":row["osm_source_id"],"reason":"No verified affiliate response"})
        except ValueError as exc:
            errors.extend({"source":r["osm_source_id"],"reason":str(exc)} for r in batch)
    # Partial results are kept for review, not published or deployed.
    with output.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f,fieldnames=OUTPUT)
        writer.writeheader()
        writer.writerows(converted)
    print(json.dumps({"generated": len(converted), "failed": len(errors),
                      "output": str(output), "sample_errors": errors[:8],
                      "supabase_mutated": False, "approved_booking_links": 0}, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError) as exc:
        print("Bulk link generation stopped:", str(exc)[:250], file=sys.stderr)
        sys.exit(1)
