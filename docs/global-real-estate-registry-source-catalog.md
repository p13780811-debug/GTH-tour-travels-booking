# Worldwide registry source catalog and zero-overage operating policy

Status: researched official navigation index (not a worldwide legal-title registry and not a successful live import). No data migrations, database writes, RLS edits or production deployment.

## Distinct authorities, distinct meanings

| Region | Official data source | Format / access | What it represents |
|---|---|---|---|
| India / Maharashtra | https://maharera.maharashtra.gov.in/projects-search-result | Public project search; full official bulk export NOT verified | MahaRERA registrations, current status must be rechecked |
| India / Kolkata | https://rera.wb.gov.in/district_project.php?dcode=10001000000032 | District project list printable to PDF; HTTPS automated access timed out | WBRERA registered-project list |
| India / Kolkata historical | https://rera.wb.gov.in/district_project_HIRA.php?dcode=10001000000032 | Historic list printable to PDF | HIRA legacy registration, not automatically current |
| UAE / Dubai | https://dubailand.gov.ae/en/open-data/real-estate-data/ | Project tab offers Download as CSV after filters; anti-bot controls must be respected | Dubai DLD registered development project information |
| UK / England | https://www.planning.data.gov.uk/dataset/brownfield-land | Dataset CSV/GeoJSON bulk via Planning Data | Brownfield development land register; NOT a project ownership register; OGL v3 |
| USA / NYC | https://catalog.data.gov/dataset/dob-now-build-job-application-filings | Official building filing CSV/JSON/XML | Building construction job filings; NOT title or owner registry |
| Singapore | https://www.ura.gov.sg/property-data/private-residential-properties/ | Project pipeline, search and developer sales; full REALIS may require paid subscription | Residential pipeline; public bulk availability varies |
| Global GIS | https://github.com/OvertureMaps/data | Country/geographic GeoParquet subsets; source-specific license | Building footprints/places, not registered real-estate projects |
| Global infrastructure | https://datacatalog.worldbank.org/search/dataset/0037800/world-bank-projects-operations | World Bank projects Excel/API | Public development-finance projects, NOT private property registrations |
| Global infrastructure | https://undp.github.io/open.undp.org/ | CSV/JSON/IATI XML bulk | UNDP investments, NOT property registries |

Never imply that one PDF contains all residential project registrations worldwide. Require permitted reuse, specific authority namespace, source dates, completeness checks and accurate registry/permit/land/financed-project labels.

## Evidence from user's Kolkata export, 2026-11-16

User supplied a 77-page Kolkata WBRERA *Project List* PDF. The entire text-bearing PDF was parsed, yielding 2,039 rows numbered 1..2039 with **2,039 distinct registration IDs**. Extracted CSV has registration number, project name, project ID, registration date and proposed completion date, with no proof of ownership or current sale inventory. It remains a private chat artifact; it is not committed to this public repository or inserted into production. The source PDF does not include stable per-row detail-page URLs, so no `procode` links were invented.

Historical Maharashtra snapshot: 11,981 rows for Mumbai City, Mumbai Suburban, Thane, of which 11,747 are already in production (exact ID intersection); 234 distinct older IDs are missing from the production registry and require current-source validation before publication. This is NOT exhaustive statewide coverage.

## Actual database and claims constraints (read-only verified, 2026-11-16)

Live Supabase Postgres database measured **215,706,771 bytes (approximately 206 MiB)** and public.properties (with indexes and TOAST) approx **48,406,528 bytes (~46 MiB)**. Supabase Free *plan allowance* is 500 MB database size, but the project's actual subscription tier wasn't established. No write was performed.

The existing property claims flow in:
- `src/app/api/property-claims/route.ts`
- `src/app/real-estate/claim-project/page.tsx`
- `supabase/migrations/20261020091500_re_master_98_project_media_claims.sql`

is intentionally **MahaRERA-only** (validates `P[0-9]{11}`) and requires an already persisted `public.properties.id`. It is INCORRECT to say that an offline WBRERA registry index automatically makes an owner claim possible.

## Scalable architecture decision — publication remains gated

1. **Raw archives in bounded, versioned external object storage** (country/district/authority partitioned, compressed; license/provenance manifest); do not put all worldwide raw data, PDF binaries, photos or source JSON into Supabase. Check quota/billing before choosing a bucket; free tiers are finite, not unlimited.
2. **Lean registration lookup index** keyed by authority + registration, with country/district, project name, source date, source URL and storage shard pointer. No personally sensitive or fake verification fields. Search-only lookups can query immutable country shards, or a properly indexed bounded DB table after a separate approved schema/security review.
3. **Claims only upon signed-in, proof-based request**: authority-aware ID search, exact official reference, private evidence and independent administrator approval. Existing claims schema/FK/trigger must be extended and tested before accepting non-MahaRERA claims; never bypass RLS or auto-grant ownership.
4. **Budget and access gate**: get live pg_database_size before any large write; keep a conservative headroom threshold, cap staged bytes/rows per run, skip already-present IDs, use bounded batch and checkpoint with verification. Fail closed if size cannot be measured or source exceeds quota. Do not assume every 40k or million records fit.
5. **Source discovery**: refresh official source catalogs by country; each adapter may use only documented/permitted public pages, stable CSV exports, or user-provided government PDFs. No brute-force IDs, bypass, login replay or scraping against denial. Track pending/unavailable jurisdictions, don't fabricate "complete worldwide".
6. **Public publishing**: qualify source freshness, legal provenance, and useful project detail before SEO index; don't create millions of thin pages.

This source catalog is documentation only and should not be mistaken for an implemented global publication or claim engine.
