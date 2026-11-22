"""Resumable low-pressure worldwide SEO enrichment using the EXISTING AI engine.

By default the program is a read-only preview. --write and the existing explicit
GTH_INGESTION_ENABLED=true server-side gate are both required for AI/DB writes.
No automatic Googlebot/visitor calls or production schedule are created here.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time

from ai_engine import GenerationError, fingerprint, generate_city_batch, validate_city_batch
from supabase_db import _ingestion_client, pending_seo_draft, read_destination_page, save_seo_draft

log = logging.getLogger("gth-city-seo")


def parse_args(argv=None):
    p = argparse.ArgumentParser(description="Bounded GTH PRO worldwide city SEO batches")
    p.add_argument("--write", action="store_true", help="Explicit AI-generation and DB-write approval")
    p.add_argument("--cursor", default="", help="Last processed UUID; use next_cursor from previous run")
    p.add_argument("--batch-size", type=int, default=int(os.getenv("GTH_SEO_BATCH_SIZE", "10")))
    p.add_argument("--max-calls", type=int, default=int(os.getenv("GTH_SEO_MAX_CALLS", "3")))
    p.add_argument("--max-reads", type=int, default=int(os.getenv("GTH_SEO_MAX_READS", "2")))
    p.add_argument("--page-size", type=int, default=int(os.getenv("GTH_SEO_PAGE_SIZE", "50")))
    p.add_argument("--min-interval", type=float, default=float(os.getenv("GTH_SEO_MIN_INTERVAL", "40")))
    return p.parse_args(argv)


def run(*, client, generator=generate_city_batch, writer=save_seo_draft,
        write=False, cursor="", batch_size=10, max_calls=3, max_reads=2, page_size=50,
        min_interval=40.0, sleep=time.sleep):
    if not 1 <= batch_size <= 25 or not 1 <= max_calls <= 100 or not 1 <= max_reads <= 10 or not 1 <= page_size <= 200:
        raise ValueError("Unsafe per-run DB/API budgets")
    if not 0 <= min_interval <= 3600:
        raise ValueError("Unsafe Gemini request interval")
    if cursor and (len(cursor) != 36 or not all(ch in "0123456789abcdefABCDEF-" for ch in cursor)):
        raise ValueError("Invalid resume cursor")
    stats = {"db_reads": 0, "ai_calls": 0, "written": 0, "pending": 0,
             "skipped": 0, "failed": 0, "dry_run": not write, "next_cursor": cursor}
    last_safe_cursor = cursor
    group = []
    seen = {"seo_title": set(), "seo_description": set(), "description": set()}

    def flush():
        nonlocal last_safe_cursor
        if not group:
            return True
        if stats["ai_calls"] >= max_calls:
            return False
        if not write:
            stats["skipped"] += len(group)
            last_safe_cursor = group[-1]["id"]
            group.clear()
            return True
        if stats["ai_calls"] and min_interval:
            sleep(min_interval)
        stats["ai_calls"] += 1
        try:
            generated = generator(group)
            validated = validate_city_batch(group, [dict(d) for d in generated], prior_fingerprints=seen)
            # Stage entire batch before any row writes: reject duplicates and identity swaps.
            for city, draft in zip(group, validated):
                for field in seen:
                    seen[field].add(fingerprint(draft[field], city))
            for city, draft in zip(group, validated):
                if writer(client, city, draft):
                    stats["written"] += 1
            last_safe_cursor = group[-1]["id"]
            group.clear()
            return True
        except Exception:
            stats["failed"] += len(group)
            log.warning("Batch failed closed: review source/quota before retrying from last cursor")
            return False

    for _ in range(max_reads):
        if write and stats["ai_calls"] >= max_calls:
            break
        rows = read_destination_page(client, cursor=last_safe_cursor, limit=page_size, pending_only=True)
        stats["db_reads"] += 1
        if not rows:
            break
        for city in rows:
            if not isinstance(city, dict) or not isinstance(city.get("id"), str):
                stats["failed"] += 1
                stats["next_cursor"] = last_safe_cursor
                return stats
            if not pending_seo_draft(city):
                stats["skipped"] += 1
                if not group:
                    last_safe_cursor = city["id"]
                continue
            stats["pending"] += 1
            group.append(city)
            if len(group) >= batch_size:
                if not flush():
                    stats["next_cursor"] = last_safe_cursor
                    return stats
        if not group and len(rows) < page_size:
            break
        if group:
            # Page-level flush guarantees the cursor never jumps past unpublished rows.
            if not flush():
                stats["next_cursor"] = last_safe_cursor
                return stats
        if len(rows) < page_size:
            break
    stats["next_cursor"] = last_safe_cursor
    return stats


def main(argv=None):
    args = parse_args(argv)
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(message)s")
    # Existing administrator permission gate; no client-side DB key.
    client = _ingestion_client()
    result = run(client=client, write=args.write, cursor=args.cursor,
                 batch_size=args.batch_size, max_calls=args.max_calls,
                 max_reads=args.max_reads, page_size=args.page_size,
                 min_interval=args.min_interval)
    print(json.dumps(result, sort_keys=True))
    return 1 if result["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
