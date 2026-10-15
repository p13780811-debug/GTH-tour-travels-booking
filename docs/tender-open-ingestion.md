# GTH PRO — Official open procurement ingestion (Phase 1)

No paid data API, no fabricated tenders, no CSS changes, no automatic public publication.

## Existing integration, not a duplicate table

Reuse public.tenders (existing repo migration
supabase/migrations/20261013224500_tender_catalog_v1.sql) and tender ingestion
audit; do NOT create another tenders_catalog table. The already-built
src/lib/tender/catalog.ts and /tender page expect that exact schema.
Also apply the additive tender workspace schema
supabase/migrations/20261013232000_tender_ai_assistant_v1.sql so the
API's eligibility columns exist. Confirm the Supabase project before applying.

## Sources and scope

World Bank Procurement Notices API:
https://search.worldbank.org/api/v2/procnotices
Catalog: https://datacatalog.worldbank.org/search/dataset/0037795/world-bank-procurement-notices
This is a public World Bank-financed procurement dataset, not every tender worldwide.

EU TED published notice search:
https://api.ted.europa.eu/v3/notices/search
Docs: https://docs.ted.europa.eu/api/latest/search.html
This anonymous public interface covers notices published on TED.

Unknown buyer identity, country, date/time, title or notice reference -> reject.
We do NOT infer missing values, use projects as buyers or invent award amounts.
The official source link is always included. Date-only deadline values are
interpreted conservatively as midnight UTC to avoid incorrectly claiming an
already-closed tender is active. Confirm the exact time on the source.

No invented APIs for GeM, CPPP, UNGM, ADB or SAM.gov: research their actual
terms, feeds, credentials and formats before adding them.

## Offline tests and bounded dry run

python -m unittest discover -s tests -p "test_open_tenders.py"
python scripts/tenders/open_ingestion.py --source worldbank --limit 25
python scripts/tenders/open_ingestion.py --source ted --limit 25

These fetch from approved public HTTPS endpoints but never write Supabase.
Output is JSON with per-source accepted, rejected and errors. If an API
changes format the job fails instead of inventing records.

## GitHub Actions: automatic schedule

Workflow: .github/workflows/tenders-sync.yml
Schedule: every 6 hours UTC (GitHub scheduling is best-effort).

Default: fetch official APIs, validate and dry-run only.

To activate private intake to the correct Supabase project, configure
GitHub Actions repository SECRETS (never put tokens in the repo):

SUPABASE_URL = https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY = (server-only secret)

And repository VARIABLES:

GTH_SUPABASE_PROJECT_REF = PROJECT_REF
GTH_TENDER_INGESTION_ENABLED = true

Then the workflow uses the audited scripts/import_tenders.py DB helper
to ingest new official records. Each item remains
status='review', source_verified=false, is_public=false.
Unique (source_name, source_reference) prevents duplicate imports; on
conflict, ignore so existing reviewed or published entries are untouched.

This is SOURCE INGESTION AUTOMATION, not automated endorsement.
An authorised reviewer must verify original notice, deadline,
amendments, licence and source attribution before public promotion.
Public RLS exposes only source_verified and published unexpired tenders.
Expired notices are excluded even before a physical status update.

## Security, scale, cost

- Maximum 100 notices per source per job and 2 MB response limit.
- Fixed official API hosts; HTTPS only; bounded retries/timeouts.
- No login, CAPTCHA, IP rotation, or blocking bypass.
- GitHub Actions/Supabase free tiers have quotas and are not unlimited.
- Attribution and licensing obligations continue to apply.
- Avoid copying sensitive tender-bidder details or credentials.
- No old layout, CSS, Real Estate code or data is modified.
