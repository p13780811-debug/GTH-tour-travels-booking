"""Explicit table-header mapping; never infer field identity from column order."""

import re

ALIASES = {
    "title": {"project name", "name of project"},
    "rera_id": {"maharera registration number", "maharera registration no", "registration number", "registration no", "rera id"},
    "developer": {"promoter name", "name of promoter", "developer name"},
    "location": {"project location", "project address", "location"},
}


def parse_table(headers, rows):
    normalized = [re.sub(r"[^a-z0-9]+", " ", heading.lower()).strip() for heading in headers]
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
        result.append(record)
    return result
