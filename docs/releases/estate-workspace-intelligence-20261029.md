# Property workspace and source evidence release

This release extends the existing real-estate portal; it does not replace registry discovery, approved media, submissions, enquiries, comparisons, calculators or the sticky mobile enquiry action. No CSS file or environment file changes. No paid resource, importer or ingestion schedule changes. Main is the only production deployment target.

## Added working product flows

- `/real-estate/workspace`: verified account access, private live inbox, property/price alerts, non-binding offers with seller counters and private discussions, account shortlist copy/merge, resident-review submissions, support requests and own-listing analytics.
- Administrator tabs: enquiry stages, optimistic stage updates, follow-up notes/times, independent residency review, source-reviewed valuations/transactions/tours/floor plans, and support responses. Contact details remain administrator-only.
- Price events come from published inventory with the canonical approved-photo rights gate. First observation is the publication/observation date; no registry price or invented historical series is seeded. Withdrawn inventory loses public history access.
- `/real-estate/market-intelligence`: actual observed asking prices and source-reviewed transaction reports, separate sources and measurement/currency groups, minimum five independent projects per monthly sample. No simulated market dataset is exposed. Existing gated research route remains private/noindex.
- Detail evidence: actual asking-price changes, reviewed source reports with provider/reference/date, public tour/floor-plan links, independently checked resident review projection and descriptive comparable asking evidence. Comparable samples require five distinct projects; rents, currencies, types, bedrooms and area bases are kept separate.
- Drawn map region search: 3–50 validated points, keyboard entry and map clicks, boundary matching including the date line. No approximate property pins are introduced. Existing filters and saved searches preserve the region.
- View events are browser opt-in, off by default and respect Do Not Track. No visitor identity or persistent visitor ID is stored. Counts are events, not unique buyers or guaranteed leads.

## Actual coverage and external dependencies

The code supports reviewed evidence, but this does not create licensed market data or professional appraisals. There was no published marketplace inventory at the start of this release. Empty evidence samples remain explicit. Source date/reference review is not a blanket title/ownership/legal guarantee.

Alerts are account inbox updates while the workspace is open, with live database notifications and a minute refresh fallback. Email and closed-browser push delivery are not configured. No claim of email/push activation is made.

A support brief is not legal/interior/moving fulfillment, CRM/XML feed activation, a confirmed open-house appointment, lender pre-approval, payment, e-signature or escrow. Professional providers, licensed school/transaction coverage, other official registry connectors and publication-rights evidence are required before those services can be advertised as available. Virtual tours are safe public provider links, not newly hosted 3D models. Automatic multilingual translation is not enabled without an actual translation/review provider.

## Security and validation

All twelve new tables enable RLS and narrow client grants. Privileged trigger code lives only in a revoked, unexposed private schema; new public RPCs are invoker functions. Owner/seller/admin identities are server or trigger-derived; user_metadata never authorizes access. Offers have database role transitions, deadlines, daily bounds and optimistic versions. Private review evidence is projected separately before public publication. No client inserts notifications or price observations.

Rollback-only SQL tests exercise real PostgreSQL roles, seller derivation and spoof prevention, unrelated-account isolation, asking-price/drop triggers, seller counter/buyer discussion agreement, independent review projection, private residency/analytics denial, reviewed source publication, minimum sample protection, region validation/search/date line and withdrawal. Fixtures use random accounts and negative project IDs and are always rolled back; no fake inventory is committed.

Local checks: full security suite, TypeScript, ESLint and production build with public CI placeholders. GitHub performs the disposable PostgreSQL chain plus consolidated integrity/build checks before main is updated. Browser QA verifies public flows; physical Android testing is not claimed.

Pre-existing Supabase advisor findings are outside this additive release: intentionally exposed old media moderation RPCs, pg_trgm in public, thirteen deny-by-default/no-policy tables and leaked-password protection disabled. New schema must not add public SECURITY DEFINER RPCs. References: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable ; https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public ; https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
