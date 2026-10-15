#!/usr/bin/env python3
"""Official tender connectors: UK Contracts Finder and Ukrainian Prozorro.

Only documented public APIs, bounded requests, no CAPTCHA/session bypass, and
strict published notice links. Adapter is read-only; the existing ingestion
gateway owns approval, project auth and database writes.
"""
import re
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import open_ingestion as core
from import_tenders import convert

CF_API = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search"
UA_API = "https://public-api.prozorro.gov.ua/api/2.5/tenders"
CF_HOST = "www.contractsfinder.service.gov.uk"
UA_HOST = "public-api.prozorro.gov.ua"
NOTICE_UUID = re.compile(r"^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$")
UA_TENDER = re.compile(r"^UA-20\d\d-\d\d-\d\d-[0-9]{6}-[a-z]$", re.I)

def _date(value):
    return core._time(value, required=True)

def contracts_finder_notice(release):
    if not isinstance(release, dict) or not isinstance(release.get("tender"), dict):
        raise ValueError("Not a Contracts Finder tender")
    tender = release["tender"]
    if tender.get("status") in ("cancelled", "withdrawn", "complete"):
        raise ValueError("Not an open Contracts Finder tender")
    ref = core._text(release.get("id"))
    if not NOTICE_UUID.fullmatch(ref):
        raise ValueError("Contracts Finder has no official release UUID")
    buyer = release.get("buyer")
    buyer = buyer if isinstance(buyer, dict) else {}
    period = tender.get("tenderPeriod")
    period = period if isinstance(period, dict) else {}
    value = tender.get("value")
    value = value if isinstance(value, dict) else {}
    result = convert({
        "source_reference": ref.lower(),
        "source_url": "https://www.contractsfinder.service.gov.uk/Published/Notice/releases/" + ref + ".json",
        "title": core._text(tender.get("title")),
        "buyer": core._text(buyer.get("name")),
        "country_code": "GB",
        "sector": core._sector(tender.get("mainProcurementCategory")),
        "deadline_at": _date(period.get("endDate")),
        "published_at": core._time(release.get("date")),
        "summary": core._text(tender.get("description"))[:4000],
        "estimated_value": core._value(value.get("amount")),
        "currency": core._text(value.get("currency")),
    }, "UK Contracts Finder", {CF_HOST})
    return result

def fetch_contractsfinder(limit):
    start = (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(timespec="seconds")
    uri = CF_API + "?" + urlencode({
        "publishedFrom": start,
        "stages": "tender",
        "limit": min(limit, 40),
    })
    result = core._http_json(uri, allowed_host=CF_HOST)
    notices = result.get("releases")
    if not isinstance(notices, list):
        raise ValueError("Contracts Finder release package changed")
    return notices[:limit]

def ukraine_notice(item):
    if not isinstance(item, dict):
        raise ValueError("Invalid Prozorro tender")
    status = core._text(item.get("status"))
    if status not in ("active.tendering", "active.pre-qualification"):
        raise ValueError("Prozorro tender not accepting bids")
    ref = core._text(item.get("tenderID"))
    if not UA_TENDER.fullmatch(ref):
        raise ValueError("Missing canonical Prozorro tender ID")
    org = item.get("procuringEntity")
    org = org if isinstance(org, dict) else {}
    period = item.get("tenderPeriod")
    period = period if isinstance(period, dict) else {}
    budget = item.get("value")
    budget = budget if isinstance(budget, dict) else {}
    return convert({
        "source_reference": ref,
        "source_url": "https://prozorro.gov.ua/tender/" + ref,
        "title": core._text(item.get("title")),
        "buyer": core._text(org.get("name")),
        "country_code": "UA",
        "sector": core._sector(item.get("procurementMethodType")),
        "deadline_at": _date(period.get("endDate")),
        "published_at": core._time(item.get("dateCreated") or item.get("dateModified")),
        "estimated_value": core._value(budget.get("amount")),
        "currency": core._text(budget.get("currency")),
        "summary": core._text(item.get("description"))[:4000],
    }, "Ukraine Prozorro", {"prozorro.gov.ua"})

def fetch_ukraine(limit):
    # Public listing supplies IDs only. Resolve a small, bounded set using the
    # official detail API and only accept active tendering records.
    payload = core._http_json(UA_API + "?" + urlencode({"limit": min(limit, 12)}), allowed_host=UA_HOST)
    data = payload.get("data")
    if not isinstance(data, list):
        raise ValueError("Prozorro list response changed")
    notices = []
    for item in data[:min(limit, 12)]:
        if not isinstance(item, dict):
            continue
        ident = core._text(item.get("id"))
        if not NOTICE_UUID.fullmatch(ident):
            continue
        try:
            detail = core._http_json(UA_API + "/" + ident, allowed_host=UA_HOST)
            if not isinstance(detail.get("data"), dict):
                continue
            notices.append(detail["data"])
        except ValueError:
            continue  # one temporarily missing record must not discard feed
        time.sleep(0.25)
    return notices
