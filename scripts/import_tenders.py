#!/usr/bin/env python3
"""Authorised tender CSV ingestion. Dry-run by default; never auto-publishes.

All submitted records enter private review. Source-host allowlist is mandatory.
Uses Python stdlib only. No scraping, crawling or automatic promotion.
"""
import argparse
import csv
import json
import os
import re
import sys
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

SECTORS = {"works", "goods", "services", "consultancy", "other"}
REQUIRED = {"source_reference", "source_url", "title", "buyer", "country_code", "sector", "deadline_at"}
MAX_FILE_BYTES = 10_000_000
MAX_ROWS = 2000

def valid_source(value, allowed_hosts):
    if not isinstance(value, str) or len(value) > 2048:
        raise ValueError("Invalid source URL")
    try:
        u = urlsplit(value.strip())
        if (u.scheme != "https" or not u.hostname or u.username or u.password or
            u.port is not None or u.hostname.lower() not in allowed_hosts or
            not u.path.startswith("/")):
            raise ValueError("Unapproved source host")
        return value.strip()
    except (ValueError, TypeError) as exc:
        raise ValueError("Invalid or unapproved source URL") from exc

def timestamp(value, required=False):
    value = (value or "").strip()
    if not value:
        if required:
            raise ValueError("Missing tender deadline")
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            raise ValueError("Time zone required")
        return dt.astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError) as exc:
        raise ValueError("Invalid ISO-8601 datetime") from exc

def optional_text(value, maximum):
    s = (value or "").strip()
    return s[:maximum] or None

def convert(row, source_name, allowed_hosts):
    ref = str(row.get("source_reference") or "").strip()
    title = str(row.get("title") or "").strip()
    buyer = str(row.get("buyer") or "").strip()
    code = str(row.get("country_code") or "").strip().upper()
    sector = str(row.get("sector") or "").strip().lower()
    if (not (2 <= len(ref) <= 160) or not re.fullmatch(r"[\w./:-]+", ref, re.UNICODE) or
        not (5 <= len(title) <= 240) or not (2 <= len(buyer) <= 180) or
        not re.fullmatch(r"[A-Z]{2}", code) or sector not in SECTORS):
        raise ValueError("Invalid tender reference, country, sector or title")
    source_url = valid_source(row.get("source_url"), allowed_hosts)
    deadline = timestamp(row.get("deadline_at"), required=True)
    if datetime.fromisoformat(deadline) <= datetime.now(timezone.utc):
        raise ValueError("Expired tender")
    value = None
    if str(row.get("estimated_value") or "").strip():
        try:
            val = Decimal(str(row["estimated_value"]))
            if val < 0 or not val.is_finite() or val >= Decimal("10000000000000000"):
                raise ValueError("Invalid contract value")
            value = str(val.quantize(Decimal(".01")))
        except (InvalidOperation, ValueError) as exc:
            raise ValueError("Invalid contract value") from exc
    currency = optional_text(row.get("currency"), 3)
    if currency and not re.fullmatch(r"[A-Z]{3}", currency.upper()):
        raise ValueError("Invalid currency code")
    return {
        "source_name": source_name,
        "source_reference": ref,
        "source_url": source_url,
        "title": title,
        "buyer": buyer,
        "country_code": code,
        "region": optional_text(row.get("region"), 160),
        "sector": sector,
        "summary": optional_text(row.get("summary"), 4000),
        "deadline_at": deadline,
        "published_at": timestamp(row.get("published_at")),
        "estimated_value": value,
        "currency": currency.upper() if currency else None,
        # Never trust input publication flags, even if CSV contains them.
        "status": "review",
        "source_verified": False,
        "is_public": False,
    }

def load_csv(file, source_name, allowed_hosts, limit=500):
    path = Path(file)
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_FILE_BYTES:
        raise ValueError("Missing, symlinked or oversized CSV input")
    accepted, rejected, seen = [], [], set()
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not reader.fieldnames or not REQUIRED.issubset(set(reader.fieldnames)):
            raise ValueError("CSV must contain required tender columns")
        for i, row in enumerate(reader, 2):
            if i > MAX_ROWS + 1:
                raise ValueError("CSV exceeds maximum row count")
            try:
                item = convert(row, source_name, allowed_hosts)
                if item["source_reference"] in seen:
                    raise ValueError("Duplicate source reference")
                seen.add(item["source_reference"])
                if len(accepted) < limit:
                    accepted.append(item)
            except ValueError as exc:
                rejected.append({"line": i, "reason": str(exc)})
    return accepted, rejected

def submit(records, project_ref):
    if os.environ.get("GTH_TENDER_INGESTION_ENABLED") != "true":
        raise ValueError("Tender ingestion requires GTH_TENDER_INGESTION_ENABLED=true")
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    secret = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_INGESTION_KEY")
    if (not url or not secret or not re.fullmatch(r"[a-z0-9]{12,32}", project_ref) or
        url != f"https://{project_ref}.supabase.co"):
        raise ValueError("Supabase project mismatch or missing configuration")
    endpoint = url + "/rest/v1/tenders?on_conflict=source_name,source_reference"
    for start in range(0, len(records), 50):
        chunk = records[start:start + 50]
        body = json.dumps(chunk).encode("utf-8")
        req = Request(endpoint, data=body, method="POST", headers={
            "apikey": secret,
            "Authorization": "Bearer " + secret,
            "Content-Type": "application/json",
            # Ignore duplicates: a subsequent import must NEVER reset reviewed published records.
            "Prefer": "resolution=ignore-duplicates,return=minimal"
        })
        with urlopen(req, timeout=30) as response:
            if response.status not in (200, 201, 204):
                raise ValueError("Source import failed")

def main(argv=None):
    p=argparse.ArgumentParser(description="Source-verified Tender CSV staging (dry-run by default)")
    p.add_argument("csv_path")
    p.add_argument("--source-name",required=True)
    p.add_argument("--allowed-host",required=True,action="append",help="Exact authorised HTTPS source hostname; repeatable")
    p.add_argument("--limit",type=int,default=500)
    p.add_argument("--commit",action="store_true")
    p.add_argument("--expected-project-ref",default="")
    args=p.parse_args(argv)
    if not (1 <= args.limit <= 500) or not (2 <= len(args.source_name.strip()) <= 120):
        p.error("Invalid source name or batch limit")
    hosts={h.strip().lower() for h in args.allowed_host}
    if any(not re.fullmatch(r"[a-z0-9.-]+",h) or "." not in h for h in hosts):
        p.error("Invalid approved source hostname")
    accepted,rejected=load_csv(args.csv_path,args.source_name.strip(),hosts,args.limit)
    if args.commit:
        if not args.expected_project_ref:
            p.error("--expected-project-ref is mandatory to commit")
        submit(accepted,args.expected_project_ref)
    print(json.dumps({
        "mode": "commit_private_review" if args.commit else "dry_run",
        "accepted": len(accepted),
        "rejected": len(rejected),
        "submitted_for_review": len(accepted) if args.commit else 0,
        "published": 0,
        "rejected_lines": rejected[:20]
    }))
    return 0

if __name__=="__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError) as exc:
        print(json.dumps({"error": str(exc)}),file=sys.stderr)
        sys.exit(1)
