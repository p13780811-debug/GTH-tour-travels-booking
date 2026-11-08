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

def fresh_oidc_token(fallback):
    """Refresh each upload batch using GitHub's trusted short-lived broker.
    Never send its credential outside the official Actions broker origin.
    """
    from urllib.parse import urlsplit
    from urllib.request import HTTPRedirectHandler, build_opener
    provider=os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL", "")
    credential=os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN", "")
    if not provider and not credential: return fallback
    parsed=urlsplit(provider)
    if (not provider or not credential or parsed.scheme!="https" or not parsed.hostname or
        not (parsed.hostname=="actions.githubusercontent.com" or parsed.hostname.endswith(".actions.githubusercontent.com")) or
        parsed.username or parsed.password or parsed.port not in (None,443)):
        raise ValueError("Invalid GitHub identity broker")
    class NoRedirect(HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None
    url=provider+("&" if parsed.query else "?")+urlencode({"audience":"gth-pro-tender-ingest:dqprqjmhxjnrllczqyhz"})
    request=Request(url,headers={"Authorization":"Bearer "+credential})
    try:
        with build_opener(NoRedirect).open(request,timeout=15) as response:
            data=response.read(16001)
            if len(data)>16000: raise ValueError("Invalid identity response")
            token=json.loads(data).get("value")
            if not isinstance(token,str) or not token or len(token)>6000: raise ValueError("Invalid identity response")
            return token
    except Exception:
        raise ValueError("Fresh GitHub identity unavailable; batch was not submitted") from None


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
                "Authorization": "Bearer " + fresh_oidc_token(oidc),
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
