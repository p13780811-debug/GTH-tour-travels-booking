# Hybrid portal buyer research upgrade — 27 October 2026

## Benchmark and chosen gaps

The existing hybrid portal already includes six search intents, approved-photo marketplace gating, maps, shortlisting, comparison, property enquiries, role-aware seller submission, photo review, registry research, EMI/area tools and source-aware metadata. These flows are preserved.

Official benchmark references reviewed:
- Zillow advanced search: https://www.zillow.com/learn/zillow-advanced-search/
- JamesEdition search and filters: https://help.jamesedition.com/en/how-do-i-search-for-a-property
- Square Yards buying/evaluation tools: https://www.squareyards.com/faq/buying

| Capability | Existing GTH behavior | Upgrade in this candidate |
| --- | --- | --- |
| Advanced project research | Project/city/RERA keyword search | Combined district, developer and recorded completion-year filters; registration/completion date sorts; stable pagination |
| Project comparison | Marketplace/sidebar and device shortlist comparison | Separate shareable 2–3 registry-project comparison with explicit missing facts and official links |
| Buyer journey | Saved slugs and basic comparison | Private device notes, research stages, personal document checklist, local calendar reminder and private JSON export |
| Ownership planning | Loan EMI and unit conversion | Total upfront cash and recurring cost, rate sensitivity, affordability inversion, rental vacancy/expense scenario and yearly amortization CSV |
| Search return/share | Device search shortcuts | Preserve all hybrid modes, possession, 4+ bedrooms and decimal budgets; sanitized public search-link sharing |
| First-load registry response | Entire page waited for database | Stream search/form/loading content before the bounded database read, preserving success-only cache, retry and outage recovery |

These are practical research improvements, not a claim of parity with every global marketplace. Automated valuations, registered transaction prices, source-backed market trends, licensed virtual tours, lender pre-approval, cloud co-shopping and email price alerts need real data/integrations. They have not been simulated or claimed implemented.

## Registry outage investigation

Current deployed main is `28bc3a58b38b91dbd22d697604c0729909c90241`, including the prior registry-first and resilience fixes. Those fixes, protected claim navigation, mobile header and low-query market shortcuts are retained. Pending travel first-click changes from `fb87427a4df9f93aef6b15f7acd708cd16f0b477` are also retained for a later consolidated release.

On this resumed inspection:
- Supabase project metadata reported ACTIVE_HEALTHY. A minimal SELECT 1 succeeded, but a later read returned connection-timeout and another diagnostic stalled. The status label therefore does not prove Data API availability.
- A public anonymous REST query for 35 registry rows timed out at 15 seconds. No private service-role credentials were used.
- Production cloud-browser inspection of /real-estate/registry displayed the deployed data-service-unavailable message and Retry registry lookup; actual rows were not visible.
- One activity sample showed seven idle-in-transaction sessions and one aborted idle transaction, with a longest observed query age of 419 seconds. Session ownership and causal responsibility were not established. No session was terminated, no timeout setting changed, no project restarted and no paid compute upgrade performed.
- The inspected recent log window exposed edge/realtime/functions sources but no PostgreSQL log source. Absence of matching log entries is not evidence of database recovery.
- Supabase dashboard metrics require sign-in in the current browser. CPU/RAM/I/O and connection-pool reports remain the next diagnostic boundary.

The new registry reader preserves anonymous RLS, source gates, explicit public-field projection, two attempts maximum, seven-second per-attempt timeout and five-minute success-only cache. Invalid filters never query the database; permission/schema errors are not retried. Failures throw inside the cache and become recoverable outage UI outside it. A failed backend response is never cached as a successful zero-row result. Comparison uses the same public source and does not replace missing projects.

The streaming change makes the form/content usable before the data service responds. It does not repair Supabase platform health or prove that records have resumed loading. Do not describe this as complete registry recovery until public rows and pagination are observed again.

## Privacy and financial assumptions

Research notes/checklists stay on the visitor's browser. They are not GTH verification, legal clearance or account-synced records. Storage denial retains open-page edits with an explicit loss-on-reload message. Updates read the latest durable record to avoid resurrecting entries removed in another tab. Public comparison/search links contain public filters/record slugs only, never private notes.

Calendar exports are personal reminders with no attendee/organizer or booking request. Times are floating local calendar times. Calendar escaping and UTF-8 folding prevent line injection. Finance tools use visitor assumptions only, support the existing six currency labels without FX conversion, infer no local tax rates and make no lending/return guarantees. Blank optional cost fields are explicitly disclosed as zero contributions to an illustration.

## Validation and release

Targeted behavior tests cover finance reconciliation, cash purchase, stress/zero-interest scenarios, vacancy, yearly loan totals, notes/checklist bounds, invalid date/ICS injection, saved hybrid filters, registry filter validation, stable queries, retry and success-only caching, missing/archived comparison records, form-before-query streaming boundaries, UI calculator input binding and storage-failure durability.

All 568 local JS/TS regressions, TypeScript and ESLint passed, including the form-before-query streaming regression. The local unmocked production build was blocked downloading existing Google font WOFF2 assets; no global font, CSS or production configuration was weakened to conceal that environment failure. Exact final regression/build/HTTP results and GitHub CI evidence are recorded with the final handoff.

No importer, production database data, schema, RLS, permissions or central CSS changes are part of this candidate. New exact file exceptions in the existing integrity guard cover only the authorized research components/helpers. Feature-branch Vercel deployment is disabled. No new PR/main merge/production deployment is performed without the owner's existing release instruction being resolved. Physical-phone QA, browser QA of a deployed candidate and authenticated publication writes are not claimed.
