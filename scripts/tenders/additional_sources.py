#!/usr/bin/env python3
"""Official tender connectors: UK Contracts Finder and Ukrainian Prozorro.

Only documented public APIs, bounded requests, no CAPTCHA/session bypass, and
strict published notice links. Adapter is read-only; the existing ingestion
gateway owns approval, project auth and database writes.
"""
import csv
import io
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
    if not re.fullmatch(r"[0-9a-fA-F-]{36}-[0-9]{1,10}", ref):
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
    payload = core._http_json(UA_API + "?" + urlencode({"limit": min(limit, 20)}), allowed_host=UA_HOST)
    data = payload.get("data")
    if not isinstance(data, list):
        raise ValueError("Prozorro list response changed")
    notices = []
    for item in data[:min(limit, 20)]:
        if not isinstance(item, dict):
            continue
        ident = core._text(item.get("id"))
        if not (NOTICE_UUID.fullmatch(ident) or re.fullmatch(r"[a-fA-F0-9]{32}",ident)):
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


# Official CanadaBuys open data: the OPEN-notices file is updated each day.
# Third-party hosted notices embedded in the CSV are not automatically trusted:
# only directly issued CanadaBuys portal URLs enter the live marketplace.
CA_CSV = "https://canadabuys.canada.ca/opendata/pub/openTenderNotice-ouvertAvisAppelOffres.csv"
CA_HOST = "canadabuys.canada.ca"
CA_FIELDS = {
    "ref": "referenceNumber-numeroReference",
    "title": "title-titre-eng",
    "buyer": "contractingEntityName-nomEntitContractante-eng",
    "closing": "tenderClosingDate-appelOffresDateCloture",
    "published": "publicationDate-datePublication",
    "url": "noticeURL-URLavis-eng",
    "status": "tenderStatus-appelOffresStatut-eng",
    "category": "procurementCategory-categorieApprovisionnement",
    "description": "tenderDescription-descriptionAppelOffres-eng",
}
def canada_utc_date(raw, required=True):
    """Canada CSV omits zone. Use 00:00 UTC on the provided calendar date,
    excluding rather than falsely extending same-day local deadlines.
    """
    value=core._text(raw)
    if not value:
        if required: raise ValueError("Missing CanadaBuys closing date")
        return None
    if not re.match(r"^\d{4}-\d{2}-\d{2}",value):
        raise ValueError("Malformed CanadaBuys closing date")
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2})?",value):
        value=value[:10]+"T00:00:00+00:00"
    return core._time(value,required=required)

def canada_notice(row):
    from urllib.parse import urlsplit,urlunsplit
    if not isinstance(row,dict):
        raise ValueError("Invalid Canadian open data row")
    if core._text(row.get(CA_FIELDS["status"])).casefold() != "open":
        raise ValueError("Canadian tender is not open")
    raw_url=core._text(row.get(CA_FIELDS["url"]))
    try:
        url=urlsplit(raw_url)
    except ValueError as exc:
        raise ValueError("Malformed CanadaBuys official link") from exc
    allowed_portal = url.hostname==CA_HOST and bool(re.fullmatch(
        r"/en/tender-opportunities/tender-notice/[A-Za-z0-9._%-]{3,170}",url.path))
    # MERX is a tender delivery platform explicitly linked from Canada's
    # official OPEN-tender CSV. This is government-feed attribution, not a
    # claim that MERX is a government-owned website.
    allowed_merx = url.hostname=="www.merx.com" and bool(re.fullmatch(
        r"/public/solicitations/[0-9]{6,15}/abstract",url.path))
    if (url.scheme!="https" or url.username or url.password or
        url.port is not None or not (allowed_portal or allowed_merx)):
        raise ValueError("Canadian notice is on an external or unknown host")
    source_url=urlunsplit(("https", url.hostname, url.path, "", ""))
    return convert({
        "source_reference": core._text(row.get(CA_FIELDS["ref"])),
        "source_url": source_url,
        "title": core._text(row.get(CA_FIELDS["title"])),
        "buyer": core._text(row.get(CA_FIELDS["buyer"])),
        "country_code": "CA",
        "sector": core._sector(row.get(CA_FIELDS["category"])),
        "deadline_at": canada_utc_date(row.get(CA_FIELDS["closing"])),
        "published_at": canada_utc_date(row.get(CA_FIELDS["published"]),required=False),
        "summary": core._text(row.get(CA_FIELDS["description"]))[:4000],
        "estimated_value": "",
        "currency": "",
    }, "CanadaBuys Open Data", {CA_HOST,"www.merx.com"})

def fetch_canada(limit):
    """Bounded streaming CSV scan; skips external links and stops early.
    Does not crawl detail pages, save personal contact fields or cache full CSV.
    """
    from urllib.parse import urlsplit
    from urllib.request import Request,urlopen
    req=Request(CA_CSV,headers={"User-Agent":core.USER_AGENT,"Accept":"text/csv"})
    records=[]
    with urlopen(req,timeout=22) as response:
        final=urlsplit(response.geturl())
        if final.scheme!="https" or final.hostname!=CA_HOST:
            raise ValueError("CanadaBuys CSV redirected to an unknown host")
        decoded=io.TextIOWrapper(response,encoding="utf-8-sig",newline="")
        reader=csv.DictReader(decoded)
        if not reader.fieldnames or any(f not in reader.fieldnames for f in CA_FIELDS.values()):
            raise ValueError("CanadaBuys official CSV schema changed")
        # Only inspect a bounded number of rows, not the entire multi-MB archive.
        for index,row in enumerate(reader):
            if index>=2500 or len(records)>=min(limit,100):
                break
            if row.get(CA_FIELDS["status"],"").strip().lower()!="open":
                continue
            link=row.get(CA_FIELDS["url"],"")
            if not (link.startswith("https://"+CA_HOST+"/en/tender-opportunities/tender-notice/") or
                    link.startswith("https://www.merx.com/public/solicitations/")):
                continue
            records.append(row)
    return records
