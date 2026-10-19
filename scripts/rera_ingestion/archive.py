"""Allowlisted, read-only parsing of operator-supplied historic MahaRERA CSV ZIP snapshots.

This is a *source snapshot*, not live availability or official identity verification.
No contact/bank fields, media, listing prices or current status are inferred.
"""
from __future__ import annotations

import csv
import hashlib
import io
import re
import zipfile
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

from pydantic import ValidationError

from .models import IngestionError, Project, SEARCH_URL, normalize, text

DATASETS = {
    "Mumbai City": "mumbai-city-rera-dataset.csv",
    "Mumbai Suburban": "mumbai-suburban-rera-dataset.csv",
    "Thane": "thane-rera-dataset.csv",
}
REVOKED = "revoked-projects-rera-dataset.csv"
MAX_ARCHIVE_BYTES = 40_000_000
MAX_UNPACKED_BYTES = 35_000_000
MAX_MEMBER_BYTES = 15_000_000
METRICS = {
    "project_area_(sqmts)": "project_area_sqm",
    "recreational_open_space": "recreational_open_space",
    "sanctioned_fsi": "sanctioned_fsi",
    "cases_count": "reported_cases_count",
    "complaints_count": "reported_complaints_count",
    "number_of_appartments": "reported_apartments",
    "number_of_booked_appartments": "reported_booked_apartments",
    "number_of_basements": "reported_basements",
    "number_of_plinth": "reported_plinths",
    "number_of_podiums": "reported_podiums",
    "number_of_sanctioned_floors": "reported_sanctioned_floors",
    "number_of_stilts": "reported_stilts",
    "total_no__of_open_parking_as_per_sanctioned_plan_(4-wheeler+2-wheeler)": "reported_open_parking",
    "number_of_closed_parking": "reported_closed_parking",
    "number_of_plots": "reported_plots",
    "area_of_plot(in_sqmts)": "reported_plot_area_sqm",
    "number_of_plots_booked_/_alloted_/_sold": "reported_booked_plots",
}
COORDS = re.compile(r"^\s*\(\s*'([+-]?\d+(?:\.\d+)?)'\s*,\s*'([+-]?\d+(?:\.\d+)?)'\s*\)\s*$")
RERA = re.compile(r"^P\d{11}$")
EXPECTED_PREFIX = {"Mumbai City": "P519", "Mumbai Suburban": "P518", "Thane": "P517"}
REQUIRED_COLUMNS = {"district", "rera_id", "project_name", "promoter_name",
                    "proposed_date_of_completion", "project_type", "location_lat_long"}


def snapshot_date(raw: str) -> str | None:
    """This particular dataset explicitly uses month/day/year, not the generic CSV date contract."""
    if not raw.strip():
        return None
    try:
        parsed = datetime.strptime(raw.strip(), "%m/%d/%Y").date()
        if not 1900 <= parsed.year <= 2100:
            return None
        return parsed.isoformat()
    except ValueError:
        return None


def safe_metric(raw: str) -> str | None:
    if not raw or len(raw) > 36:
        return None
    try:
        parsed = Decimal(raw.strip().replace(",", ""))
        if not parsed.is_finite() or parsed < 0 or parsed > Decimal("1000000000000"):
            return None
        return format(parsed.normalize(), "f")
    except (InvalidOperation, ValueError):
        return None


def csv_rows(zf: zipfile.ZipFile, info: zipfile.ZipInfo):
    # ZipInfo is validated before any member is read; never extract paths to disk.
    with zf.open(info) as stream:
        decoded = io.TextIOWrapper(stream, encoding="utf-8-sig", newline="")
        reader = csv.DictReader(decoded)
        if not reader.fieldnames or not REQUIRED_COLUMNS.issubset(reader.fieldnames):
            raise IngestionError("Snapshot CSV is missing expected public registry columns")
        if len(reader.fieldnames) != len(set(reader.fieldnames)) or len(reader.fieldnames) > 80:
            raise IngestionError("Snapshot CSV has ambiguous or excessive columns")
        for index, row in enumerate(reader, 2):
            if index > 100_001:
                raise IngestionError("Snapshot CSV exceeds the row safety limit")
            if None in row:
                raise IngestionError("Malformed snapshot CSV row")
            yield row


