"""Adapt the user's existing compact 2024 MahaRERA staging JSONL safely.

Records were previously staged using compact public keys: r (registration),
n (project name), b (promoter), d (district), a (source last modified).
All price, coordinates, inferred status and unreviewed extra metrics stay out
of the public normalized result. Historical data is never labelled current.
"""
from __future__ import annotations
import re
from .core import RegistryValidationError

SUPPORTED_DISTRICTS = frozenset(("Mumbai City", "Mumbai Suburban", "Thane"))


def convert_historical_compact(row: object) -> dict:
    if not isinstance(row, dict):
        raise RegistryValidationError("Historical staging row must be a JSON object")
    if len(row) > 40:
        raise RegistryValidationError("Historical staging row contains unsupported fields")
    district = row.get("d")
    if district not in SUPPORTED_DISTRICTS:
        raise RegistryValidationError("Historical source is outside the approved Mumbai–Thane scope")
    status = row.get("st")
    if status is not None and not isinstance(status, str):
        raise RegistryValidationError("Historical project status is invalid")
    if status and re.search(r"revok|reject|cancel|withdraw|suspend", status, re.IGNORECASE):
        raise RegistryValidationError("Historical revoked/rejected registration quarantined")
    return {
        "rera_id": row.get("r"),
        "project_name": row.get("n"),
        "developer_name": row.get("b"),
        "district": district,
        "state": "Maharashtra",
        # Never treat the archived project_status as a live approval status.
        "source_last_modified": row.get("a"),
    }
