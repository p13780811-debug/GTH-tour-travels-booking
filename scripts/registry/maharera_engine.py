"""Prepare a supplied MahaRERA JSON export; no guessed endpoint or AI claims.

Default is offline preparation. --commit uses the existing compact private
registry writer, only after explicit source/rights review. No sale inventory,
photos, inferred status, promoter contacts or free-text AI description is added.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from official_gov_harvester import clean, normalize, commit_batch

API_COLUMNS = {"record_id": "RegistrationNo", "project_name": "ProjectName",
               "district": "District", "taluka": "Taluka", "locality": "Village", "postal_code": "PinCode"}


def registry_description(row):
    """Three source-bound lines, never marketing or sale-availability claims."""
    locality = ", ".join(row[k] for k in ("locality", "taluka", "district") if row.get(k))
    return "\n".join((
        f"{row['project_name']} — registration reference {row['record_id']} in the supplied registry export.",
        "Recorded locality: " + (locality or "not supplied") + ".",
        "Registry research only; current availability, price, amenities and completion require independent confirmation.",
    ))


def prepare_payload(payload, manifest, max_rows=100):
    if not isinstance(payload, dict) or not isinstance(payload.get("Data"), list):
        raise ValueError("Expected the supplied export's Data array")
    if not 1 <= max_rows <= 812 or len(payload["Data"]) > max_rows:
        raise ValueError("Export exceeds the bounded row budget")
    if not isinstance(manifest, dict) or manifest.get("authority") != "MAHARERA":
        raise ValueError("Explicit Maharashtra source manifest required")
    mapping = manifest.get("columns", API_COLUMNS)
    source_manifest = {**manifest, "columns": mapping}
    rows, descriptions, seen = [], [], set()
    for item in payload["Data"]:
        if not isinstance(item, dict):
            raise ValueError("Every export record must be an object")
        row = normalize(item, source_manifest)
        if row["record_id"] in seen:
            raise ValueError("Duplicate registration in input; no import started")
        seen.add(row["record_id"])
        # Preserve supplied proper names; never title-case acronyms or invent status.
        promoter = clean(item.get("PromoterName"), 180)
        rows.append(row)
        descriptions.append({"record_id": row["record_id"], "promoter_name_as_supplied": promoter,
                             "description": registry_description(row), "publication_status": "research_draft"})
    return rows, descriptions


def run(args):
    if args.input.stat().st_size > 20_000_000 or args.manifest.stat().st_size > 8192:
        raise ValueError("Input size budget exceeded")
    paths = [args.input.resolve(), args.manifest.resolve(), args.output.resolve()]
    if args.descriptions:
        paths.append(args.descriptions.resolve())
    if len(paths) != len(set(paths)) or args.output.exists() or (args.descriptions and args.descriptions.exists()):
        raise ValueError("Outputs must be new paths, separate from source files")
    manifest = json.loads(args.manifest.read_text(encoding="utf-8-sig"))
    rows, descriptions = prepare_payload(json.loads(args.input.read_text(encoding="utf-8-sig")), manifest, args.max_rows)
    if args.commit and (manifest.get("rights_confirmed") is not True or manifest.get("license") == "unconfirmed" or any(not row["rights_confirmed"] for row in rows)):
        raise ValueError("Confirm dataset reuse rights before any private database import")
    with args.output.open("x", encoding="utf-8") as output:
        for row in rows:
            output.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
    if args.descriptions:
        with args.descriptions.open("x", encoding="utf-8") as output:
            for row in descriptions:
                output.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
    if args.commit:
        for start in range(0, len(rows), 25):
            commit_batch(rows[start:start + 25])
    return {"prepared": len(rows), "indexable": 0, "private_import_requested": args.commit,
            "sale_inventory_created": 0, "ai_requests": 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--descriptions", type=Path)
    parser.add_argument("--max-rows", type=int, default=100)
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()
    try:
        from dotenv import load_dotenv
        load_dotenv(override=False)
    except ImportError:
        pass  # Environment injection also works without an optional dotenv dependency.
    try:
        print(json.dumps(run(args)))
    except (ValueError, OSError, TypeError, KeyError):
        # No raw exception, credentials, headers, response bodies or environment output.
        parser.exit(2, "Registry preparation/import failed. Check source format, rights, limits and private writer configuration.\n")


if __name__ == "__main__":
    main()
