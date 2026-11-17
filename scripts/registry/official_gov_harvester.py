"""Offline, bounded government CSV/JSONL adapter. No crawler or automatic publication.

Manifest: authority, source_url, license, rights_confirmed, columns (canonical ->
actual CSV header), source_status. Optional --commit writes compact private rows
in 25-row insert-only batches through a server-only environment credential.
Legacy 812 exports use --legacy; imported verified=true flags are never trusted.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from registry_fabric.legacy_recovery import recover_legacy_rera

HOSTS = {
    "MAHARERA": {"maharera.maharashtra.gov.in", "maharera.mahaonline.gov.in"},
    "DUBAI_DLD": {"dubailand.gov.ae", "dubaipulse.gov.ae"},
    "HM_LAND_REGISTRY": {"gov.uk", "landregistry.data.gov.uk", "publicdata.landregistry.gov.uk"},
}
LICENSES = {"CC0-1.0", "OGL-UK-3.0", "ODC-BY-1.0", "unconfirmed"}

def clean(value, limit, required=False):
    if value is None or value == "":
        if required:
            raise ValueError("Missing required registry field")
        return None
    if not isinstance(value, str):
        raise ValueError("Registry fields must be text")
    value = unicodedata.normalize("NFKC", value).strip()
    if not value or len(value) > limit or any(unicodedata.category(c) in {"Cc", "Cf"} or c in "<>" for c in value):
        raise ValueError("Unsafe or oversized registry field")
    return value

def official_url(value, authority):
    url = urllib.parse.urlsplit(value)
    host = url.hostname or ""
    if len(value) > 512 or url.scheme != "https" or url.username or url.password or url.port or url.fragment or host.removeprefix("www.") not in HOSTS[authority]:
        raise ValueError("Official source URL required")
    return value

def normalize(row, manifest, legacy=False):
    authority = manifest.get("authority")
    if authority not in HOSTS:
        raise ValueError("Unsupported registry authority")
    source = official_url(manifest.get("source_url", ""), authority)
    license_name = manifest.get("license", "unconfirmed")
    if license_name not in LICENSES:
        raise ValueError("Explicit supported reuse license required")
    if legacy:
        if authority != "MAHARERA":
            raise ValueError("Legacy format is Maharashtra-only")
        recovered = recover_legacy_rera(row)
        fields = dict(record_id=recovered.registration_id, project_name=recovered.project_name,
                      district=recovered.district, taluka=recovered.taluka,
                      locality=recovered.village or recovered.address_locality,
                      postal_code=recovered.postal_code)
        # All legacy coordinates and old verified flags remain outside publication.
        status, rights = "historical_unverified", False
        license_name = "unconfirmed"
    else:
        columns = manifest.get("columns")
        if not isinstance(columns, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in columns.items()):
            raise ValueError("Explicit dataset header mapping required")
        fields = {key: row.get(columns.get(key, "")) for key in
                  ("record_id", "project_name", "district", "taluka", "locality", "postal_code")}
        status = manifest.get("source_status", "official_dataset")
        rights = manifest.get("rights_confirmed") is True and license_name != "unconfirmed"
    if status not in {"historical_unverified", "official_dataset"}:
        raise ValueError("Invalid source status")
    if status == "historical_unverified":
        rights = False
    out = {"country_code": {"MAHARERA": "IN", "DUBAI_DLD": "AE", "HM_LAND_REGISTRY": "GB"}[authority],
           "authority": authority, "record_kind": "sale_transaction" if authority == "HM_LAND_REGISTRY" else "project",
           "record_id": clean(fields["record_id"], 80, True), "project_name": clean(fields["project_name"], 140, True),
           **{key: clean(fields.get(key), limit) for key, limit in (("district", 80), ("taluka", 80), ("locality", 120), ("postal_code", 16))},
           "source_url": source, "license": license_name, "rights_confirmed": rights,
           "locality_verified": False, "locality_evidence": None, "source_status": status}
    if len(out["project_name"]) < 3 or (authority == "MAHARERA" and not re.fullmatch(r"P[0-9]{11}", out["record_id"])):
        raise ValueError("Invalid source identity")
    if len(json.dumps(out, ensure_ascii=False).encode()) > 2200:
        raise ValueError("Compact row budget exceeded")
    return out

def commit_batch(rows):
    # Deliberately no command-line credentials, raw blobs, UPDATE, DELETE or upsert.
    base = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if base != "https://dqprqjmhxjnrllczqyhz.supabase.co" or not key:
        raise ValueError("Verified project URL and server-only writer are required")
    payload = json.dumps(rows, ensure_ascii=False).encode()
    if len(rows) > 25 or len(payload) > 60000:
        raise ValueError("Private import batch exceeds budget")
    req = urllib.request.Request(base + "/rest/v1/gth_official_registry_records", data=payload,
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
                 "Prefer": "resolution=ignore-duplicates,return=minimal"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status not in (200, 201, 204):
                raise ValueError("Private import failed")
    except urllib.error.URLError:
        raise ValueError("Private import failed; inspect service health and capacity without printing credentials") from None

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--legacy", action="store_true")
    parser.add_argument("--max-rows", type=int, default=812)
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.max_rows <= 10000 or args.input.stat().st_size > 20_000_000 or args.manifest.stat().st_size > 8192:
        parser.error("Input or row budget exceeded")
    if args.input.resolve() == args.output.resolve() or args.manifest.resolve() == args.output.resolve():
        parser.error("Output must not overwrite source or manifest")
    manifest = json.loads(args.manifest.read_text())
    csv.field_size_limit(100000)
    prepared, seen = [], set()
    with args.input.open(encoding="utf-8-sig", newline="") as source:
        records = (json.loads(line) for line in source if line.strip()) if args.input.suffix == ".jsonl" else csv.DictReader(source)
        for number, row in enumerate(records, 1):
            if number > args.max_rows:
                raise ValueError("Row budget exceeded; no import started")
            value = normalize(row, manifest, args.legacy)
            identity = value["country_code"], value["authority"], value["record_id"]
            if identity in seen:
                raise ValueError("Duplicate source identity; no import started")
            seen.add(identity)
            prepared.append(value)
    with args.output.open("x", encoding="utf-8") as output:
        for row in prepared:
            output.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
    if args.commit:
        if args.legacy or manifest.get("rights_confirmed") is not True or manifest.get("license") == "unconfirmed":
            raise ValueError("Source reuse review required before any database insertion")
        for start in range(0, len(prepared), 25):
            commit_batch(prepared[start:start+25])
    print(json.dumps({"prepared": len(prepared), "indexable": 0, "private_import_requested": args.commit}))

if __name__ == "__main__":
    main()
