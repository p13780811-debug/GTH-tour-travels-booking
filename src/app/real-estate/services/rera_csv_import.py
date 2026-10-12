"""Production-safe MahaRERA CSV importer. Dry-run is the default."""

import argparse
import csv
from datetime import datetime, timezone
import json
import time
import sys
from pathlib import Path
from urllib.parse import urlparse

from rera_import import MAHARERA_SEARCH_URL, insert_registry_batch, registry_payload
from rera_table import parse_table

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_ROWS = 100_000
MAX_BATCH_SIZE = 200
MAX_REJECTION_DETAILS = 50
MAX_RERA_SAMPLE = 20
DAILY_LIMIT = 100
MIN_BATCH_DELAY_SECONDS = 10
DAILY_DISTRICTS = ("Mumbai Suburban", "Mumbai City", "Thane", "Pune")

SENSITIVE_HEADER_TOKENS = {
    "pan",
    "aadhaar",
    "aadhar",
    "email",
    "bank",
    "account",
    "ifsc",
    "password",
    "token",
    "secret",
}


def _normalize_header(value):
    return " ".join(value.lower().replace("_", " ").replace("-", " ").split())


def sensitive_headers(headers):
    found = []
    for header in headers:
        normalized = _normalize_header(header)
        if any(token in normalized.split() for token in SENSITIVE_HEADER_TOKENS):
            found.append(header)
    return found


def _matches_expected_city(record, expected_city):
    target = expected_city.strip().lower()
    candidates = [record.get("city", ""), record.get("location", ""), record.get("district", "")]
    return any(target in value.lower() for value in candidates if isinstance(value, str))


def load_registry_csv(path, expected_city):
    csv_path = Path(path)
    if not csv_path.is_file():
        raise ValueError("CSV file does not exist")
    if csv_path.stat().st_size > MAX_FILE_BYTES:
        raise ValueError("CSV file exceeds the import size limit")

    accepted = []
    rejected = []
    seen = set()

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        try:
            headers = next(reader)
        except StopIteration as exc:
            raise ValueError("CSV file is empty") from exc

        if not headers or any(not isinstance(header, str) for header in headers):
            raise ValueError("CSV headers are invalid")

        sensitive = sensitive_headers(headers)

        for line_number, row in enumerate(reader, start=2):
            if line_number - 1 > MAX_ROWS:
                raise ValueError("CSV row count exceeds the import limit")

            try:
                record = parse_table(headers, [row])[0]

                if expected_city and not _matches_expected_city(record, expected_city):
                    raise ValueError("Registry row is outside the expected city")

                if record.get("state") and record["state"].strip().lower() != "maharashtra":
                    raise ValueError("Registry row is outside Maharashtra")

                if expected_city:
                    record["city"] = expected_city.strip()

                record["official_source_url"] = MAHARERA_SEARCH_URL
                payload = registry_payload(record)

                if payload["rera_id"] in seen:
                    raise ValueError("Duplicate RERA ID in CSV")

                seen.add(payload["rera_id"])
                accepted.append(record)
            except ValueError as exc:
                rejected.append({"line": line_number, "reason": str(exc)})

    if not accepted:
        raise ValueError("CSV contains no importable registry rows")

    return accepted, rejected, sensitive


def _project_ref_from_url(url):
    host = urlparse(url).hostname or ""
    suffix = ".supabase.co"
    return host[: -len(suffix)] if host.endswith(suffix) else ""


def commit_batches(records, batch_size, expected_project_ref):
    if not 1 <= batch_size <= MAX_BATCH_SIZE:
        raise ValueError(f"Batch size must be between 1 and {MAX_BATCH_SIZE}")

    repo_root = Path(__file__).resolve().parents[4]
    backend_dir = repo_root / "backend"
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    from config import require_ingestion_settings
    from supabase import create_client

    url, key = require_ingestion_settings()
    actual_project_ref = _project_ref_from_url(url)

    if not expected_project_ref or actual_project_ref != expected_project_ref:
        raise RuntimeError("Supabase project reference does not match the explicitly approved target")

    client = create_client(url, key)
    inserted = 0

    for start in range(0, len(records), batch_size):
        if start:
            # Fixed conservative pacing, not a bot-disguise mechanism.
            time.sleep(MIN_BATCH_DELAY_SECONDS)
        try:
            inserted += insert_registry_batch(client, records[start:start + batch_size])
        except Exception as exc:
            # Fail closed: never retry writes blindly or continue after rate limiting.
            raise RuntimeError("Supabase batch failed; ingestion stopped safely") from exc

    return inserted


def select_daily_records(export_dir, district=None):
    """Select up to 100 records from an authorized refreshed CSV export.

    This deliberately does not bypass a website session, CAPTCHA or export controls.
    """
    day = datetime.now(timezone.utc).date()
    chosen = district or DAILY_DISTRICTS[(day.toordinal() - 1) % len(DAILY_DISTRICTS)]
    if chosen not in DAILY_DISTRICTS:
        raise ValueError("Unsupported district")
    directory = Path(export_dir).resolve()
    if not directory.is_dir():
        raise ValueError("Authorized export directory not found")
    filename = chosen.lower().replace(" ", "-") + ".csv"
    export_path = directory / filename
    if not export_path.is_file():
        raise ValueError("Authorized district CSV unavailable; no write performed")
    records, rejected, sensitive = load_registry_csv(export_path, "")
    selected = [r for r in records if r.get("district", "").strip().casefold() == chosen.casefold()][:DAILY_LIMIT]
    if not selected:
        raise ValueError("No valid rows for selected district; no write performed")
    return chosen, selected, rejected, sensitive


def main(argv=None):
    parser = argparse.ArgumentParser(description="Import an authorized MahaRERA CSV export safely")
    parser.add_argument("csv_path", nargs="?")
    parser.add_argument("--daily-dir", help="Authorized CSV export directory")
    parser.add_argument("--district", choices=DAILY_DISTRICTS)
    parser.add_argument("--expected-city", default="")
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--expected-project-ref")
    args = parser.parse_args(argv)

    if args.daily_dir:
        if args.csv_path or args.expected_city:
            parser.error("--daily-dir cannot be combined with csv_path or --expected-city")
        chosen_district, records, rejected, sensitive = select_daily_records(args.daily_dir, args.district)
    else:
        if not args.csv_path or not args.expected_city:
            parser.error("csv_path and --expected-city are required for normal CSV imports")
        chosen_district = None
        records, rejected, sensitive = load_registry_csv(args.csv_path, args.expected_city)

    summary = {
        "mode": "commit" if args.commit else "dry-run",
        "district": chosen_district,
        "source": "authorized_csv_export",
        "accepted": len(records),
        "rejected": len(rejected),
        "sensitive_columns_discarded": sensitive,
        "rera_id_sample": [row["rera_id"] for row in records[:MAX_RERA_SAMPLE]],
        "rejections": rejected[:MAX_REJECTION_DETAILS],
        "rejections_truncated": len(rejected) > MAX_REJECTION_DETAILS,
    }

    if args.commit:
        if not args.expected_project_ref:
            parser.error("--expected-project-ref is required with --commit")

        inserted = commit_batches(records, args.batch_size, args.expected_project_ref)
        summary["inserted"] = inserted
        summary["already_present"] = len(records) - inserted

    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
