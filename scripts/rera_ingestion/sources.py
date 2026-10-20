"""Authorized file inputs and discovery from public GET forms, never hidden portal APIs."""
from __future__ import annotations

import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup
from pydantic import ValidationError

from .models import (ALIASES, CLUSTERS, DISTRICTS, OFFICIAL_HOSTS, SEARCH_URL, IngestionError,
    Project, canonical_name, key, mapped_row, normalize, official_url)

MAX_INPUT_BYTES = 15_000_000


def read_file(path: Path) -> bytes:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_INPUT_BYTES:
        raise IngestionError("Input must be a regular file under 15 MB")
    return path.read_bytes()


def table_rows(html: bytes, source_url: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    result = []
    for table in soup.find_all("table"):
        headers = [th.get_text(" ", strip=True) for th in table.select("thead th")]
        if not headers:
            first = table.find("tr")
            headers = [th.get_text(" ", strip=True) for th in first.find_all("th", recursive=False)] if first else []
        names = {key(h) for h in headers}
        if not names.intersection(ALIASES["rera_id"] | {"rera id"}) or not names.intersection(ALIASES["project_name"]):
            continue
        for tr in table.find_all("tr"):
            cells = tr.find_all("td", recursive=False)
            if not cells:
                continue
            raw, _ = mapped_row(headers, [td.get_text(" ", strip=True) for td in cells])
            if not raw.get("rera_id"):
                continue
            links = []
            for a in tr.find_all("a", href=True):
                candidate = urljoin(source_url, a["href"])
                try:
                    official_url(candidate)
                except IngestionError:
                    continue
                if urlparse(candidate).path.rstrip("/") not in ("", "/projects-search-result"):
                    links.append(candidate)
            if len(set(links)) == 1:
                raw["source_url"] = links[0]
            result.append(raw)
    return result


def detail_fields(html: bytes) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    headers, values = [], []
    for dl in soup.find_all("dl"):
        for dt in dl.find_all("dt"):
            dd = dt.find_next_sibling("dd")
            if dd:
                headers.append(dt.get_text(" ", strip=True))
                values.append(dd.get_text(" ", strip=True))
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            cells = tr.find_all(["th", "td"], recursive=False)
            if len(cells) == 2:
                headers.append(cells[0].get_text(" ", strip=True).rstrip(":"))
                values.append(cells[1].get_text(" ", strip=True))
    raw, _ = mapped_row(headers, values)
    return raw


def verify_detail(project: Project, http) -> Project:
    # General search pages, even when filtered by ID, are never a verified detail certificate.
    if urlparse(project.source_url).path.rstrip("/") in ("", "/projects-search-result"):
        return project
    html, url = http.official(project.source_url, OFFICIAL_HOSTS)
    detail = detail_fields(html)
    if not {"rera_id", "project_name", "district"}.issubset(detail):
        raise IngestionError("Official detail structure is unsupported; identity was not verified")
    candidate = normalize(detail, url)
    if (candidate.rera_id != project.rera_id or canonical_name(candidate.project_name) != canonical_name(project.project_name)
            or candidate.district != project.district):
        raise IngestionError("Official detail and search/export identity do not match")
    # Only explicitly parsed detail fields may enrich the original source record.
    merged = project.model_dump()
    for field in ("developer_name", "locality", "cluster", "property_type", "unit_types", "min_carpet_sqft", "max_carpet_sqft", "possession_date", "latitude", "longitude"):
        value = getattr(candidate, field)
        if value not in (None, [], ""):
            merged[field] = value
    merged.update(source_url=url, verified_status=True, registry_evidence={
        "kind": "official_project_detail", "exact_detail_match": True, "source_url": url,
        "source_sha256": hashlib.sha256(html).hexdigest(), "matched_fields": ["rera_id", "project_name", "district"],
        "captured_at": datetime.now(timezone.utc).isoformat(), "scope": "registry_identity_only; not title, inventory, media or AI verification"})
    return Project.model_validate(merged)


def load_csv(path: Path, counters: dict) -> list[dict]:
    raw = read_file(path).decode("utf-8-sig")
    reader = csv.reader(io.StringIO(raw))
    try:
        headers = next(reader)
    except StopIteration:
        raise IngestionError("CSV input is empty") from None
    result = []
    for line, cells in enumerate(reader, 2):
        if line > 100_001:
            raise IngestionError("CSV row limit exceeded")
        try:
            row, sensitive = mapped_row(headers, cells)
            counters["sensitive_cells_discarded"] += sensitive
            result.append(row)
        except IngestionError:
            counters["malformed_rows"] += 1
    return result


class RegistryCollector:
    def __init__(self, http, max_pages=10):
        self.http, self.max_pages = http, max_pages

    @staticmethod
    def discover_form(html: bytes, base: str, district: str, cluster: str):
        soup = BeautifulSoup(html, "html.parser")
        candidates = []
        for form in soup.find_all("form"):
            district_select = form.find("select", attrs={"name": "project_district"}) or form.find("select", attrs={"name": "project_district[]"})
            if not district_select:
                continue
            if form.get("method", "get").casefold() != "get":
                raise IngestionError("Registry requires transient POST form state; use an authorized export")
            action = official_url(urljoin(base, form.get("action") or base))
            selected = next((opt.get("value") for opt in district_select.find_all("option") if key(opt.get_text(" ", strip=True)) == key(district)), None)
            if selected is None:
                raise IngestionError("District options are not publicly available in this form")
            params = []
            for el in form.find_all(["input", "select"]):
                name = el.get("name")
                if not name or el.get("type", "").casefold() in ("password", "file", "checkbox", "radio", "reset", "button", "submit"):
                    continue
                if any(word in name.casefold() for word in ("csrf", "token", "form_build_id", "viewstate")):
                    raise IngestionError("Registry form requires transient session state; use an authorized export")
                value = el.get("value", "")
                if el.name == "select":
                    default = el.find("option", selected=True) or el.find("option")
                    value = default.get("value", "") if default else ""
                if name == district_select["name"]:
                    value = selected
                elif name == "project_location":
                    value = cluster
                params.append((name, value))
            if not any(name == "project_location" for name, _ in params):
                raise IngestionError("Public registry form exposes no supported locality filter")
            submit = form.find("input", attrs={"type": "submit"})
            if submit and submit.get("name"):
                params.append((submit["name"], submit.get("value", "Search")))
            parsed = urlparse(action)
            candidates.append(urlunparse(parsed._replace(query=urlencode(params, doseq=True))))
        if len(candidates) != 1:
            raise IngestionError("No unique supported public GET registry form; use an authorized export")
        return candidates[0]

    def collect(self, clusters: tuple[str, ...]) -> list[dict]:
        landing, base = self.http.official(SEARCH_URL, OFFICIAL_HOSTS)
        result = []
        for cluster in clusters:
            district = DISTRICTS[0] if cluster in CLUSTERS[:3] else DISTRICTS[1]
            page_url = self.discover_form(landing, base, district, cluster)
            seen, fingerprints = set(), set()
            for page in range(self.max_pages):
                if page_url in seen:
                    raise IngestionError("Registry pagination loop detected")
                seen.add(page_url)
                html, current_url = self.http.official(page_url, OFFICIAL_HOSTS)
                rows = table_rows(html, current_url)
                if not rows:
                    raise IngestionError("Registry returned no supported project rows; use an authorized export")
                fingerprint = tuple(row.get("rera_id") for row in rows)
                if fingerprint in fingerprints:
                    raise IngestionError("Registry returned a repeated result page")
                fingerprints.add(fingerprint)
                for row in rows:
                    # Selected filters are not evidence of the returned row's district or locality.
                    row.setdefault("source_url", current_url)
                result.extend(rows)
                soup = BeautifulSoup(html, "html.parser")
                next_link = soup.find("a", rel=lambda value: value and "next" in value) or soup.select_one(".pager__item--next a[href]")
                if not next_link:
                    break
                page_url = official_url(urljoin(current_url, next_link.get("href", "")))
            else:
                raise IngestionError("Registry page budget reached; narrow the source selection")
        return result


def accepted_projects(rows: list[dict], clusters: tuple[str, ...], limit: int, counters: dict, allow_district_only=False) -> list[Project]:
    accepted = {}
    for raw in rows:
        try:
            p = normalize(raw)
            if not p.cluster and not allow_district_only:
                counters["unresolved_locality"] += 1
                continue
            if p.cluster and p.cluster not in clusters:
                counters["outside_clusters"] += 1
                continue
            if p.rera_id in accepted:
                # Conflicting duplicate identities are quarantined, not resolved by row order.
                prior = accepted[p.rera_id]
                if prior is None or (canonical_name(prior.project_name), prior.district) != (canonical_name(p.project_name), p.district):
                    accepted[p.rera_id] = None
                    counters["conflicting_duplicates"] += 1
                else:
                    counters["duplicate_rows"] += 1
                continue
            accepted[p.rera_id] = p
        except (IngestionError, ValidationError):
            counters["invalid_rows"] += 1
    ordered = sorted((p for p in accepted.values() if p), key=lambda p: (CLUSTERS.index(p.cluster) if p.cluster else 99, p.rera_id))
    counters["beyond_run_limit"] = max(0, len(ordered) - limit)
    return ordered[:limit]
