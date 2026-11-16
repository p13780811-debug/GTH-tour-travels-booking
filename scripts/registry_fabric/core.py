"""Normalized public registry facts; no sale inventory, owner identity or verification claims."""
from __future__ import annotations

import csv
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

MAX_FILE_BYTES = 30_000_000
MAX_ROWS = 100_000
MAX_RUN_RECORDS = 5000

PROVIDERS = {
    "maharera": {
        "state": "Maharashtra",
        "registration": re.compile(r"^P[0-9]{11}$"),
        "hosts": frozenset(("maharera.maharashtra.gov.in", "www.maharera.maharashtra.gov.in",
                            "maharerait.maharashtra.gov.in")),
        "reference_url": "https://maharera.maharashtra.gov.in/projects-search-result",
    },
    "wbrera": {
        "state": "West Bengal",
        "registration": re.compile(r"^WBRERA/P/[A-Z]{3}/[0-9]{4}/[0-9]{6}$"),
        "hosts": frozenset(("rera.wb.gov.in",)),
        "reference_url": "https://rera.wb.gov.in/",
    },
    "wbhira": {
        "state": "West Bengal",
        "registration": re.compile(r"^HIRA/P/[A-Z]{3}/[0-9]{4}/[0-9]{6}$"),
        "hosts": frozenset(("rera.wb.gov.in",)),
        "reference_url": "https://rera.wb.gov.in/",
    },
}

class RegistryValidationError(ValueError):
    """Untrusted or incompatible source data must not cross the publication boundary."""


@dataclass(frozen=True)
class RegistryProject:
    provider: str
    registration: str
    title: str
    developer: str | None
    district: str
    locality: str | None
    state: str
    country: str
    official_source_url: str
    source_status: str | None
    registry_only: bool = True
    verified: bool = False

    @property
    def identity(self) -> str:
        return self.provider + ":" + self.registration

    def public_dict(self) -> dict:
        return {"source_identity": self.identity, **asdict(self)}

    def maharera_insert(self) -> dict:
        if self.provider != "maharera":
            raise RegistryValidationError("Only MahaRERA has an approved existing properties writer")
        return {
            "title": self.title, "rera_id": self.registration,
            "developer": self.developer, "district": self.district,
            "location": self.locality, "state": self.state,
            # Existing writer accepts only official search URLs and remains insert-only.
            "official_source_url": PROVIDERS["maharera"]["reference_url"],
        }


def clean(value: object, maximum: int) -> str | None:
    if value is None or value == "":
        return None
    if not isinstance(value, str):
        raise RegistryValidationError("Unexpected non-text registry field")
    text = " ".join(value.split()).strip()
    if not text or len(text) > maximum or any(ord(c) < 32 for c in text):
        raise RegistryValidationError("Missing, oversized or unsafe registry field")
    return text


def official_url(provider: str, value: str | None) -> str:
    spec = PROVIDERS[provider]
    url = value or spec["reference_url"]
    if len(url) > 1000:
        raise RegistryValidationError("Registry source URL is oversized")
    p = urlsplit(url)
    if (p.scheme != "https" or p.hostname not in spec["hosts"] or p.username or p.password
            or p.port not in (None, 443) or p.fragment):
        raise RegistryValidationError("Registry source must be an allowlisted official HTTPS URL")
    for key, _ in parse_qsl(p.query, keep_blank_values=True):
        if key.lower() not in {"procode", "dcode"}:
            raise RegistryValidationError("Unapproved source query parameter")
    return url


def field(row: dict, *names: str):
    # Prefer explicit schema aliases, never positional columns or recursive JSON.
    normalized = {str(k).strip().lower().replace(" ", "_"): v for k, v in row.items()}
    found = [normalized[n] for n in names if n in normalized and normalized[n] not in (None, "")]
    if len({str(v).strip() for v in found}) > 1:
        raise RegistryValidationError("Conflicting source identity fields")
    return found[0] if found else None


