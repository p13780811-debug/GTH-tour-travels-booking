"""Privileged, source-locked tender publication transport.

Never import this in browser code. Only records validated against a documented
official HTTPS data source by global_ingestion may reach this method.
"""
import json
import os
import re
from urllib.parse import urlencode
from urllib.request import Request, urlopen

APPROVED_SOURCE_HOST = {
    "World Bank": "projects.worldbank.org",
    "TED EU": "ted.europa.eu",
    "UK Find a Tender": "www.find-tender.service.gov.uk",
    "UK Contracts Finder": "www.contractsfinder.service.gov.uk",
    "Ukraine Prozorro": "prozorro.gov.ua",
    "CanadaBuys Open Data": "canadabuys.canada.ca",
    "Brazil PNCP": "pncp.gov.br",
    "US SAM.gov": "sam.gov",
}

def submit_official(records, project_ref):
    from import_tenders import valid_source
    if os.environ.get("GTH_TENDER_INGESTION_ENABLED") != "true":
        raise ValueError("Tender importer has not been enabled")
    if os.environ.get("GTH_TENDER_OFFICIAL_PUBLICATION_ENABLED") != "true":
        raise ValueError("Official-feed publication has not been approved")
    if not re.fullmatch(r"[a-z0-9]{12,32}", project_ref):
        raise ValueError("Invalid Supabase project identifier")
    for record in records:
        host = APPROVED_SOURCE_HOST.get(record.get("source_name"))
        if not host or not record.get("source_reference"):
            raise ValueError("Not an approved official feed")
        approved_hosts = {host, "www.merx.com"} if record.get("source_name") == "CanadaBuys Open Data" else {host}
        valid_source(record.get("source_url"), approved_hosts)
        if record.get("status") != "published" or record.get("source_verified") is not True or record.get("is_public") is not True:
            raise ValueError("Publication flags failed validation")
        if any(field in record for field in ("owner_id", "bidder_profile", "pointOfContact")):
            raise ValueError("Private fields cannot be published")
    oidc = os.environ.get("GTH_TENDER_OIDC_TOKEN", "")
    if oidc:
        # Short-lived GitHub OIDC identity: service-role secret never leaves Supabase.
        # The Edge gateway validates GitHub signature, repository, main ref and workflow.
        endpoint = os.environ.get("GTH_TENDER_EDGE_URL", "")
        expected = f"https://{project_ref}.supabase.co/functions/v1/gth-tender-ingest"
        if endpoint != expected or project_ref != "dqprqjmhxjnrllczqyhz":
            raise ValueError("Unexpected Edge function target")
        for start in range(0, len(records), 50):
            chunk = records[start:start + 50]
            names = {r["source_name"] for r in chunk}
            if len(names) != 1:
                raise ValueError("Mixed source batch")
            payload = json.dumps({"source": chunk[0]["source_name"], "records": chunk}, separators=(",", ":")).encode()
            req = Request(endpoint, data=payload, method="POST", headers={
                "Authorization": "Bearer " + oidc,
                "Content-Type": "application/json",
            })
            with urlopen(req, timeout=30) as response:
                if response.status != 200:
                    raise ValueError("OIDC ingestion endpoint failed")
        return
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    secret = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_INGESTION_KEY")
    if url != f"https://{project_ref}.supabase.co" or not secret:
        raise ValueError("Wrong Supabase project or missing server-only secret")
    endpoint = url + "/rest/v1/tenders?" + urlencode({"on_conflict": "source_name,source_reference"})
    for index in range(0, len(records), 50):
        body = json.dumps(records[index:index + 50], separators=(",", ":")).encode()
        request = Request(endpoint, data=body, method="POST", headers={
            "apikey": secret, "Authorization": "Bearer " + secret,
            "Content-Type": "application/json",
            # Existing curated notices must not be overwritten by routine sync.
            "Prefer": "resolution=ignore-duplicates,return=minimal",
        })
        with urlopen(request, timeout=30) as result:
            if result.status not in (200, 201, 204):
                raise ValueError("Official-feed database insert failed")
