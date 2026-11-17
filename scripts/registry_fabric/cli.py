#!/usr/bin/env python3
"""GTH PRO registry fabric: bounded offline validation or authorized MahaRERA research.

Examples:
  python -m scripts.registry_fabric.cli --provider maharera --input /private/projects.csv
  python -m scripts.registry_fabric.cli --provider wbrera --input /private/kolkata.csv
  python -m scripts.registry_fabric.cli --provider maharera --ids-file /private/known_ids.txt \
    --source-authorized --enable-network --limit 20
Default: local staging only; zero network, database writes or deployment.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from .core import (
    MAX_RUN_RECORDS, PROVIDERS, RegistryValidationError, iter_source, validate_rows,
)
from .maharera import load_known_ids, read_public_ids


def args_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider", required=True, choices=sorted((*PROVIDERS, "global")))
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--input", type=Path, help="Authorized CSV or JSONL local snapshot")
    source.add_argument("--ids-file", type=Path, help="Known public numeric MahaRERA project IDs")
    source.add_argument("--west-bengal-list", action="store_true", help="Read one verified official Kolkata project list")
    parser.add_argument("--maharera-compact-archive", action="store_true",
                        help="Read legacy 2024 archive JSONL into staging only; no live-status claim")
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--source-authorized", action="store_true",
                        help="Operator confirms source access and reuse permissions")
    parser.add_argument("--enable-network", action="store_true",
                        help="Explicitly permit bounded public detail requests; default is no network")
    parser.add_argument("--delay", type=float, default=5.0)
    parser.add_argument("--output", type=Path, help="New private staging JSONL; must not exist")
    parser.add_argument("--commit", action="store_true", help="Opt in to existing guarded MahaRERA writer")
    parser.add_argument("--expected-project-ref",
                        help="Exact pre-approved Supabase project ref for intentional writes")
    return parser


def private_output(provider: str, supplied: Path | None) -> Path:
    if supplied is None:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        supplied = Path(".gth-rera/registry-fabric") / (provider + "-" + stamp + ".jsonl")
    if supplied.suffix.lower() != ".jsonl" or supplied.exists() or supplied.is_symlink():
        raise RegistryValidationError("Output must be a new JSONL file")
    parent = supplied.parent
    if any(x.is_symlink() for x in (parent, *parent.parents)):
        raise RegistryValidationError("Staging cannot write through a symbolic link")
    parent.mkdir(parents=True, exist_ok=True)
    return supplied


def execute(argv=None):
    parser = args_parser()
    args = parser.parse_args(argv)
    if not 0 <= args.offset <= 100_000 or not 1 <= args.limit <= MAX_RUN_RECORDS:
        parser.error("Offset/limit exceeds bounded per-run limits")
    if args.provider == "global" and (not args.input or args.enable_network or args.commit or args.ids_file or args.west_bengal_list):
        parser.error("Universal fallback is offline staging-only; no trusted worldwide scrape or DB writer")
    if args.maharera_compact_archive:
        if (args.provider != "maharera" or not args.input
                or args.input.suffix.lower() != ".jsonl" or args.commit or args.enable_network):
            parser.error("Historical compact archive is local MahaRERA staging-only")
    if args.enable_network and not (args.ids_file or args.west_bengal_list):
        parser.error("Network mode requires an explicit approved public source")
    if args.west_bengal_list:
        if args.provider not in ("wbrera", "wbhira") or args.commit:
            parser.error("Official Kolkata listing is West Bengal staging-only")
        if not args.enable_network or not args.source_authorized:
            parser.error("Official Kolkata listing requires source rights and network opt-in")
    if args.ids_file:
        if args.provider != "maharera" or args.commit:
            parser.error("Direct endpoint collection is MahaRERA staging-only until validated")
        if not args.enable_network or not args.source_authorized or args.limit > 100:
            parser.error("Public endpoint requires access approval, network opt-in and <=100 IDs")
    if args.commit:
        if (args.provider != "maharera" or not args.input or not args.source_authorized
                or args.enable_network or not args.expected_project_ref):
            parser.error("Only authorized local MahaRERA imports can use existing protected DB writer")
    output = private_output(args.provider, args.output)
    if args.provider == "global":
        from .universal import UniversalGlobalRegistryAdapter
        projects, report = UniversalGlobalRegistryAdapter.validate_rows(iter_source(args.input), offset=args.offset, limit=args.limit)
    elif args.west_bengal_list:
        from .west_bengal import fetch_kolkata_listing
        rows = fetch_kolkata_listing(args.provider)
        projects, report = validate_rows(args.provider, rows, offset=args.offset, limit=args.limit)
    elif args.ids_file:
        ids = load_known_ids(args.ids_file, offset=args.offset, limit=args.limit)
        rows = read_public_ids(ids, delay=args.delay)
        projects, report = validate_rows(args.provider, rows, limit=len(ids))
    elif args.maharera_compact_archive:
        from .archive import convert_historical_compact
        rows = (convert_historical_compact(row) for row in iter_source(args.input))
        projects, report = validate_rows(args.provider, rows,
                                         offset=args.offset, limit=args.limit)
    elif args.input.suffix.casefold() in (".html", ".htm"):
        if args.provider not in ("wbrera", "wbhira"):
            parser.error("Offline government HTML is only supported for West Bengal")
        from .west_bengal import MAX_BYTES, parse_listing
        if (args.input.is_symlink() or not args.input.is_file()
                or not 0 < args.input.stat().st_size <= MAX_BYTES):
            raise RegistryValidationError("Official HTML must be a local regular file under 8 MB")
        content = args.input.read_text(encoding="utf-8-sig")
        projects, report = validate_rows(args.provider, parse_listing(content, args.provider),
                                         offset=args.offset, limit=args.limit)
    else:
        projects, report = validate_rows(args.provider, iter_source(args.input),
                                         offset=args.offset, limit=args.limit)
    report.update({
        "provider": args.provider, "mode": "commit" if args.commit else "dry-run",
        "source": ("historical_maharera_compact_archive" if args.maharera_compact_archive else
                   "official_kolkata_district_listing" if args.west_bengal_list else
                   "known_public_ids" if args.ids_file else
                   "offline_official_kolkata_html" if args.input and args.input.suffix.casefold() in (".html", ".htm") else
                   "authorized_local_snapshot"),
        "publication_status": "not_published", "network": bool(args.ids_file or args.west_bengal_list),
        "truth": "Public registry reference only; no inventory, ownership or GTH verification",
    })
    if args.maharera_compact_archive:
        observed = [p.source_last_modified for p in projects if p.source_last_modified]
        report["freshness"] = {
            "type": "historical_source_date_not_live",
            "earliest": min(observed) if observed else None,
            "latest": max(observed) if observed else None,
        }
    if not projects:
        raise RegistryValidationError("No validated public project records")
    if args.commit and report["rejected"]:
        raise RegistryValidationError("No database writes: input contains rejected rows")
    # Stage validated data before any remote operation; never emit raw provider responses.
    with output.open("x", encoding="utf-8") as handle:
        for project in projects:
            handle.write(json.dumps(project.public_dict(), ensure_ascii=False, sort_keys=True) + "\n")
    report["staging_file"] = str(output)
    if args.commit:
        root = Path(__file__).resolve().parents[2]
        sys.path.insert(0, str(root / "src/app/real-estate/services"))
        from rera_csv_import import commit_batches
        rows = [project.maharera_insert() for project in projects]
        inserted = commit_batches(rows, 50, args.expected_project_ref)
        report["publication_status"] = "existing_insert_only_writer_completed"
        report["database_inserted"] = inserted
        report["database_already_present"] = len(rows) - inserted
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


def main(argv=None):
    try:
        return execute(argv)
    except RegistryValidationError as exc:
        print(json.dumps({"outcome": "stopped", "error": str(exc),
                          "database_writes": "not_performed_or_unknown"}), file=sys.stderr)
        return 2
    except Exception:
        print(json.dumps({"outcome": "stopped", "error": "Source or publication failed; check private logs",
                          "database_writes": "unconfirmed; verify before retry"}), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
