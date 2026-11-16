# GTH PRO Global Registry Fabric — isolated Phase 1

Status: IMPLEMENTATION CANDIDATE. No live registry sync, production certification, automated bulk import or production deployment is claimed.

Existing Real Estate UI, centralized CSS, Next.js routes, marketplace inventory, Supabase RLS policies and Travel supplier integrations remain unchanged.

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

## Evidence and launch gates

1. Independently validate current official MahaRERA request/response contract and source terms before running any large collection; earlier live probes failed with transport/TLS errors.
2. Recover or confirm the original claimed ~40,000-record VS Code run (script, logs, timestamp, project scope), rather than labelling a reconstructed engine as original.
3. Cross-check official district registrations, withdrawals, completeness and freshness before claiming any total. Snapshot counts cannot be described as live/verified inventory.
4. Add audited provider adapters for WBRERA/HIRA publication and then future jurisdictions; do not invent a universal worldwide scraping contract.
5. Confirm actual database read/write behavior on the correct project, query-level availability, public indexing and user journeys before any merge or deployment.

For offline regression tests:

    python -m unittest discover -s tests -p 'test_rera_*.py'

No merge, deployment, scheduled job, new migration, table permission or production data write is part of this feature branch.
