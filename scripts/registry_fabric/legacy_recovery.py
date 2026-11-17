"""Read-only, compact recovery of historical 812 MahaRERA-format rows.

Preserves the correct district/taluka/village/land locality without accepting
hardcoded legacy "Mumbai" as geography, unverified flags or duplicate geotags.
No network, Supabase credentials, auto-publication or database writes.
"""
from __future__ import annotations

import json
import math
import re
from dataclasses import asdict, dataclass

from .core import RegistryValidationError, clean

REF = re.compile(r"^P[0-9]{11}$")
PIN = re.compile(r"^[0-9]{6}$")


@dataclass(frozen=True)
class LegacyRecoveredLocation:
    registration_id: str
    project_name: str
    state: str
    district: str
    taluka: str | None
    village: str | None
    address_locality: str | None
    postal_code: str | None
    latitude_candidate: float | None
    longitude_candidate: float | None
    source_status: str = "historical_unverified"
    coordinate_review_required: bool = True
    city: None = None  # Never propagate 2026 legacy hardcoded "Mumbai".
    official_source_url: None = None

    def private_review_dict(self) -> dict:
        return asdict(self)


def _text(value: object, limit: int) -> str | None:
    item = clean(value, limit)
    if item and ("<" in item or ">" in item or "\x7f" in item):
        raise RegistryValidationError("Unsafe historic project value")
    return item


def _parse_raw(value: object) -> dict:
    if isinstance(value, dict):
        data = value
    elif isinstance(value, str) and len(value.encode("utf-8")) <= 100_000:
        try:
            data = json.loads(value)
        except ValueError as error:
            raise RegistryValidationError("Invalid historical JSON structure") from error
    else:
        raise RegistryValidationError("Historical data must be a bounded JSON object")
    if not isinstance(data, dict):
        raise RegistryValidationError("Expected historic object")
    return data


def _geo(value: object, max_abs: float) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise RegistryValidationError("Invalid legacy coordinates")
    try:
        number = float(value)
    except (ValueError, TypeError) as error:
        raise RegistryValidationError("Invalid legacy coordinates") from error
    if not math.isfinite(number) or abs(number) > max_abs:
        raise RegistryValidationError("Invalid legacy coordinates")
    return round(number, 5)


def recover_legacy_rera(row: dict) -> LegacyRecoveredLocation:
    if not isinstance(row, dict) or row.get("source_type") != "rera":
        raise RegistryValidationError("Only historical RERA-format rows supported")
    registration = _text(row.get("rera_id"), 32)
    title = _text(row.get("title"), 140)
    if not registration or not REF.fullmatch(registration) or not title or len(title) < 3:
        raise RegistryValidationError("Missing historical project identity")
    raw = _parse_raw(row.get("raw_json"))
    land = raw.get("land", {})
    geo = raw.get("geo", {})
    if not isinstance(land, dict) or not isinstance(geo, dict):
        raise RegistryValidationError("Historical land/geo must be objects")
    state = _text(row.get("state") or land.get("stateName"), 64)
    if state and state.casefold() != "maharashtra":
        raise RegistryValidationError("Authority and state mismatch")
    district = _text(row.get("district") or land.get("districtName"), 100)
    if not district:
        raise RegistryValidationError("Historical district not recorded")
    taluka = _text(row.get("taluka") or land.get("talukaName"), 100)
    village = _text(row.get("village") or land.get("villageName"), 120)
    address_locality = _text(row.get("locality") or land.get("locality"), 150)
    pin = _text(row.get("pin_code") or land.get("pinCode"), 16)
    if pin and not PIN.fullmatch(pin):
        raise RegistryValidationError("Invalid historical PIN")
    lat = _geo(row.get("lat"), 90)
    lng = _geo(row.get("lng"), 180)
    source_lat = _geo(geo.get("latitude"), 90)
    source_lng = _geo(geo.get("longitude"), 180)
    if (lat is None) != (lng is None):
        raise RegistryValidationError("Incomplete coordinate pair")
    if (source_lat is None) != (source_lng is None):
        raise RegistryValidationError("Incomplete source coordinate pair")
    if lat is not None and source_lat is not None and (
        abs(lat-source_lat)>0.00002 or abs(lng-source_lng)>0.00002
    ):
        raise RegistryValidationError("Historic coordinate conflicts with archived source")
    # Explicitly quarantine all legacy points until an independently checked
    # geography reconciles duplicate points across Pune, Thane, Nashik, etc.
    return LegacyRecoveredLocation(
        registration_id=registration, project_name=title,
        state="Maharashtra", district=district, taluka=taluka, village=village,
        address_locality=address_locality, postal_code=pin,
        latitude_candidate=lat if lat is not None else source_lat,
        longitude_candidate=lng if lng is not None else source_lng,
    )


def detect_cross_district_geo_reuse(records: list[LegacyRecoveredLocation]) -> set[str]:
    """Return reference IDs sharing a point across different source districts."""
    indexed: dict[tuple[float, float], tuple[str, list[str]]] = {}
    unsafe: set[str] = set()
    for record in records:
        if record.latitude_candidate is None or record.longitude_candidate is None:
            continue
        point=(record.latitude_candidate,record.longitude_candidate)
        old=indexed.get(point)
        if not old:
            indexed[point]=(record.district.casefold(),[record.registration_id])
        elif old[0]!=record.district.casefold():
            unsafe.update(old[1]);unsafe.add(record.registration_id)
        else:
            old[1].append(record.registration_id)
    return unsafe
