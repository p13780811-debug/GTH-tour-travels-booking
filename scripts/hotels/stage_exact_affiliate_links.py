#!/usr/bin/env python3
"""Stage pre-matched, program-authorized hotel affiliate links for human review.

Never scrapes booking sites; never auto-approves or activates links. Dry-run by default.
Usage:
  python3 scripts/hotels/stage_exact_affiliate_links.py --csv partner_property_matches.csv
  python3 scripts/hotels/stage_exact_affiliate_links.py --csv partner_property_matches.csv --apply
Expected CSV:
  osm_source_id,provider,provider_property_id,provider_property_url,affiliate_url,hotel_name_at_provider
"""
import argparse
import csv
import difflib
import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

OSM_ID = re.compile(r"^(node|way|relation)/[0-9]{1,19}$")
PROVIDERS = {
    "klook": ("klook.com", "klook.tpo.lv", "klook.tp.st", "tp.media"),
    "trip_com": ("trip.com", "trip.tpo.lv", "trip.tp.st", "tp.media"),
    "booking_com": ("booking.com", "booking.tpo.lv", "booking.tp.st", "tp.media"),
}
FIELDS = {"osm_source_id", "provider", "provider_property_id",
          "provider_property_url", "affiliate_url", "hotel_name_at_provider"}
GENERIC = re.compile(r"/(?:search|searchresults|destinations?|flights)(?:/|$)", re.I)


def normalize(name):
    text = unicodedata.normalize("NFKD", name).casefold()
    return " ".join(re.findall(r"[a-z0-9]+", text))


def safe_url(value, allowed, property_page=False):
    if not value or len(value) > 2048:
        return False
    try:
        u = urlparse(value)
        hostname = (u.hostname or "").lower()
        if (u.scheme != "https" or not hostname or u.username or u.password or
                u.port is not None or u.fragment or "hotellook" in value.lower()):
            return False
        if not any(hostname == h or (h in {"klook.com", "trip.com", "booking.com"}
                   and hostname.endswith("." + h)) for h in allowed):
            return False
        if property_page and (GENERIC.search(u.path) or (u.path in {"", "/"} and
                "hotelId=" not in u.query)):
            return False
        return True
    except ValueError:
        return False


def request_json(url, token, endpoint, payload=None, ignore_conflicts=False):
    headers = {"apikey": token, "Authorization": "Bearer " + token,
               "Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
        headers["Prefer"] = "resolution=ignore-duplicates,return=minimal" if ignore_conflicts else "return=representation"
    req = Request(url.rstrip("/") + "/rest/v1/" + endpoint,
                  data=json.dumps(payload).encode("utf-8") if payload is not None else None,
                  headers=headers, method="POST" if payload is not None else "GET")
    with urlopen(req, timeout=25) as res:
        body = res.read(5_000_000)
        return json.loads(body) if body else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True)
    parser.add_argument("--apply", action="store_true", help="Only stage inactive records; do not approve")
    parser.add_argument("--max-rows", type=int, default=1000)
    args = parser.parse_args()
    if not 1 <= args.max_rows <= 10000:
        parser.error("max-rows must be 1..10000")
    path = Path(args.csv)
    if path.stat().st_size > 10_000_000:
        parser.error("CSV too large; split into bounded batches")
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames or not FIELDS.issubset(reader.fieldnames):
            parser.error("Missing required columns: " + ", ".join(sorted(FIELDS)))
        rows = [row for _, row in zip(range(args.max_rows + 1), reader)]
    if len(rows) > args.max_rows:
        parser.error("Input exceeds --max-rows; split into reviewable batches")
    candidates, errors, seen = [], [], set()
    for index, row in enumerate(rows, 2):
        provider = (row["provider"] or "").strip()
        source_id = (row["osm_source_id"] or "").strip()
        property_id = (row["provider_property_id"] or "").strip()
        property_url = (row["provider_property_url"] or "").strip()
        affiliate = (row["affiliate_url"] or "").strip()
        provider_name = (row["hotel_name_at_provider"] or "").strip()
        if provider not in PROVIDERS or not OSM_ID.fullmatch(source_id):
            errors.append((index, "invalid provider or OSM ID")); continue
        if (source_id, provider) in seen:
            errors.append((index, "duplicate source/provider")); continue
        seen.add((source_id, provider))
        if not re.fullmatch(r"[\w.:-]{2,180}", property_id) or len(provider_name) < 3:
            errors.append((index, "invalid hotel identity")); continue
        official = [PROVIDERS[provider][0]]
        if not safe_url(property_url, official, property_page=True):
            errors.append((index, "property URL is not on the approved brand")); continue
        if not safe_url(affiliate, PROVIDERS[provider]):
            errors.append((index, "affiliate URL host invalid or obsolete")); continue
        candidates.append({
            "catalog_source": "osm", "catalog_source_id": source_id,
            "provider": provider, "provider_property_id": property_id,
            "provider_property_url": property_url, "affiliate_url": affiliate,
            "hotel_name_at_provider": provider_name,
            "active": False, "exact_property_verified": False,
            "program_approved": False
        })
    print(json.dumps({"input": len(rows), "valid_syntax": len(candidates),
                      "invalid": len(errors), "errors_preview": errors[:10],
                      "mode": "STAGE_ONLY" if args.apply else "DRY_RUN"}, indent=2))
    if not args.apply or not candidates:
        return 1 if errors else 0
    endpoint = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not endpoint.startswith("https://") or not endpoint.endswith(".supabase.co") or not key:
        parser.error("Trusted Supabase URL and server-only SERVICE_ROLE_KEY are required for --apply")
    # Source matches are checked against database identities. Similar names alone are not sufficient for publication.
    inserted = 0
    for offset in range(0, len(candidates), 25):
        batch = candidates[offset:offset + 25]
        values = ",".join(item["catalog_source_id"] for item in batch)
        qry = urlencode({"select": "source_id,name", "source": "eq.osm",
                         "source_id": "in.(" + values + ")"})
        known_rows = request_json(endpoint, key, "hotel_catalog?" + qry)
        known = {r["source_id"]: r["name"] for r in known_rows or []}
        accepted = []
        for item in batch:
            expected = known.get(item["catalog_source_id"])
            if not expected:
                errors.append((item["catalog_source_id"], "OSM identity absent")); continue
            similarity = difflib.SequenceMatcher(None, normalize(expected),
                                                normalize(item["hotel_name_at_provider"])).ratio()
            if similarity < 0.65:
                errors.append((item["catalog_source_id"], "hotel names materially differ")); continue
            accepted.append(item)
        if accepted:
            # DO NOTHING on conflict. Never overwrite previously approved live affiliate URLs.
            request_json(endpoint, key,
                         "hotel_booking_links?on_conflict=catalog_source,catalog_source_id,provider",
                         accepted, ignore_conflicts=True)
            inserted += len(accepted)
    print(json.dumps({"staged_or_existing_candidates": inserted,
                      "rejected": len(errors), "all_new_links_remain_inactive": True,
                      "manual_review_route": "/admin/hotels"}, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (HTTPError, URLError, OSError, ValueError) as exc:
        print("Hotel affiliate staging failed safely:", str(exc)[:350], file=sys.stderr)
        sys.exit(1)
