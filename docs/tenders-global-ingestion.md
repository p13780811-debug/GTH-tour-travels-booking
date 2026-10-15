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
| UK Contracts Finder OCDS | additional_sources.py | none | [OGL / Contracts Finder API](https://www.contractsfinder.service.gov.uk/apidocumentation) |
| Ukraine Prozorro tenders | additional_sources.py | none | [Prozorro public data API](https://public-api.prozorro.gov.ua/api/0/doc) |
| CanadaBuys open notices CSV | additional_sources.py | none | [Canada Open Government Portal](https://open.canada.ca/data/en/dataset/6abd20d4-7a1c-4b38-baa2-9525d0bb2fd2) |


Do not claim these cover every country or every notice in those jurisdictions.
SAM.gov explicitly prohibits unauthorised scraping; only the official keyed API is supported.
UNGM needs OAuth access; it is NOT an anonymous feed. India CPPP and GeM
publish real procurement opportunities but there is no verified free anonymous
bulk ingestion endpoint and [CPPP terms](https://eprocure.gov.in/eprocure/app?page=Disclaimer&service=page)
require permission for reproduction; therefore we provide direct official
portal links and do not copy/republish notices without authorisation.
ADB award-history downloads are NOT current bid invitations.

CanadaBuys official open CSV includes notices hosted on outside procurement
platforms such as MERX. The government feed explicitly supplies those notice
links. The importer allows only the CanadaBuys official notice route and
a narrow, exact MERX solicitation route; no generic external hosts. The source
is government open data, but MERX is **not** a government-owned website.

Canada CSV closing datetimes omit an explicit timezone. Rather than falsely
present a potentially expired local-clock deadline, GTH PRO conservatively
treats the closing calendar day as ending at **00:00 UTC** for catalog display.
Bidder must confirm the actual Canadian regional closing time on the notice.


## No production modifications until verification

Safe (network API fetch, ZERO database writes):

    python -m unittest discover -s tests -p "test_open_tenders.py"
    python -m unittest discover -s tests -p "test_global_tenders.py"
    python -m unittest discover -s tests -p "test_additional_tenders.py"
    python scripts/tenders/global_ingestion.py --source all --limit 50

Live-fetch failure for a source is displayed as an error. A schema mismatch is not
replaced by sample data. If the free SAM key is absent, SAM is explicitly "skipped."

## Secretless official API ingestion (automated)
 
The existing six-hour GitHub Actions workflow is extended without giving GitHub
any Supabase database key. Its `id-token: write` permission obtains a short-lived
GitHub-signed OIDC JWT and sends validated notices to the Supabase Edge Function
`gth-tender-ingest`. The function validates:

- GitHub OIDC RS256 signature using GitHub's issuer JWKS, issuer and project-specific audience
- exact repository ID, repository name, `refs/heads/main` and **this exact workflow path**
- `schedule`, `workflow_dispatch` or the first approved workflow `push` run
- approved official hostname and notice-link path, title, buyer, ISO2 country,
  source reference, future UTC closing deadline and schema limits

Only then does Supabase use its **server-side** `SUPABASE_SERVICE_ROLE_KEY` to
insert verified-official-source records into the existing `public.tenders` table.
No browser, GitHub job or public API receives the key. `verify_jwt = false` on
this function is deliberate: it has strict, custom GitHub OIDC authentication;
never remove that authentication.

The default-branch workflow runs after merging the tender changes and every
6 hours thereafter, with GitHub scheduling best-effort. Dupes are ignored;
existing reviewed records are never overwritten. The notice is authenticated
as from a documented official feed, **not** eligibility-approved or legally
warranted. All applicants must confirm the latest official documents/deadline.

No repository variables, `SUPABASE_URL` GitHub secret or service-role key are
required by this OIDC path. `SAM_GOV_API_KEY` is **optional**, free-key only,
and without it the US connector is visibly skipped; not simulated.

The Edge Function must be deployed to the linked GTH PRO Supabase project before
the main-branch workflow runs. A successful dry-run/build is not proof that
production tender listings are visible: verify source rows, RLS and website
after the real OIDC-authorized run.

## Security and verification

- Run offline tests, the read-only live API smoke, Deno typecheck and the full
  production build on PR before merging.
- A compromised unrelated GitHub repository/branch/workflow cannot issue the
  exact trusted workload identity.
- Do not allow manually copied tenders or user-created content to claim official
  feed provenance. Tender assistant verification remains separate.
- Do not put identifiers of bidders or bid preparation drafts in tender listings.
- All public listings include authoritative source URL and unverified-eligibility
  disclaimer. No GTH PRO bid payment or formal submission occurs.
 
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
