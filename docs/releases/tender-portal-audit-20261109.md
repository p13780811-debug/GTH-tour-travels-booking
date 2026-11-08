# GTH PRO Tender portal — protected audit and implementation

9 November 2026 · Baseline main `8359ec6e74245817211d90d0d90828b3c7f01063`

The owner requested a complete Tender audit, useful new UX/features, a practical
revenue system, broader worldwide official notices and protection for Supabase.
This continuation is isolated on `feat/tender-decision-revenue-global-20261109`.
Production merge/deployment is a separate release decision; branch preview is disabled.

## Audit findings and preserved implementation

| Existing feature | Finding | Implementation / exact files | Dependencies, risk and acceptance |
| --- | --- | --- | --- |
| Country/nearby/world search, 15 languages, categories, date/window/sort, paging | Search started after a long hero/workflow/stats sequence | `src/app/tender/page.tsx`: original fields moved into the hero; primary keyword/country/category, expandable remaining controls | All original names, query meanings, default country/language precedence and GET routing remain. Verify primary search in a 320px phone viewport, RTL and keyboard interaction. |
| RLS-scoped public catalogue / detail API | Multiple counts per visitor and no source network deadline | `src/lib/tender/public-reader.ts`, `read-budget.ts`, `catalog.ts`; public API/page imports | Shared 60s search/detail cache; five-minute geographic facets; 5s HTTP deadlines. Expired records pruned even before cache expiry. Cached errors are never fabricated empty success. Snapshot age bounded; counts show check time. |
| Saved40, compare3, searches8, CSV and ICS | Saved list could send40 separate requests; failed local reads risked losing unseen data | `src/app/api/tender/batch/route.ts`, `TenderSavedWorkspace.tsx`, `useTenderWorkspace.ts` | Up to40 validated IDs use one anonymous/RLS row query; failed rows retain IDs. Deferred edits replay on recovered storage; existing saved/search/compare format unchanged. No silent erasure. |
| Eligibility assistant, source intelligence, document staging and private drafting | These already exist and should not be rebuilt | Existing assistant/eligibility/workflow-state/IntelligencePanel remain | Manual decisions do not certify eligibility, attendance, submission or an award. Public page reads share source cache; private write/AI consent gates remain. |
| Four optional quote services and private consented intake | Customer had little help selecting the right deliverable | `TenderSupportChooser.tsx`, `src/app/tender/services/page.tsx` | Existing IDs/deliverables reused. Free tools remain free. No invented fee, automatic charge, fake subscription or guaranteed bid outcome. |
| Private admin queue + manual email quote composer | Quotes were not tracked; a closed review is not payment revenue | `src/lib/tender/commercial.ts`, `src/app/api/admin/tender-services/route.ts`, `TenderCommercialControls.tsx`, `TenderServicesDashboard.tsx` | Record referenced written quote, acceptance, full-fee payment or not proceeding. Human-confirmed invoice/date required for paid. Server-owned admin role, existing RLS, rate limit and compare-and-swap prevent unauthorized/lost updates. Existing composer and review statuses remain. |
| Eight official feed connectors + existing six-hour OIDC sync | Most general feeds were limited to their first page | `scripts/tenders/open_ingestion.py`, `global_ingestion.py`, `official_publication.py`, `.github/workflows/tenders-sync.yml` | World Bank/TED use at most3 pages: newest plus rotating deeper pages. At most100 accepted/source/run; no new API hosts/credentials. Each upload renews short-lived GitHub OIDC via its trusted broker. Existing Edge provenance/revision RPC and reviewed eligibility stay untouched. |

## New useful features

- A private device-only **bid decision planner** (`TenderPursuitPlanner.tsx`,
  `src/lib/tender/pursuit.ts`) stores pursue/hold/no-bid decisions, notes and
  entered preparation hours. It exposes a transparent capacity gap and personal
  work-back targets. These are internal targets, not invented authority dates.
  A changed source deadline requires a fresh user review. No planner field is
  sent to Supabase, AI, analytics, a service enquiry or a public URL.
- **Country and official-source coverage** (`src/app/tender/coverage/page.tsx`,
  `src/lib/tender/coverage.ts`) distinguishes supported feed code, an optional
  free-key source and official-portal-only guidance. Global sources remain
  visible for context. Connector availability is not a claim of a successful
  recent sync, every notice, or complete country coverage. Country selection includes
  the full ISO3166-1 list plus the existing World Bank Kosovo code; no inventory
  is inferred from a selectable country. The main sitemap
  adds only this public coverage route.
- **Commercial tracking** appends bounded typed metadata to the existing private
  service-request message; no new table, SQL migration or credential. Quote and
  invoice references link back to the business's written terms and accounting
  records. Full quote text/payment collection remains in the established workflow.
  Payment dates retain their entered calendar/time zone, including cross-UTC-day
  cases such as India. Paid records cannot be overwritten; adjustments belong in accounting. Totals
  cover only the loaded admin page/queue, keep currencies separate and exclude
  unquoted/closed/lost enquiries. Manual paid logs are not gateway reconciliation.

