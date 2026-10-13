"""Explicit table-header mapping; never infer field identity from column order."""

import re

ALIASES = {
    "title": {"project name", "name of project"},
    "rera_id": {
        "maharera registration number",
        "maharera registration no",
        "registration number",
        "registration no",
        "rera id",
        "rera number",
        "rera no",
    },
    "developer": {"promoter name", "name of promoter", "developer name", "promoter"},
    "location": {"project location", "project address", "location"},
    "city": {"city"},
    "district": {"district"},
    "state": {"state"},
}

_NAVIGATION_MARKERS = {
    "skip to main content",
    "sitemap",
    "feedback",
    "faq",
    "faqs",
}


def _normalize(value):
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _looks_like_navigation(value):
    normalized = _normalize(value)
    return any(marker in normalized for marker in _NAVIGATION_MARKERS)


def parse_table(headers, rows):
    normalized = [_normalize(heading) for heading in headers]
    mapping = {}
    for field, aliases in ALIASES.items():
        matches = [index for index, heading in enumerate(normalized) if heading in aliases]
        if len(matches) > 1:
            raise ValueError("Ambiguous registry table header")
        if matches:
            mapping[field] = matches[0]
    if not {"title", "rera_id"}.issubset(mapping):
        raise ValueError("Registry table headers are unsupported; no import performed")
    result = []
    for cells in rows:
        if len(cells) != len(headers):
            raise ValueError("Registry table row does not match headers")
        record = {field: cells[index].strip() for field, index in mapping.items() if cells[index].strip()}
        if not record.get("title") or not re.fullmatch(r"P\d{11}", record.get("rera_id", "")):
            raise ValueError("Registry row is missing a valid project identity")
        if _looks_like_navigation(record["title"]) or _looks_like_navigation(record.get("developer", "")):
            raise ValueError("Registry row looks like portal navigation rather than a project")
        result.append(record)
    return result