def normalize(provider: str, row: dict) -> RegistryProject:
    if provider not in PROVIDERS or not isinstance(row, dict):
        raise RegistryValidationError("Unknown provider or invalid row")
    spec = PROVIDERS[provider]
    registration = clean(field(row, "rera_id", "registration_no", "registration_number",
                               "rera_number", "registration"), 100)
    if not registration or not spec["registration"].fullmatch(registration.upper()):
        raise RegistryValidationError("Registration format is unsupported for this authority")
    registration = registration.upper()
    title = clean(field(row, "project_name", "title", "name_of_project"), 180)
    district = clean(field(row, "district", "district_name"), 120)
    if not title or not district:
        raise RegistryValidationError("Project name and district must be source-backed")
    state = clean(field(row, "state"), 80)
    if state and state.casefold() != spec["state"].casefold():
        raise RegistryValidationError("Project state conflicts with selected authority")
    source_status = clean(field(row, "project_status", "status"), 100)
    if source_status and re.search(r"\b(revok(?:ed|ation)|reject(?:ed|ion)|cancelled)\b",
                                   source_status, re.IGNORECASE):
        raise RegistryValidationError("Revoked/rejected registration quarantined")
    # Kolkata district requires an explicitly matching registration district code.
    if provider in ("wbrera", "wbhira") and district.casefold() == "kolkata":
        if registration.split("/")[2] != "KOL":
            raise RegistryValidationError("Kolkata district conflicts with registration code")
    return RegistryProject(
        provider=provider, registration=registration, title=title,
        developer=clean(field(row, "developer_name", "developer", "promoter", "promoter_name"), 250),
        district=district,
        locality=clean(field(row, "project_address", "location", "locality"), 500),
        state=spec["state"], country="India",
        official_source_url=official_url(
            provider, clean(field(row, "official_source_url", "source_url"), 1000)
        ),
        source_status=source_status,
    )


def iter_source(path: Path):
    """Read approved local CSV/JSONL snapshots only. Never load arbitrary Python or ZIP."""
    if path.is_symlink() or not path.is_file() or not (0 < path.stat().st_size <= MAX_FILE_BYTES):
        raise RegistryValidationError("Input must be a nonempty regular file under 30 MB")
    if path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames or len(reader.fieldnames) > 100:
                raise RegistryValidationError("Invalid CSV header")
            for index, row in enumerate(reader, 1):
                if index > MAX_ROWS:
                    raise RegistryValidationError("Source row limit exceeded")
                if None in row:
                    raise RegistryValidationError("Malformed CSV column count")
                yield row
    elif path.suffix.lower() == ".jsonl":
        with path.open(encoding="utf-8") as handle:
            for index, line in enumerate(handle, 1):
                if index > MAX_ROWS:
                    raise RegistryValidationError("Source row limit exceeded")
                if len(line) > 20000:
                    raise RegistryValidationError("Oversized JSONL source row")
                try:
                    row = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise RegistryValidationError("Malformed JSONL source row") from exc
                if not isinstance(row, dict):
                    raise RegistryValidationError("JSONL row must be an object")
                yield row
    else:
        raise RegistryValidationError("Only CSV and JSONL snapshots are supported")


def validate_rows(provider: str, rows, *, offset=0, limit=100) -> tuple[list[RegistryProject], dict]:
    if not 0 <= offset <= MAX_ROWS or not 1 <= limit <= MAX_RUN_RECORDS:
        raise RegistryValidationError("Invalid bounded window")
    accepted: dict[str, RegistryProject] = {}
    report = {"scanned": 0, "accepted": 0, "duplicates": 0,
              "rejected": 0, "rejection_reasons": {}}
    for index, row in enumerate(rows):
        if index < offset:
            continue
        if index >= offset + limit:
            break
        report["scanned"] += 1
        try:
            item = normalize(provider, row)
            prior = accepted.get(item.identity)
            if prior:
                if prior.title.casefold() != item.title.casefold() or prior.district.casefold() != item.district.casefold():
                    raise RegistryValidationError("Conflicting duplicate project identity")
                report["duplicates"] += 1
                continue
            accepted[item.identity] = item
        except RegistryValidationError as exc:
            report["rejected"] += 1
            name = str(exc)
            report["rejection_reasons"][name] = report["rejection_reasons"].get(name, 0) + 1
    report["accepted"] = len(accepted)
    return list(accepted.values()), report