def parse_record(row: dict, name: str, file_hash: str, counters: Counter) -> Project | None:
    district = text(row.get("district"), 80)
    registration = text(row.get("rera_id"), 30).upper()
    if district not in DATASETS or not RERA.fullmatch(registration):
        counters["invalid_scope_or_registration"] += 1
        return None
    # Do not silently rewrite conflicting official district labels using RERA prefixes.
    if not registration.startswith(EXPECTED_PREFIX[district]):
        counters["district_prefix_conflict"] += 1
        return None
    planned = snapshot_date(row.get("proposed_date_of_completion") or "")
    if row.get("proposed_date_of_completion") and not planned:
        counters["invalid_proposed_dates"] += 1
    value = (row.get("project_type") or "").strip()
    kind = ("Mixed" if value.startswith("Mixed") else
            "Residential" if value == "Group Housing" else value)
    raw = {
        "rera_id": registration, "project_name": row.get("project_name"),
        "developer_name": row.get("promoter_name"), "district": district,
        "property_type": kind, "possession_date": planned,
        "source_url": SEARCH_URL,
    }
    pin = text(row.get("location_pin_code"), 8)
    match = COORDS.fullmatch(row.get("location_lat_long") or "")
    if match:
        lat, lon = Decimal(match.group(1)), Decimal(match.group(2))
        # Existing importer has intentionally narrow Mumbai/Thane bounds.
        if Decimal("18.8") <= lat <= Decimal("19.6") and Decimal("72.6") <= lon <= Decimal("73.5"):
            raw.update(latitude=str(lat), longitude=str(lon))
        else:
            counters["coordinates_excluded_outside_supported_bounds"] += 1
    elif row.get("location_lat_long"):
        counters["coordinates_excluded_unrecognized_format"] += 1
    try:
        project = normalize(raw)
    except (IngestionError, ValidationError, ValueError):
        counters["invalid_project_rows"] += 1
        return None
    metrics = {public_name: value for source_name, public_name in METRICS.items()
               if (value := safe_metric(row.get(source_name) or "")) is not None}
    source_modified = snapshot_date(row.get("date_last_modified") or "")
    if source_modified is None and row.get("date_last_modified"):
        counters["invalid_last_modified_dates"] += 1
    # Only public, explicitly allowlisted fields from the CSV are retained.
    project.registry_evidence = {
        "kind": "operator_supplied_historic_csv_snapshot",
        "exact_detail_match": False,
        "snapshot_file": name,
        "snapshot_sha256": file_hash,
        "source_last_modified": source_modified,
        "source_project_status": text(row.get("project_status"), 80) or None,
        "source_project_type": text(row.get("project_type"), 80) or None,
        "source_postal_code": pin if re.fullmatch(r"\d{6}", pin) else None,
        "revised_proposed_completion": snapshot_date(row.get("revised_proposed_date_of_completion") or ""),
        "extended_proposed_completion": snapshot_date(row.get("extended_date_of_completion") or ""),
        "snapshot_metrics": metrics,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "scope": "Unverified historic registry reference only; no live availability, price, images or GTH verification",
    }
    return project


