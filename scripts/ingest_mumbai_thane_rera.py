#!/usr/bin/env python3
"""Ingest public MahaRERA project facts, optional OSM geometry and reviewed media.

Python 3.10+. Dry-run by default. See docs/mumbai-thane-rera-ingestion.md.
No browser disguise, CAPTCHA bypass, login automation or undocumented portal API.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pydantic import ValidationError

from rera_ingestion.enrichment import OsmEnricher, attach_reviewed_media
from rera_ingestion.http import Http, RateLimiter
from rera_ingestion.models import CLUSTERS, IngestionError, public_payload
from rera_ingestion.sink import SupabaseSink, configured_client
from rera_ingestion.sources import RegistryCollector, accepted_projects, load_csv


def arguments(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", action="append", type=Path, default=[], help="Authorized CSV export; repeat for multiple districts; automatic fallback when supplied")
    parser.add_argument("--source", choices=("auto", "live", "csv"), default="auto")
    parser.add_argument("--clusters", nargs="+", choices=CLUSTERS, default=list(CLUSTERS))
    parser.add_argument("--limit", type=int, default=100, help="Maximum projects per run, 1–100")
    parser.add_argument("--delay", type=float, default=5.0, help="Minimum gap between source requests and DB operations, at least 1.5 seconds")
    parser.add_argument("--max-pages", type=int, default=10)
    parser.add_argument("--http-retries", type=int, default=3)
    parser.add_argument("--env-file", type=Path, default=Path(".env"))
    parser.add_argument("--offline", action="store_true", help="Validate files without HTTP or database calls")
    parser.add_argument("--district-only", action="store_true", help="Explicitly accept target-district records without a resolved locality; never assert a cluster")
    parser.add_argument("--skip-detail-fetch", action="store_true", help="Retain unverified source records without fetching linked official detail pages")
    parser.add_argument("--osm", action="store_true", help="Enrich through the explicitly configured OVERPASS_URL")
    parser.add_argument("--media-manifest", type=Path, help="Reviewed media rights and exact/category matching manifest")
    parser.add_argument("--run-dir", type=Path, default=Path(".gth-rera"))
    parser.add_argument("--output", type=Path, help="Optional normalized public-field JSON output, no raw source or secrets")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--expected-project-ref", help="Required with --commit; must match SUPABASE_URL")
    args = parser.parse_args(argv)
    if not 1 <= args.limit <= 100 or not 1 <= args.max_pages <= 20 or not 0 <= args.http_retries <= 3:
        parser.error("limit must be 1–100, max-pages 1–20 and retries 0–3")
    if not 1.5 <= args.delay <= 60:
        parser.error("delay must be between 1.5 and 60 seconds")
    if args.source == "csv" and not args.csv:
        parser.error("--source csv requires --csv")
    if args.offline and (not args.csv or args.source == "live" or args.osm or args.media_manifest or args.commit):
        parser.error("--offline requires CSV and cannot use live sources, enrichment or commit")
    if args.commit and not args.expected_project_ref:
        parser.error("--expected-project-ref is required with --commit")
    return args


def write_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    if path.is_symlink():
        raise IngestionError("Output symlinks are forbidden")
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        os.chmod(temporary, 0o600)
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    temporary.replace(path)


def main(argv=None):
    args = arguments(argv)
    load_dotenv(dotenv_path=args.env_file, override=False)
    for name in ("httpx", "httpcore", "urllib3", "postgrest", "supabase"):
        logging.getLogger(name).setLevel(logging.CRITICAL)
    counters = Counter()
    summary = {"mode": "commit" if args.commit else "dry-run", "started_at": datetime.now(timezone.utc).isoformat(),
        "clusters": list(dict.fromkeys(args.clusters)), "source": None, "outcome": "not_started", "http_requests": 0,
        "registry_verification_scope": "Official registry identity only; GTH/AI verification remains separate", "written": 0}
    http = None
    sink = None
    code = 0
    try:
        limiter = RateLimiter(args.delay)
        ua = os.getenv("RERA_USER_AGENT", "GTH-PRO-Registry-Ingest/1.0 (+https://gthproglobal.com)")
        if len(ua) > 250 or "\n" in ua or "\r" in ua:
            raise IngestionError("RERA_USER_AGENT is invalid")
        http = Http(limiter, ua, retries=args.http_retries)
        client = None
        if args.commit:
            if os.getenv("GTH_INGESTION_ENABLED", "").casefold() not in {"1", "true", "yes"}:
                raise IngestionError("Set GTH_INGESTION_ENABLED=true only for an intentional ingestion run")
            client = configured_client(args.expected_project_ref)
        rows = []
        if not args.offline and args.source != "csv":
            try:
                rows = RegistryCollector(http, args.max_pages).collect(tuple(summary["clusters"]))
                summary["source"] = "public_official_GET_forms"
            except IngestionError as exc:
                summary["live_source_notice"] = str(exc)
                if args.source == "live" or not args.csv:
                    raise
        if not rows and args.csv:
            for path in args.csv:
                rows.extend(load_csv(path, counters))
            summary["source"] = "authorized_csv_export"
        summary["source_rows"] = len(rows)
        # A linked detail page may supply a locality absent from the result/export row.
        projects = accepted_projects(rows, tuple(summary["clusters"]), args.limit, counters, allow_district_only=True)
        if not projects:
            raise IngestionError("No valid projects matched the explicit district/locality scope; no database write performed")
        if not args.offline and not args.skip_detail_fetch:
            from rera_ingestion.sources import verify_detail
            verified = []
            for project in projects:
                try:
                    verified.append(verify_detail(project, http))
                except IngestionError:
                    # No false verification, but a useful search/export record can remain pending.
                    counters["detail_verification_unavailable"] += 1
                    verified.append(project)
            projects = verified
        if not args.district_only:
            scoped = []
            for project in projects:
                if project.cluster in summary["clusters"]:
                    scoped.append(project)
                else:
                    counters["unresolved_locality"] += 1
            projects = scoped
            if not projects:
                raise IngestionError("No records have a confirmed target locality; supply an authorized locality-bearing export")
        if args.osm:
            endpoint = os.getenv("OVERPASS_URL", "")
            if not endpoint:
                raise IngestionError("--osm requires an operator-approved OVERPASS_URL")
            counters["osm_matches"] = OsmEnricher(http, endpoint, args.run_dir / "osm-cache").enrich(projects)
        if args.media_manifest:
            hosts = {v.strip().casefold() for v in os.getenv("RERA_MEDIA_HOSTS", "").split(",") if v.strip()}
            if not hosts:
                raise IngestionError("Media enrichment requires explicitly allowed public CDN hosts in RERA_MEDIA_HOSTS")
            counters.update(attach_reviewed_media(projects, args.media_manifest, http, hosts))
        summary.update(accepted=len(projects), registry_identity_matched=sum(p.verified_status for p in projects),
            awaiting_registry_verification=sum(not p.verified_status for p in projects),
            missing_locality=sum(not p.locality for p in projects), missing_price=len(projects),
            project_photo_count=sum(len(p.gallery_images) for p in projects),
            sample_rera_ids=[p.rera_id for p in projects[:10]])
        if args.output:
            write_json(args.output, {"captured_at": summary["started_at"], "properties": [public_payload(p) for p in projects]})
        if args.commit:
            sink = SupabaseSink(client, limiter, batch_size=50)
            results = sink.upsert(projects)
            summary.update(results)
            summary["written"] = results["inserted"] + results["updated"]
        summary["outcome"] = "completed"
    except IngestionError as exc:
        summary.update(outcome="stopped", error=str(exc))
        code = 2
    except (ValidationError, UnicodeError, ValueError, OSError):
        summary.update(outcome="stopped", error="Input, configuration or local file validation failed; no raw response logged")
        code = 2
    except KeyboardInterrupt:
        summary.update(outcome="interrupted", error="Operator interrupted the run; inspect successful batch counts before restarting")
        code = 130
    except Exception:
        summary.update(outcome="stopped", error="Unexpected ingestion failure; details withheld to prevent credential leakage")
        code = 2
    finally:
        if sink:
            summary.update(sink.totals)
            summary["written"] = sink.totals["inserted"] + sink.totals["updated"]
            summary["unacknowledged_write_possible"] = sink.unacknowledged_write_possible
        summary["counters"] = dict(counters)
        summary["http_requests"] = http.request_count if http else 0
        summary["finished_at"] = datetime.now(timezone.utc).isoformat()
        try:
            write_json(args.run_dir / "last-run.json", summary)
        except (IngestionError, OSError):
            summary["summary_file_notice"] = "Could not save the local run summary"
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        if http:
            http.session.close()
    return code


if __name__ == "__main__":
    sys.exit(main())
