#!/usr/bin/env python3
"""Resume a bounded public-endpoint crawl for Mumbai/Thane; dry-run by default.

Uses the existing validated models, HTTPS transport and 50-row Supabase sink.
No API subscription, portal password, cookie replay or CSV export is required.
Public source access still must work. See docs/mumbai-thane-rera-ingestion.md.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import re
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from ingest_mumbai_thane_rera import write_json
from rera_ingestion.checkpoint import Checkpoint
from rera_ingestion.endpoint import ENDPOINT, EndpointCollector
from rera_ingestion.http import Http, RateLimiter
from rera_ingestion.models import DISTRICTS, IngestionError
from rera_ingestion.sink import SupabaseSink, configured_client


def arguments(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--limit", type=int, default=1000, help="Target unique district projects in this checkpoint (1–5000)")
    p.add_argument("--ids-file", type=Path, help="Existing numeric project IDs, one per line; RERA registration numbers are different")
    p.add_argument("--id-start", type=int, default=1)
    p.add_argument("--id-end", type=int, default=20000)
    p.add_argument("--fetch-budget", type=int, default=2500, help="Maximum new detail fetches this invocation (1–5000)")
    p.add_argument("--time-budget", type=int, default=18000, help="Maximum seconds before checkpoint pause (60–18000)")
    p.add_argument("--delay", type=float, default=5.0)
    p.add_argument("--http-retries", type=int, default=2)
    p.add_argument("--run-dir", type=Path, default=Path(".gth-rera/endpoint-bulk"))
    p.add_argument("--env-file", type=Path, default=Path(".env"))
    p.add_argument("--expected-project-ref", default="dqprqjmhxjnrllczqyhz")
    p.add_argument("--commit", action="store_true")
    a = p.parse_args(argv)
    if not (1 <= a.limit <= 5000 and 1 <= a.fetch_budget <= 5000 and 60 <= a.time_budget <= 18000):
        p.error("Invalid target, fetch budget or time budget")
    if not (1 <= a.id_start <= a.id_end <= 1_000_000 and a.id_end - a.id_start < 100_000):
        p.error("Choose a bounded public project ID range of at most 100000 IDs")
    if not 1.5 <= a.delay <= 60 or not 0 <= a.http_retries <= 3:
        p.error("Delay must be 1.5–60 seconds and retries 0–3")
    if not re.fullmatch(r"[a-z0-9]{20}", a.expected_project_ref):
        p.error("A valid explicit target Supabase project ref is required")
    return a


def candidates(args):
    if args.ids_file:
        path = args.ids_file
        if path.is_symlink() or not path.is_file() or path.stat().st_size > 2_000_000:
            raise IngestionError("Numeric ID file must be a regular file under 2 MB")
        lines = [s.strip() for s in path.read_text(encoding="utf-8-sig").splitlines() if s.strip()]
        if not lines or len(lines) > 100_000 or any(not re.fullmatch(r"[1-9][0-9]{0,5}", s) for s in lines):
            raise IngestionError("ID file must contain positive numeric public project IDs only")
        ids = sorted({int(s) for s in lines})
    else:
        ids = range(args.id_start, args.id_end + 1)
    scope = {"version": 1, "endpoint": ENDPOINT, "districts": sorted(DISTRICTS), "ids": list(ids)}
    fingerprint = hashlib.sha256(json.dumps(scope, sort_keys=True).encode()).hexdigest()
    return ids, fingerprint


def main(argv=None):
    args = arguments(argv)
    load_dotenv(args.env_file, override=False)
    for name in ("httpx", "httpcore", "urllib3", "postgrest", "supabase"):
        logging.getLogger(name).setLevel(logging.CRITICAL)
    summary = {"mode": "commit" if args.commit else "dry-run", "target_unique_projects": args.limit,
        "districts": list(DISTRICTS), "started_at": datetime.now(timezone.utc).isoformat(),
        "outcome": "not_started", "fetched_this_run": 0, "written_this_run": 0,
        "source_contract": "operator_supplied_public_detail_endpoint; current live schema not yet validated"}
    checkpoint = http = sink = None
    counters = Counter()
    code = 2
    deadline = time.monotonic() + args.time_budget
    try:
        ids, fingerprint = candidates(args)
        checkpoint = Checkpoint(args.run_dir, fingerprint, args.expected_project_ref)
        if checkpoint.counts()["cached_target_projects"] > args.limit:
            raise IngestionError("Checkpoint already exceeds this target; retain its prior limit or use a separate run directory")
        limiter = RateLimiter(args.delay)
        ua = os.getenv("RERA_USER_AGENT", "GTH-PRO-Registry-Ingest/1.0 (+https://gthproglobal.com)")
        if len(ua) > 250 or "\n" in ua or "\r" in ua:
            raise IngestionError("RERA_USER_AGENT is invalid")
        http = Http(limiter, ua, retries=args.http_retries, request_budget=min(20000, args.fetch_budget * (args.http_retries + 1) + 10))
        if args.commit:
            if os.getenv("GTH_INGESTION_ENABLED", "").lower() not in {"1", "true", "yes"}:
                raise IngestionError("Intentional writes require GTH_INGESTION_ENABLED=true")
            sink = SupabaseSink(configured_client(args.expected_project_ref), limiter)

        def flush(force=False):
            if not sink:
                return
            while True:
                pending = checkpoint.projects(pending_only=True, limit=min(50, args.limit))
                if not pending or (len(pending) < 50 and not force):
                    return
                sink.upsert(pending)
                checkpoint.acknowledge(pending)

        flush(force=True)
        collector = EndpointCollector(http)
        for project_id in ids:
            if checkpoint.counts()["cached_target_projects"] >= args.limit:
                break
            if checkpoint.attempted(project_id):
                counters["resumed_ids_skipped"] += 1
                continue
            if summary["fetched_this_run"] >= args.fetch_budget or time.monotonic() >= deadline:
                break
            project, outcome = collector.fetch(project_id)
            summary["source_contract"] = "supported_public_detail_response_received"
            checkpoint.save(project_id, outcome, project)
            summary["fetched_this_run"] += 1
            counters[outcome] += 1
            flush()
            if summary["fetched_this_run"] % 50 == 0:
                print(json.dumps({"event": "checkpoint", "fetched_this_run": summary["fetched_this_run"], **checkpoint.counts()}), flush=True)
        flush(force=True)
        complete = checkpoint.counts()["cached_target_projects"] >= args.limit
        summary["outcome"] = "target_collected" if complete else "paused_before_target"
        code = 0 if complete else 3
    except IngestionError as exc:
        summary.update(outcome="stopped", error=str(exc))
    except KeyboardInterrupt:
        summary.update(outcome="interrupted", error="Saved progress retained; rerun the same command to resume")
        code = 130
    except Exception:
        summary.update(outcome="stopped", error="Input, checkpoint or provider failure; raw details withheld")
    finally:
        if checkpoint:
            summary.update(checkpoint.counts())
            checkpoint.close()
        if sink:
            summary["database_this_run"] = dict(sink.totals)
            summary["written_this_run"] = sink.totals["inserted"] + sink.totals["updated"]
            summary["unacknowledged_write_possible"] = sink.unacknowledged_write_possible
        summary.update(counters=dict(counters), http_requests=http.request_count if http else 0,
            finished_at=datetime.now(timezone.utc).isoformat())
        if http:
            http.session.close()
        try:
            write_json(args.run_dir / "last-run.json", summary)
        except (IngestionError, OSError):
            summary["summary_file_notice"] = "Could not save run summary"
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    return code


if __name__ == "__main__":
    sys.exit(main())
