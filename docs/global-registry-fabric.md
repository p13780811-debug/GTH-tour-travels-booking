# GTH PRO Global Registry Fabric — guarded universal candidate

Status: PR CANDIDATE. Offline worldwide reference validation and secured opt-in web onboarding implemented. New SQL migration is not applied to live Supabase. No official global sync, legal-title verification, public auto-publication or deployment claimed.

Existing deep MahaRERA/WBRERA/HIRA adapters, global CSS design tokens, legacy properties and approved inventory moderation are preserved. New onboarding UI, server API, private table and scoped RLS are additive.

## What was verified before implementation

The historical RERA V5 in src/app/real-estate/services/rera_mumbai_v5.py was a Selenium search-table collector. The Hyper Property Engine V9 in src/lib/real-estate/propertyService.ts is an application and search service, not proof of a 40,000-project API ingestion. PR #93 reconstructed the user-supplied public general-details endpoint but did not confirm current successful live requests. These are separate components.

The user-supplied list of 48 distinct MahaRERA endpoints contains both public project facts and routes involving sessions, bank details or private contact data. Only the named public general-details route is considered in this phase.

## Architecture and truthfulness

The new scripts/registry_fabric package isolates three provider namespaces:

- maharera — Maharashtra public registration references, currently the observed P + 11 digit format
- wbrera — West Bengal RERA records (WBRERA/P/...)
- wbhira — historical West Bengal HIRA records (HIRA/P/...)

Normalized source identities are prefixed by provider. Registry records are not sale/rent stock, certified owner identities, legal title clearance, GTH-approved listings or independent verification. Revoked/rejected records, conflicting duplicates, untrusted hostnames and mismatched registration formats are rejected. All optional fields stay null if absent from a source. No personal PAN, Aadhaar, contact, bank, marketing price, unlicensed image or AI score is propagated.

## Local offline preflight (zero network and zero DB writes)

    python -m scripts.registry_fabric.cli --provider maharera --input /private/maharera.csv --limit 100
    python -m scripts.registry_fabric.cli --provider wbrera --input /private/wbrera_kolkata.csv --limit 100
    python -m scripts.registry_fabric.cli --provider wbhira --input /private/hira_kolkata.jsonl --limit 100

Snapshots must be authorized local CSV/JSONL with a project name, registration reference and explicit district; optional promoter, locality, status and official source URL. Window selection uses --offset and --limit (at most 5000). Each input is capped at 30 MB and 100,000 rows. The only output is a new local JSONL under .gth-rera/registry-fabric by default; that folder is ignored by the existing repository. A dry-run is not a Google-indexable or published page.

## Official West Bengal district collection (Kolkata phase)

The public WBRERA site exposes **Kolkata district listings** using a documented
navigation link with district code `10001000000032`. The historical HIRA list is
separate and uses the same district code:

- `https://rera.wb.gov.in/district_project.php?dcode=10001000000032`
- `https://rera.wb.gov.in/district_project_HIRA.php?dcode=10001000000032`

The public table fields are: Sl No., Project ID, Project Name, Completion Date,
Registration No. and Registration Date. Each project name points to an authority
hosted detail page with an explicit `procode`; HIRA details have a distinct
`project_details_hira.php` path. The new reader parses only this explicit six
column project table and a single validated official detail link per row.
Navigation, promoter/contact data and other unrelated tables are excluded.

**Staging-only, opt-in, no paid API, no database writes:**

    python -m scripts.registry_fabric.cli --provider wbrera --west-bengal-list \\
      --source-authorized --enable-network --offset 0 --limit 100
    python -m scripts.registry_fabric.cli --provider wbhira --west-bengal-list \\
      --source-authorized --enable-network --offset 0 --limit 100

The collector makes one normal official GET per district list after a robots.txt
policy check; the file is capped at 8MB and 50,000 HTML rows. Redirects, changed
headers, missing links, unknown source schemas and denied robots rules stop the
run. Use `--offset` for subsequent windows. Source dates and project statuses
require separately verified detail enrichment, so the current stage is **a public
listing snapshot**, not a current-compliance or live-inventory certification.

