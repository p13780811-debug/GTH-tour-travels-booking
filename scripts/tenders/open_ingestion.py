#!/usr/bin/env python3
"""GTH PRO: bounded key-free World Bank + TED procurement intake.

Fetches only documented official HTTPS APIs. Standard library only.
Dry-run by default. Private DB ingestion needs explicit credentials/flag.
Never invents deadlines, buyers or values; incomplete records are skipped.
"""
import argparse
import json
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from functools import lru_cache
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from import_tenders import convert, submit  # reuse audited normalization/DB gate

WORLD_BANK = "https://search.worldbank.org/api/v2/procnotices"
TED = "https://api.ted.europa.eu/v3/notices/search"
COUNTRIES = {
    "AUT": "AT", "BEL": "BE", "BGR": "BG", "HRV": "HR", "CYP": "CY",
    "CZE": "CZ", "DNK": "DK", "EST": "EE", "FIN": "FI", "FRA": "FR",
    "DEU": "DE", "GRC": "GR", "HUN": "HU", "IRL": "IE", "ITA": "IT",
    "LVA": "LV", "LTU": "LT", "LUX": "LU", "MLT": "MT", "NLD": "NL",
    "POL": "PL", "PRT": "PT", "ROU": "RO", "SVK": "SK", "SVN": "SI",
    "ESP": "ES", "SWE": "SE", "NOR": "NO", "ISL": "IS", "CHE": "CH",
    "GBR": "GB", "USA": "US", "IND": "IN", "UKR": "UA",
    "SRB": "RS", "TUR": "TR", "ALB": "AL", "MKD": "MK", "MNE": "ME",
    "BIH": "BA", "MDA": "MD", "GEO": "GE", "ARM": "AM", "AZE": "AZ",
}
TED_FIELDS = [
    "publication-number", "notice-title", "buyer-name", "buyer-country",
    "publication-date", "deadline-receipt-tender-date-lot",
    "contract-nature", "total-value", "total-value-cur",
]
OFFICIAL = {
    "worldbank": ("World Bank", {"projects.worldbank.org"}),
    "ted": ("TED EU", {"ted.europa.eu"}),
}
USER_AGENT = "GTHPRO-Official-Procurement-Data/1.0 (+https://www.gthproglobal.com/contact)"

def _http_json(url, *, payload=None, allowed_host, attempts=3):
    if urlsplit(url).scheme != "https" or urlsplit(url).hostname != allowed_host:
        raise ValueError("Source URL is not an approved HTTPS API")
    body = json.dumps(payload, separators=(",", ":")).encode() if payload is not None else None
    req = Request(url, data=body, method="POST" if body else "GET", headers={
        "Accept": "application/json", "User-Agent": USER_AGENT,
        **({"Content-Type": "application/json"} if body else {}),
    })
    for attempt in range(attempts):
        try:
            with urlopen(req, timeout=18) as response:
                final_url = urlsplit(response.geturl())
                if final_url.scheme != "https" or final_url.hostname != allowed_host:
                    raise ValueError("Unexpected external redirect")
                data = response.read(2_000_001)
                if len(data) > 2_000_000:
                    raise ValueError("Official API exceeded response size limit")
                result = json.loads(data)
                if not isinstance(result, dict):
                    raise ValueError("Unexpected official API response envelope")
                return result
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == attempts - 1:
                raise ValueError("Official API rejected request (HTTP " + str(exc.code) + ")") from exc
        except (URLError, TimeoutError) as exc:
            if attempt == attempts - 1:
                raise ValueError("Official API temporarily unreachable") from exc
        time.sleep(min(3 * (attempt + 1), 9))
    raise ValueError("Source temporarily unavailable")

def _text(value):
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return next((x for i in value if (x := _text(i))), "")
    if isinstance(value, dict):
        for key in ("eng", "en", "ENG", "EN", "value", "text"):
            if key in value and (text := _text(value[key])):
                return text
        return next((x for v in value.values() if (x := _text(v))), "")
    return ""

def _time(value, *, required=False):
    # A date without time is interpreted conservatively at 00:00 UTC:
    # we will stop displaying it too early rather than show an expired bid.
    raw = _text(value)
    if not raw:
        if required:
            raise ValueError("Official notice has no deadline")
        return None
    if re.fullmatch(r"\d{8}", raw):
        raw = raw[:4] + "-" + raw[4:6] + "-" + raw[6:]
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        raw += "T00:00:00+00:00"
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        date = datetime.fromisoformat(raw)
        if date.tzinfo is None:
            raise ValueError("Datetime lacks timezone")
        return date.astimezone(timezone.utc).isoformat()
    except ValueError as exc:
        raise ValueError("Invalid official deadline/date") from exc

