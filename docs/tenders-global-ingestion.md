# GTH PRO Global Open Tender Intake — 15 October 2026

This extends (does not replace) the existing /tender marketplace, source-provenance gate,
private bid workspaces, catalog schema and six-hour GitHub Actions job.

## Connected official data interfaces

| Source | Reader | Authentication | Licensing / source |
| --- | --- | --- | --- |
| World Bank procurement notices | existing open_ingestion.py | none | [CC BY 4.0](https://datacatalog.worldbank.org/search/dataset/0037795/world-bank-procurement-notices) |
| EU TED Search API | existing open_ingestion.py | none | [EU notice reuse terms](https://ted.europa.eu/en/legal-notice) |
| UK Find a Tender OCDS | global_ingestion.py | none for public OCDS | [OGL / public data API](https://www.find-tender.service.gov.uk/Developer/Documentation) |
| Brazil PNCP /v1/contratacoes/proposta | global_ingestion.py | none | [Official portal API](https://pncp.gov.br/api/consulta/swagger-ui/index.html) |
| US SAM.gov public opportunities | global_ingestion.py | **free account API key** | [Official API + terms](https://open.gsa.gov/api/get-opportunities-public-api/) |

Do not claim these cover every country or every notice in those jurisdictions.
SAM.gov explicitly prohibits unauthorised scraping; only the official keyed API is supported.
UNGM needs OAuth access; it is NOT an anonymous feed. GeM/CPPP/ADB are not enabled
without confirmed machine-readable access and applicable licences.

## No production modifications until verification

Safe (network API fetch, ZERO database writes):

    python -m unittest discover -s tests -p "test_open_tenders.py"
    python -m unittest discover -s tests -p "test_global_tenders.py"
    python scripts/tenders/global_ingestion.py --source all --limit 50

Live-fetch failure for a source is displayed as an error. A schema mismatch is not
replaced by sample data. If the free SAM key is absent, SAM is explicitly "skipped."

## Private intake

The existing repository GitHub Action (.github/workflows/tenders-sync.yml) runs every six
hours UTC on the **default branch** after merge. GitHub scheduler timings are approximate.
Set GitHub Actions repository secrets directly in the GitHub UI (NEVER share in chat):

    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    SAM_GOV_API_KEY       # OPTIONAL; free key from SAM.gov account

And repository variables:

    GTH_SUPABASE_PROJECT_REF    # must match the actual Vercel app Supabase ref
    GTH_TENDER_INGESTION_ENABLED = true

This imports to private review only (default). Existing published/curated notices
are not overwritten on conflict.

## Official-feed publication (additional explicit approval)

If and ONLY if both database intake is enabled and the operator approves publishing
the original notices retrieved from fixed, documented official APIs, set:

    GTH_TENDER_OFFICIAL_PUBLICATION_ENABLED = true

Then the scheduler validates required title, buyer, canonical notice identifier,
source portal host, ISO country, deadline and future date, and writes source-provenance
approved notices to the existing published catalog. This is machine-provenance
verification, NOT a legal review of eligibility, time zones, amendments or attachments.
A user must confirm the official portal's instructions before bidding.

The frontend reads only current, published, source-provenance-approved rows by RLS.
The default empty database is not evidence of live ingestion. Verify the scheduled
GitHub run and Supabase rows before claiming the public site has data.

## Known technical constraints

- Existing World Bank and TED parsers are preserved. Both need HTTP/live fixture testing.
- One page per source, capped at 100 per six-hour run. Coverage is limited; do not
  advertise exhaustive historical or worldwide tender coverage.
- Imported duplicate source references are ignored to protect previous review work;
  amendments and corrected deadlines require a separate controlled update workflow.
- Brazil PNCP local date-time without offset uses America/Sao_Paulo for conservative
  display; always consult the official closing deadline. Date-only deadlines close at
  midnight UTC to avoid offering notices that may already have expired.
- GitHub Actions and Supabase free plans have quotas; zero PAID API cost is not
  equivalent to guaranteed zero operational cost.
- No fake notices, no bid submission, no password or service-role key in frontend.