**Environment blocker as of 2026-11-16:** the current execution container cannot
resolve `rera.wb.gov.in` by DNS. Public web search renders and indexes the
listing but has not supplied an authorized raw HTML export to this runner.
Therefore the collector has not yet completed a live network read, and 0 WB
records have been written to Supabase. If no approved runner with official access
is available, an operator-provided **saved official HTML page**, CSV, or JSONL
snapshot is supported by the offline CLI (no HTTP or database writes):

    python -m scripts.registry_fabric.cli --provider wbrera --input /private/kolkata-wbrera.html --limit 100
    python -m scripts.registry_fabric.cli --provider wbhira --input /private/kolkata-hira.html --limit 100

The HTML input requires the same six-column official project table with a project
name link to the expected authority-hosted detail path. This permits recovery
from browser-exported source pages without inventing API endpoints or weakening
source validation. If a phone can only save a PDF instead of HTML, that PDF
must be converted and validated separately; it cannot be fed directly to the
HTML reader. The exact collection URLs have been
verified using the government portal's own navigation; no private API is assumed.

## Existing 2024 compact MahaRERA staging (local/offline)

The user's Library contains a previously generated private JSONL dataset with
11,981 unique old Maharashtra registrations: Thane 5752, Mumbai Suburban 5103,
Mumbai City 1126. A read-only identity join against the live target Supabase
found 11,747 already published registry registrations and 234 genuinely absent
IDs (Thane 91, Mumbai Suburban 115, Mumbai City 28); no DB IDs were outside
that staging set. Existing `properties(rera_id)` has a real unique index.

Historical archives are not today's registry status. The optional compact
adapter maps only public project names, registration number, promoter,
district and the original source last-modified date; it intentionally drops
all raw locations, photos, current-status claims, pricing and sensitive extras:

    python -m scripts.registry_fabric.cli --provider maharera \
      --maharera-compact-archive \
      --input /private/GTH-PRO-maharera-import-staging-20261019.jsonl \
      --offset 0 --limit 5000

Repeat dry-run with offsets 5000 and 10000 to stage the whole old dataset.
It categorically rejects `--commit` because source currency and revocations
need an independently verified refreshed official status. This historical
adapter does not change the existing writer or any database rows.

## Direct MahaRERA endpoint research (explicit network authorization)

    python -m scripts.registry_fabric.cli --provider maharera \
      --ids-file /private/known_numeric_project_ids.txt --offset 0 --limit 20 \
      --source-authorized --enable-network --delay 5

This path is staging-only and rejects --commit. It sends the source-specific JSON projectId payload to the operator-supplied public general-details endpoint, with normal TLS verification, official-host validation, robots check, explicit public record identity validation, bounded response size, <=100 known IDs per run and >=5-second pacing. Any unavailable robots policy, authentication/403 response, unexpected redirect or incompatible JSON stops collection. It never discovers IDs by brute force, handles CAPTCHA, replays sessions, rotates proxies or uses paid APIs.

Internal numeric project IDs and RERA registration references are different. 48 observed endpoints do not constitute proof of a public search/discovery contract or complete statewide coverage.

## Optional database publication — Maharashtra snapshot ONLY

Before intentional publication, the operator must verify approved source reuse rights, existing rera_id uniqueness, live source relevance, output report, project reference, server-only DB key and protection of current edited properties.

    GTH_INGESTION_ENABLED=true python -m scripts.registry_fabric.cli \
      --provider maharera --input /private/approved-maharera.csv \
      --source-authorized --commit --expected-project-ref YOUR_PROJECT_REF

The CLI reuses the existing rera_csv_import.commit_batches writer. That module validates the exact Supabase project reference, requires enabled private ingestion, uses server-only authentication, and performs 50-row insert-only writes on rera_id conflicts. Existing URLs, media, inventory and owner/moderator edits are not overwritten.