def _country(value):
    val = _text(value).upper()
    if re.fullmatch(r"[A-Z]{2}", val):
        return val
    if val in COUNTRIES:
        return COUNTRIES[val]
    # No broad guesses for buyer-country ISO3 or a region/multinational notice.
    raise ValueError("Official notice country is not a supported ISO country")

def _value(value):
    val = _text(value)
    if not val:
        return ""
    try:
        number = Decimal(val.replace(",", ""))
        if number.is_finite() and Decimal("0") <= number < Decimal("10000000000000000"):
            return str(number.quantize(Decimal(".01")))
    except InvalidOperation:
        pass
    return ""

def _sector(value):
    val = _text(value).lower()
    if any(x in val for x in ("work", "construction")):
        return "works"
    if any(x in val for x in ("good", "suppl", "equipment")):
        return "goods"
    if any(x in val for x in ("consult", "advisory")):
        return "consultancy"
    if "service" in val:
        return "services"
    return "other"

def _normalized(raw, source, host):
    label, permitted = OFFICIAL[source]
    converted = convert(raw, label, permitted)
    # Require the actual source domain and canonical link pattern.
    if urlsplit(converted["source_url"]).hostname != host:
        raise ValueError("Source link is not the expected official portal")
    return converted


@lru_cache(maxsize=1)
def _worldbank_countries():
    """Resolve published country NAMES through World Bank's own official ISO2 feed."""
    url = "https://api.worldbank.org/v2/country?format=json&per_page=400"
    req = Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
    with urlopen(req, timeout=18) as res:
        final = urlsplit(res.geturl())
        if final.scheme != "https" or final.hostname != "api.worldbank.org":
            raise ValueError("World Bank country list redirect rejected")
        payload = res.read(500_001)
        if len(payload) > 500_000:
            raise ValueError("World Bank country metadata too large")
    result = json.loads(payload)
    if not isinstance(result, list) or len(result) < 2 or not isinstance(result[1], list):
        raise ValueError("World Bank country directory format changed")
    mapping = {}
    for item in result[1]:
        if not isinstance(item, dict):
            continue
        name, iso = item.get("name"), item.get("iso2Code")
        if isinstance(name, str) and isinstance(iso, str) and re.fullmatch(r"[A-Z]{2}", iso):
            mapping[name.strip().casefold()] = iso
    return mapping

def _worldbank_country(item):
    code = item.get("country_code") or item.get("countrycode")
    if code:
        return _country(code)
    name = _text(item.get("project_ctry_name"))
    if not name:
        raise ValueError("World Bank record has no project country")
    resolved = _worldbank_countries().get(name.casefold())
    if not resolved:
        raise ValueError("World Bank country not mapped to official ISO2")
    return resolved

def _ted_timezone_date(raw):
    """TED date-only values often append a UTC offset with no clock time."""
    value = _text(raw)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}[+-]\d{2}:\d{2}", value):
        value = value[:10] + "T00:00:00" + value[10:]
    return _time(value, required=True)

def _ted_earliest_deadline(item):
    raw = item.get("deadline") or item.get("deadline-receipt-tender-date-lot")
    vals = raw if isinstance(raw, list) else [raw]
    parsed = [_ted_timezone_date(v) for v in vals if _text(v)]
    if not parsed:
        raise ValueError("TED notice has no tender submission deadline")
    # Prefer earliest lot closing to avoid promising a later deadline for all lots.
    return min(parsed)

def _worldbank_notice(item):
    ref = _text(item.get("id") or item.get("notice_id") or item.get("noticeid"))
    if not re.fullmatch(r"(?:OP)?[0-9]{4,15}", ref):
        raise ValueError("World Bank notice has no canonical identifier")
    if not ref.startswith("OP"):
        ref = "OP" + ref.zfill(8)
    title = _text(item.get("bid_description") or item.get("notice_title") or item.get("description"))
    buyer = _text(item.get("implementing_agency") or item.get("contact_organization") or item.get("agency_name") or item.get("buyer"))
    deadline = _time(item.get("submission_deadline_date") or item.get("deadline_date") or item.get("closing_date"), required=True)
    url = "https://projects.worldbank.org/en/projects-operations/procurement-detail/" + ref
    return _normalized({
        "source_reference": ref, "source_url": url,
        "title": title, "buyer": buyer,
        "country_code": _worldbank_country(item),
        "sector": _sector(item.get("procurement_category") or item.get("notice_type")),
        "deadline_at": deadline,
        "published_at": _time(item.get("publication_date") or item.get("submission_date")),
        "estimated_value": "", "currency": "",
        "summary": _text(item.get("project_name"))[:4000],
    }, "worldbank", "projects.worldbank.org")