## Supabase protection and truthful cost limits

1. Shared Vercel data-cache hits bypass source reads and the refresh budget.
   Detail prefetch is disabled on the relevant discovery/workspace links.
2. A cache fill reserves the existing Upstash global `tender_reads` scope, with
   120 refresh operations/minute and5,000/day per environment. A refresh operation
   can contain more than one SQL request (facets currently use7 bounded reads);
   this is not a claim of5,000 SQL queries/day. The shared bucket uses no visitor
   profile, IP or business information. Other scope policies remain byte-identical.
3. If Redis is absent, the built-in fallback is30 refresh operations/minute and
   1,000/day **per worker**. It is explicitly not a fleet-wide hard quota. A shared
   limiter needs the existing `UPSTASH_REDIS_REST_URL/TOKEN` configuration. If that
   configured limiter fails, cold refresh fails before source reads; usable recent
   cache entries can still serve, subject to the snapshot age bound.
4. CDN sharing is enabled only for explicit valid country+language responses,
   never inferred visitor geography/language. TTL is bounded by the nearest
   source deadline. Private, error, authentication and commercial responses remain
   no-store. No24-hour stale live tender availability is introduced.
5. Search remains12 rows, saved batch40, admin page20, source pages3, per-source
   accepted notices100 and signed uploads50 rows/batch. No catalogue-wide scans,
   all-country count fan-out, automatic visitor polling or new cron are added.
6. Existing six-hour GitHub source sync remains independent of visitor requests.
   Rotation0..30 advances every six-hour slot; newest pages always remain in the
   read window. GitHub schedules are best-effort. This improves partial coverage;
   it cannot collect every government portal or promise instant worldwide data.
7. Account-specific CPU, egress, function/cache writes and Redis usage still count.
   Actual Vercel/Supabase plans and production usage are not available here. This
   code reduces/bounds work; unlimited traffic with no quota risk is not guaranteed.

## Mandatory non-regression / accessibility acceptance

- Protected homepage/Mega Aggregator, shared navigation/CSS, Hotels/Flights,
  Real Estate, app/OSM pages, database schema/RLS and Edge OIDC trust gates stay
  unchanged. `scripts/check-tender-upgrade-boundaries.mjs` enforces this; Vercel
  config permits only disabling this feature branch's preview.
- 320/390/768/1440px, day/night, keyboard controls, visible labels,44px primary
  actions, clear selected states, restrained movement, RTL and no document overflow.
- Original search/filter defaults, nearby/world separation, saved compare/CSV/ICS,
  assistant/manual eligibility and private consented workflows remain functional.
- Cache tests: repeated warm visits, canonical filter keys, geography isolation,
  expired-item pruning, provider/budget errors, batch bounds and no private CDN leak.
- Storage tests: blocked reads cannot overwrite unseen older records; blocked
  writes replay safely; recovery returns to real persistent/cross-tab reads.
- Revenue tests: trusted admin role, bounded request input, no generic partner
  mutation, source message preservation, intake retry identity, revision conflicts,
  invalid fees/dates, full-payment prerequisites, immutable paid record and separate
  currencies. Corrupt commercial metadata does not erase original enquiries.
- Feed tests: newest page retained, bounded pagination/rotation, no guessed IDs,
  expired/malformed records rejected, dry-run never writes, broker host locked,
  redirects blocked, fresh token failure never falls back to an expired token.
- `scripts/qa-tender-portal.mjs` runs actual Next HTTP/browser flows with explicitly
  local source/auth/Redis/intake/payment fixtures. Fixture writes are not production
  bookings, real payments, successful live ingestion or revenue evidence.

## What is unnecessary or duplicated

Do not rebuild saved searches, compare, CSV/ICS, eligibility/document checklists,
Gemini extraction, admin sign-in or service intake. Do not add a second tender
catalogue, private-draft table, payment gateway without merchant configuration,
email/SMS subscription promises, a paid data API, production scraping or blanket
all-country claims. Closed enquiries and quoted fees must never be advertised as
cash received. Source permission, optional keys and official submission remain
separate from aggregate discovery.

## Evidence and release boundary

Baseline source audit is static/code-backed. Local read-only World Bank/TED probes
could not reach the official APIs through this workspace; no notices were invented.
The read-only cloud probe records observed availability separately from fixture
contracts and never includes commit/publication flags. A dry-run or green build
is not proof of live production inventory. Source smoke evidence must be reported
as observed, including outages or zero accepted records.

At this stage there are no production database writes, migrations, secret changes,
external emails, payment charges or manual deployments. Ship only after the owner
reviews the concrete tested change and approves the production merge through the
existing one-shot release strategy.