No WBRERA/HIRA writes are permitted through the Maharashtra properties writer. Legacy registry-read filtering and source metadata are MahaRERA-specific. West Bengal publication requires its own separately approved table or scoped source contract, security review, and new query/SEO integration. Do not alter RLS to make cross-state records public.


## Universal and Pan-India upgrade

The UniversalGlobalRegistryAdapter accepts a 2-letter ISO country code, one of India's 28 states or 8 union territories (or an international region name), the source authority, and a bounded registration or permit ID. It reuses the existing offline CSV/JSONL preflight; it does not scrape or claim to verify arbitrary government registries. Existing source-specific MahaRERA, WBRERA and HIRA adapters remain in place. GLOBAL_UNLISTED, MLS and COUNTY_ASSESSOR are source categories, not legal-title guarantees.

Offline example: python -m scripts.registry_fabric.cli --provider global --input /private/approved_worldwide.csv --limit 100

The Real Estate no-match results link to the new form at /real-estate/post-property#global-registry-onboarding. The form captures country, state/region, authority, official reference, project name, city and optional promoter/postal code/paired coordinates. The API requires a real user session, strictly validates server-side, rate-limits via the existing fail-closed Upstash policy, and uses a server-only Supabase service key. Unknown fields, HTML and oversized text are rejected. Identical identities are deduplicated; other-owner duplicates are never disclosed or edited.

The new private global_registry_projects table is isolated from the old properties table and has a country+authority+registration composite unique key. It contains only the requested compact reference fields plus submitted_by owner UUID (necessary for security). A 220-byte combined UTF-8 text cap and narrow types prevent raw HTML, JSON, images or scraper payloads from accumulating. PostgreSQL row overhead and indexes add to that figure, so 100,000 rows under 30 MB is a **measurable target, not a guaranteed figure**. Measure pg_total_relation_size including indexes in an authorized staging database before bulk rollout. Live table/overall project MB usage was not confirmed.

Pending registrations receive pending_global_review status. Their owner can immediately attach and submit inventory to the existing listing_submissions moderation workflow. Unverified submissions do not appear as published inventory until the existing independent review approves them. This avoids bypassing current GTH PRO verification, media rights and project ownership restrictions. Source-specific official verification scheduling is not turned on, since public-regulator transport/rights vary and West Bengal live requests timed out. Heavy details must be fetched on-demand only through approved source adapters with bounded cache; none are stored in the compact table.

Applied live migration: supabase/migrations/20261117014614_global_registry_compact_stubs.sql. RLS owner-only SELECT, server-role writes, no public client INSERT/UPDATE, no self-approval, and owner-only listing submission link are covered by disposable PostgreSQL tests. No global CSS, supplier connections, legacy registry rows or main branch are changed by this feature.

Release gates: all TypeScript, ESLint, Next.js build, Node/Python and PostgreSQL tests green; confirm correct Supabase project and staging migration; measure storage/index size; verify Redis configuration, source permissions and authenticated end-to-end submission; then production approval. No merge, deployment or production DB writes are part of this branch.

## Evidence and launch gates

1. Independently validate current official MahaRERA request/response contract and source terms before running any large collection; earlier live probes failed with transport/TLS errors.
2. Recover or confirm the original claimed ~40,000-record VS Code run (script, logs, timestamp, project scope), rather than labelling a reconstructed engine as original.
3. Cross-check official district registrations, withdrawals, completeness and freshness before claiming any total. Snapshot counts cannot be described as live/verified inventory.
4. Add audited provider adapters for WBRERA/HIRA publication and then future jurisdictions; do not invent a universal worldwide scraping contract.
5. Confirm actual database read/write behavior on the correct project, query-level availability, public indexing and user journeys before any merge or deployment.

For offline regression tests:

    python -m unittest discover -s tests -p 'test_rera_*.py'

The branch includes a proposed, unapplied private table migration and scoped RLS grants, but no merge, deployment, scheduled job, official live sync or production database write.