def _ted_notice(item):
    ref = _text(item.get("publication-number"))
    if not re.fullmatch(r"\d{1,8}-20\d{2}", ref):
        raise ValueError("TED publication number missing or malformed")
    buyer = _text(item.get("buyer-name"))
    title = _text(item.get("notice-title"))
    deadline = _ted_earliest_deadline(item)
    currency = _text(item.get("total-value-cur")).upper()
    if currency and not re.fullmatch(r"[A-Z]{3}", currency):
        currency = ""
    return _normalized({
        "source_reference": ref,
        "source_url": "https://ted.europa.eu/en/notice/-/detail/" + ref,
        "title": title, "buyer": buyer,
        "country_code": _country(item.get("buyer-country")),
        "sector": _sector(item.get("contract-nature")),
        "deadline_at": deadline,
        "published_at": _ted_timezone_date(item.get("publication-date")) if _text(item.get("publication-date")) else None,
        "estimated_value": _value(item.get("total-value")),
        "currency": currency,
    }, "ted", "ted.europa.eu")

def fetch_worldbank(limit):
    url = WORLD_BANK + "?" + urlencode({
        "format": "json", "rows": min(limit, 100), "os": 0,
        "srt": "noticedate desc,id asc",
    })
    result = _http_json(url, allowed_host="search.worldbank.org")
    notices = result.get("procnotices")
    if isinstance(notices, dict):
        notices = list(notices.values())
    if not isinstance(notices, list):
        raise ValueError("World Bank response schema changed")
    return notices[:limit]

def fetch_ted(limit):
    since = (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y%m%d")
    result = _http_json(TED, allowed_host="api.ted.europa.eu", payload={
        "query": "PD>=" + since + " SORT BY publication-date DESC",
        "fields": TED_FIELDS, "page": 1, "limit": min(limit, 100),
        "scope": "ACTIVE", "paginationMode": "PAGE_NUMBER",
    })
    notices = result.get("notices")
    if not isinstance(notices, list):
        raise ValueError("TED response schema changed")
    return notices[:limit]

def collect(source, limit):
    if source not in ("ted", "worldbank"):
        raise ValueError("Unsupported tender source")
    records = fetch_ted(limit) if source == "ted" else fetch_worldbank(limit)
    normalize = _ted_notice if source == "ted" else _worldbank_notice
    accepted, rejected, seen = [], [], set()
    for item in records:
        try:
            if not isinstance(item, dict):
                raise ValueError("Invalid notice object")
            record = normalize(item)
            if datetime.fromisoformat(record["deadline_at"]) <= datetime.now(timezone.utc):
                raise ValueError("Expired deadline")
            ref = record["source_reference"]
            if ref in seen:
                raise ValueError("Duplicate source reference")
            seen.add(ref)
            accepted.append(record)
        except (ValueError, TypeError, OverflowError) as exc:
            rejected.append(str(exc))
    return accepted, rejected

def main(argv=None):
    parser = argparse.ArgumentParser(description="GTH PRO official-source tender ingestion")
    parser.add_argument("--source", choices=["worldbank", "ted", "all"], default="all")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--commit", action="store_true", help="Write newly discovered notices to private review queue")
    parser.add_argument("--expected-project-ref", default="")
    args = parser.parse_args(argv)
    if args.limit < 1 or args.limit > 100:
        parser.error("Limit must be 1..100 per source")
    if args.commit and not args.expected_project_ref:
        parser.error("--expected-project-ref required for --commit")
    sources = ("worldbank", "ted") if args.source == "all" else (args.source,)
    stats = {"mode": "private_review" if args.commit else "dry_run",
             "sources": {}, "total_accepted": 0, "total_rejected": 0,
             "published": 0}
    failed = False
    for source in sources:
        try:
            accepted, rejected = collect(source, args.limit)
            if args.commit and accepted:
                submit(accepted, args.expected_project_ref)
            stats["sources"][source] = {
                "accepted": len(accepted), "rejected": len(rejected),
                "sample_rejections": rejected[:5],
            }
            stats["total_accepted"] += len(accepted)
            stats["total_rejected"] += len(rejected)
        except (ValueError, OSError) as exc:
            stats["sources"][source] = {"error": str(exc)}
            failed = True
        if len(sources) > 1:
            time.sleep(1.3)
    print(json.dumps(stats))
    return 1 if failed else 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError) as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)
