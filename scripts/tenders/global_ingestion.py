#!/usr/bin/env python3
"""GTH PRO official procurement ingestion: extend the EXISTING World Bank/TED engine.

Sources: World Bank, TED EU, UK Find a Tender OCDS, Brazil PNCP, optional US SAM.gov.
Only documented public read APIs. No scraped pages, CAPTCHA bypass or paid API.
Dry-run is default; private review and source-authenticated publication are opt-in.
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import open_ingestion as core
from import_tenders import convert, submit
from official_publication import submit_official

UK_API = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages"
BR_API = "https://pncp.gov.br/api/consulta/v1/contratacoes/proposta"
US_API = "https://api.sam.gov/opportunities/v2/search"
SOURCES = ("worldbank", "ted", "uk", "brazil", "sam")
PUBLIC_SOURCES = frozenset(SOURCES)
SOURCE_CONFIG = {
    "uk": ("UK Find a Tender", "www.find-tender.service.gov.uk", "www.find-tender.service.gov.uk"),
    "brazil": ("Brazil PNCP", "pncp.gov.br", "pncp.gov.br"),
    "sam": ("US SAM.gov", "sam.gov", "sam.gov"),
}

def _clean_text(value):
    if isinstance(value, str):
        return value.strip()
    return ""

def _timestamp(value, country=""):
    """Reject unknown timestamps instead of inventing deadlines.

    Brazilian PNCP naive local datetimes are defined in Brazilian civil time.
    Use Sao Paulo only as a conservative site-wide convention; the user must
    confirm regional deadlines at the original portal before applying.
    Date-only deadlines close at the start of that day, to avoid overclaiming.
    """
    raw = _clean_text(value)
    if not raw:
        raise ValueError("Missing official tender deadline")
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        raw += "T00:00:00+00:00" if country != "BR" else "T00:00:00"
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            if country != "BR":
                raise ValueError("Tender deadline lacks time zone")
            dt = dt.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))
        return dt.astimezone(timezone.utc).isoformat()
    except ValueError as exc:
        raise ValueError("Invalid tender deadline") from exc

def _normal(raw, source):
    name, host, link_host = SOURCE_CONFIG[source]
    item = convert(raw, name, {host, link_host})
    if item["source_url"].split("/")[2].lower() != link_host:
        raise ValueError("Unexpected official tender link")
    return item

def normalize_uk(release):
    if not isinstance(release, dict):
        raise ValueError("Invalid UK OCDS release")
    tender = release.get("tender")
    if not isinstance(tender, dict):
        raise ValueError("UK release contains no tender")
    if tender.get("status") in ("cancelled", "withdrawn", "complete"):
        raise ValueError("UK tender is no longer open")
    release_id = _clean_text(release.get("id"))
    # A published notice ID, not an OCID (which identifies a procurement).
    if not re.fullmatch(r"\d{6}-20\d{2}", release_id):
        raise ValueError("UK release has no canonical notice number")
    buyer = release.get("buyer") or {}
    if not isinstance(buyer, dict):
        buyer = {}
    period = tender.get("tenderPeriod") or {}
    if not isinstance(period, dict):
        period = {}
    return _normal({
        "source_reference": release_id,
        "source_url": "https://www.find-tender.service.gov.uk/Notice/" + release_id,
        "title": _clean_text(tender.get("title")),
        "buyer": _clean_text(buyer.get("name")),
        "country_code": "GB",
        "sector": core._sector(tender.get("mainProcurementCategory")),
        "summary": _clean_text(tender.get("description"))[:4000],
        "deadline_at": _timestamp(period.get("endDate")),
        "published_at": core._time(release.get("date")),
        "estimated_value": core._value((tender.get("value") or {}).get("amount") if isinstance(tender.get("value"), dict) else None),
        "currency": _clean_text((tender.get("value") or {}).get("currency")) if isinstance(tender.get("value"), dict) else "",
    }, "uk")

def normalize_brazil(item):
    if not isinstance(item, dict):
        raise ValueError("Invalid Brazil PNCP item")
    ref = _clean_text(item.get("numeroControlePNCP"))
    entity = item.get("orgaoEntidade") or {}
    if not isinstance(entity, dict):
        entity = {}
    cnpj = _clean_text(entity.get("cnpj"))
    ano = item.get("anoCompra")
    seq = item.get("sequencialCompra")
    if not re.fullmatch(r"\d{14}", cnpj) or not str(ano).isdigit() or not str(seq).isdigit():
        raise ValueError("Brazil notice cannot be linked to an official PNCP record")
    if not re.fullmatch(r"[A-Za-z0-9/-]{8,80}", ref):
        raise ValueError("Brazil PNCP reference missing")
    return _normal({
        "source_reference": ref.replace("-", "_"),  # converter's existing punctuation allowlist
        "source_url": "https://pncp.gov.br/app/editais/" + cnpj + "/" + str(ano) + "/" + str(seq),
        "title": _clean_text(item.get("objetoCompra")),
        "buyer": _clean_text(entity.get("razaoSocial")),
        "country_code": "BR",
        "sector": "other",  # PNCP modality is not equivalent to works/goods/services
        "summary": _clean_text(item.get("modalidadeNome"))[:4000],
        "deadline_at": _timestamp(item.get("dataEncerramentoProposta"), "BR"),
        "published_at": core._time(item.get("dataPublicacaoPncp")),
        "estimated_value": core._value(str(item.get("valorTotalEstimado") or "")),
        "currency": "BRL" if item.get("valorTotalEstimado") is not None else "",
    }, "brazil")

def normalize_sam(item):
    if not isinstance(item, dict):
        raise ValueError("Invalid SAM opportunity")
    ref = _clean_text(item.get("noticeId"))
    if not re.fullmatch(r"[0-9a-fA-F]{32}", ref):
        raise ValueError("Invalid official SAM opportunity ID")
    if item.get("active") not in ("Yes", True):
        raise ValueError("Not an active SAM opportunity")
    notice_type = _clean_text(item.get("type")).lower()
    if any(word in notice_type for word in ("award", "justification", "sources sought")):
        raise ValueError("Non-solicitation SAM announcement")
    buyer = _clean_text(item.get("fullParentPathName") or item.get("department") or item.get("subTier"))
    posted = _clean_text(item.get("postedDate")).split(" ")[0]
    return _normal({
        "source_reference": ref,
        "source_url": "https://sam.gov/opp/" + ref + "/view",
        "title": _clean_text(item.get("title")),
        "buyer": buyer[:180],
        "country_code": "US",
        "sector": "other",
        "summary": _clean_text(item.get("solicitationNumber")),
        "deadline_at": _timestamp(item.get("responseDeadLine") or item.get("reponseDeadLine")),
        "published_at": core._time(posted),
        "estimated_value": "",
        "currency": "",
    }, "sam")

def fetch_uk(limit):
    since = (datetime.now(timezone.utc) - timedelta(days=8)).strftime("%Y-%m-%dT%H:%M:%S")
    url = UK_API + "?" + urlencode({"updatedFrom": since, "stages": "tender", "limit": limit})
    payload = core._http_json(url, allowed_host="www.find-tender.service.gov.uk")
    items = payload.get("releases")
    if not isinstance(items, list):
        raise ValueError("UK OCDS schema changed")
    return items[:limit]

def fetch_brazil(limit):
    until = (date.today() + timedelta(days=60)).strftime("%Y%m%d")
    url = BR_API + "?" + urlencode({"dataFinal": until, "pagina": 1, "tamanhoPagina": max(limit, 10)})
    payload = core._http_json(url, allowed_host="pncp.gov.br")
    rows = payload.get("data")
    if not isinstance(rows, list):
        raise ValueError("Brazil PNCP schema changed")
    return rows[:limit]

def fetch_sam(limit):
    key = os.environ.get("SAM_GOV_API_KEY", "").strip()
    if not key:
        return None  # free registration key absent: do not simulate USA results
    now = datetime.now(timezone.utc)
    args = {"api_key": key, "postedFrom": (now - timedelta(days=7)).strftime("%m/%d/%Y"),
            "postedTo": now.strftime("%m/%d/%Y"), "ptype": "o", "limit": limit, "offset": 0}
    # URL with key is NEVER logged. The shared HTTP client emits generic errors only.
    payload = core._http_json(US_API + "?" + urlencode(args), allowed_host="api.sam.gov")
    rows = payload.get("opportunitiesData")
    if not isinstance(rows, list):
        raise ValueError("SAM.gov API schema changed")
    return rows[:limit]

def collect(source, limit):
    if source in ("worldbank", "ted"):
        return core.collect(source, limit)
    fetchers = {"uk": (fetch_uk, normalize_uk), "brazil": (fetch_brazil, normalize_brazil),
                "sam": (fetch_sam, normalize_sam)}
    fetch, normalize = fetchers[source]
    rows = fetch(limit)
    if rows is None:
        return None, ["SAM_GOV_API_KEY not configured"]
    accepted, rejected, seen = [], [], set()
    for row in rows:
        try:
            record = normalize(row)
            if datetime.fromisoformat(record["deadline_at"]) <= datetime.now(timezone.utc):
                raise ValueError("Expired deadline")
            reference = record["source_reference"]
            if reference in seen:
                raise ValueError("Duplicate source notice")
            seen.add(reference)
            accepted.append(record)
        except (ValueError, TypeError, OverflowError) as exc:
            rejected.append(str(exc))
    return accepted, rejected

def publish_official(records, project_ref):
    """Only user-opted-in official API notices may be published automatically.

    Verification here is *official API provenance*, not manual legal/eligibility
    verification. Each notice links to an issuing authority and must be checked
    there before placing a bid.
    """
    if os.environ.get("GTH_TENDER_OFFICIAL_PUBLICATION_ENABLED") != "true":
        raise ValueError("Official publication has not been enabled")
    if any(row["source_name"] not in
           {"World Bank", "TED EU", "UK Find a Tender", "Brazil PNCP", "US SAM.gov"}
           for row in records):
        raise ValueError("Unapproved public source")
    # Apply the independent server-only project/host gate in official_publication.
    approved = [{**row, "source_verified": True, "is_public": True, "status": "published"}
                for row in records]
    # Existing CSV importer stays review-only; publish only verified official feed rows.
    submit_official(approved, project_ref)

def main(argv=None):
    p = argparse.ArgumentParser(description="Global official procurement data importer")
    p.add_argument("--source", choices=(*SOURCES, "all"), default="all")
    p.add_argument("--limit", type=int, default=100)
    p.add_argument("--commit", action="store_true")
    p.add_argument("--publish-official", action="store_true",
                   help="Explicitly approve publishing notices sourced from official APIs")
    p.add_argument("--expected-project-ref", default="")
    args = p.parse_args(argv)
    if not 1 <= args.limit <= 100:
        p.error("--limit must be 1..100 per source")
    if args.commit and not args.expected_project_ref:
        p.error("--commit requires --expected-project-ref")
    if args.publish_official and not args.commit:
        p.error("--publish-official requires --commit")
    names = SOURCES if args.source == "all" else (args.source,)
    stats = {"mode": "official_published" if args.publish_official else ("private_review" if args.commit else "dry_run"),
             "sources": {}, "accepted": 0, "rejected": 0, "submitted_for_publication": 0}
    failures = 0
    for source in names:
        try:
            records, rejected = collect(source, args.limit)
            if records is None:
                stats["sources"][source] = {"skipped": "Free SAM.gov API key not configured"}
                continue
            if args.commit and records:
                if args.publish_official:
                    publish_official(records, args.expected_project_ref)
                    stats["submitted_for_publication"] += len(records)  # includes ignored duplicates
                else:
                    submit(records, args.expected_project_ref)
            stats["sources"][source] = {"accepted": len(records),
                                         "rejected": len(rejected),
                                         "sample_rejections": rejected[:5]}
            stats["accepted"] += len(records)
            stats["rejected"] += len(rejected)
        except (ValueError, OSError) as exc:
            failures += 1
            stats["sources"][source] = {"error": str(exc)}
        if len(names) > 1:
            time.sleep(0.5)
    print(json.dumps(stats, sort_keys=True))
    return 1 if failures else 0

if __name__ == "__main__":
    sys.exit(main())
