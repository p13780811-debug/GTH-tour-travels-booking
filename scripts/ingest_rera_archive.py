#!/usr/bin/env python3
"""Resume offline validation and optional protected 50-row database upserts from a private MahaRERA ZIP.

No endpoint requests. No database changes unless --commit, the explicit target ref,
a trusted private writer and authorization confirmation are all provided.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from rera_ingestion.archive import read_archive
from rera_ingestion.checkpoint import Checkpoint
from rera_ingestion.http import RateLimiter
from rera_ingestion.models import IngestionError


def arguments(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--zip", type=Path, required=True, help="Private authorized MahaRERA district ZIP; never commit it to a public repo")
    p.add_argument("--offset", type=int, default=0, help="Starting index within a stable interleaved target selection")
    p.add_argument("--limit", type=int, default=1000, help="Up to 5000 distinct target projects per checkpoint")
    p.add_argument("--run-dir", type=Path, default=Path(".gth-rera/archive-bulk"))
    p.add_argument("--env-file", type=Path, default=Path(".env"))
    p.add_argument("--delay", type=float, default=5.0, help="Minimum delay between database operations")
    p.add_argument("--expected-project-ref", default="dqprqjmhxjnrllczqyhz", help="Exact preselected GTH Supabase project ref")
    p.add_argument("--authorized-snapshot", action="store_true", help="Explicitly confirm rights/provenance review for database ingestion")
    p.add_argument("--commit", action="store_true", help="Opt-in to server-only protected database upsert")
    a = p.parse_args(argv)
    if not 0 <= a.offset <= 100_000 or not 1 <= a.limit <= 5000 or not 1.5 <= a.delay <= 60:
        p.error("Invalid offset, limit or delay")
    if a.commit and (not re.fullmatch(r"[a-z0-9]{20}", a.expected_project_ref) or not a.authorized_snapshot):
        p.error("Commit requires a real --expected-project-ref and --authorized-snapshot")
    return a


def main(argv=None) -> int:
    args = arguments(argv)
    load_dotenv(args.env_file, override=False)
    for name in ("supabase", "postgrest", "httpx", "urllib3"):
        logging.getLogger(name).setLevel(logging.CRITICAL)
    report = {"mode": "commit" if args.commit else "offline_dry_run",
              "started_at": datetime.now(timezone.utc).isoformat(), "database_writes": 0,
              "outcome": "not_started",
              "truth": "Historic user-supplied snapshot only; registry identity and live inventory not verified"}
    checkpoint = sink = None
    code = 2
    try:
        projects, snapshot = read_archive(args.zip, offset=args.offset, limit=args.limit)
        report.update(snapshot)
        if not projects:
            raise IngestionError("No target records in this archive window")
        if args.commit and os.getenv("GTH_INGESTION_ENABLED", "").casefold() not in {"1", "true", "yes"}:
            raise IngestionError("Commit disabled: GTH_INGESTION_ENABLED=true is required")
        if args.commit:
            # Import only on the server; never expose service_role in logs, browser or source.
            from rera_ingestion.sink import SupabaseSink, configured_client
            sink = SupabaseSink(configured_client(args.expected_project_ref),
                                RateLimiter(args.delay), batch_size=50)
        # Even dry-run uses a private checkpoint so commit can resume without rescanning endpoints.
        fingerprint = hashlib.sha256(json.dumps({
            "kind": "historic_archive_v1", "sha256": snapshot["archive_sha256"],
            "offset": args.offset, "limit": args.limit, "districts": snapshot["scope"],
        }, sort_keys=True).encode()).hexdigest()
        checkpoint = Checkpoint(args.run_dir, fingerprint, args.expected_project_ref)
        for position, project in enumerate(projects, 1):
            if not checkpoint.attempted(position):
                checkpoint.save(position, "validated_csv_snapshot", project)
        report["checkpoint"] = checkpoint.counts()
        if sink:
            while True:
                pending = checkpoint.projects(pending_only=True, limit=50)
                if not pending:
                    break
                sink.upsert(pending)
                checkpoint.acknowledge(pending)
            report["database_writes"] = sink.totals["inserted"] + sink.totals["updated"]
            report["database_summary"] = dict(sink.totals)
        report["outcome"] = "completed"
        code = 0
    except IngestionError as exc:
        report.update(outcome="stopped", error=str(exc))
    except KeyboardInterrupt:
        report.update(outcome="interrupted", error="The private checkpoint remains available")
        code = 130
    except (OSError, ValueError):
        report.update(outcome="stopped", error="Invalid local ZIP or checkpoint; no source rows printed")
    except Exception:
        report.update(outcome="stopped", error="Safe ingestion stopped; private error details omitted")
    finally:
        if checkpoint:
            report["checkpoint"] = checkpoint.counts()
            checkpoint.close()
        if sink:
            report["database_summary"] = dict(sink.totals)
            report["database_writes"] = sink.totals["inserted"] + sink.totals["updated"]
            report["unacknowledged_write_possible"] = sink.unacknowledged_write_possible
        report["finished_at"] = datetime.now(timezone.utc).isoformat()
        print(json.dumps(report, indent=2, sort_keys=True))
    return code


if __name__ == "__main__":
    sys.exit(main())