def read_archive(path: Path, *, offset: int = 0, limit: int = 1000) -> tuple[list[Project], dict]:
    """Read all three target districts, exclude revoked references, interleave fair batches."""
    if not 0 <= offset <= 100_000 or not 1 <= limit <= 5000:
        raise IngestionError("Archive offset or batch limit is outside supported bounds")
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_ARCHIVE_BYTES:
        raise IngestionError("Source ZIP must be a regular private file under 40 MB")
    with path.open("rb") as source_file:
        archive_hash = hashlib.file_digest(source_file, "sha256").hexdigest()
    counts = Counter()
    pools: dict[str, list[Project]] = {district: [] for district in DATASETS}
    try:
        with zipfile.ZipFile(path) as zf:
            infos = zf.infolist()
            if not infos or len(infos) > 20 or sum(i.file_size for i in infos) > MAX_UNPACKED_BYTES:
                raise IngestionError("Archive exceeds member-count or uncompressed size limits")
            if any(i.is_dir() or "/" in i.filename or "\\" in i.filename or i.file_size > MAX_MEMBER_BYTES
                   or i.flag_bits & 1 for i in infos):
                raise IngestionError("Unsafe archive structure")
            info_by_name = {info.filename: info for info in infos}
            if len(info_by_name) != len(infos):
                raise IngestionError("Duplicate archive filenames")
            if not set(DATASETS.values()).issubset(info_by_name):
                raise IngestionError("Mumbai City, Suburban and Thane CSVs are all required")
            # The revoked file is required so its identities cannot be listed accidentally.
            if REVOKED not in info_by_name:
                raise IngestionError("Revoked-project exclusions file is required")
            revoked = {
                text(row.get("rera_id"), 30).upper()
                for row in csv_rows(zf, info_by_name[REVOKED])
                if RERA.fullmatch(text(row.get("rera_id"), 30).upper())
            }
            counts["revoked_reference_count"] = len(revoked)
            seen: dict[str, Project] = {}
            conflicts: set[str] = set()
            for district, filename in DATASETS.items():
                info = info_by_name[filename]
                raw_bytes = zf.read(info)
                file_hash = hashlib.sha256(raw_bytes).hexdigest()
                for row in csv_rows(zf, info):
                    counts["target_source_rows"] += 1
                    rid = text(row.get("rera_id"), 30).upper()
                    if rid in revoked:
                        counts["revoked_rows_excluded"] += 1
                        continue
                    if text(row.get("district"), 80) != district:
                        counts["filename_district_conflicts"] += 1
                        continue
                    project = parse_record(row, filename, file_hash, counts)
                    if project is None:
                        continue
                    previous = seen.get(project.rera_id)
                    if previous:
                        if previous.project_name.casefold() != project.project_name.casefold() or previous.district != project.district:
                            conflicts.add(project.rera_id)
                        counts["duplicate_rows"] += 1
                        continue
                    seen[project.rera_id] = project
            for rid in conflicts:
                seen.pop(rid, None)
            counts["conflicting_registrations_quarantined"] = len(conflicts)
            for project in seen.values():
                pools[project.district].append(project)
    except (zipfile.BadZipFile, EOFError, UnicodeError, csv.Error, OSError):
        raise IngestionError("Archive is invalid, corrupt or not readable as approved UTF-8 CSV") from None

    for district in pools:
        pools[district].sort(key=lambda p: p.rera_id)
    # Interleave rather than using all 1,000 from the first (Mumbai City) file.
    selected: list[Project] = []
    maximum = max(map(len, pools.values()))
    for position in range(maximum):
        for district in ("Mumbai Suburban", "Thane", "Mumbai City"):
            if position < len(pools[district]):
                selected.append(pools[district][position])
    counts["eligible_unique_target_projects"] = len(selected)
    selection = selected[offset:offset + limit]
    counts["selected_for_this_batch"] = len(selection)
    counts["selected_mumbai_suburban"] = sum(p.district == "Mumbai Suburban" for p in selection)
    counts["selected_thane"] = sum(p.district == "Thane" for p in selection)
    counts["selected_mumbai_city"] = sum(p.district == "Mumbai City" for p in selection)
    return selection, {"archive_sha256": archive_hash, "offset": offset, "limit": limit,
                       "scope": list(DATASETS), "counts": dict(counts)}
