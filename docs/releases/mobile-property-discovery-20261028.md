# Search-first property portal — 28 October 2026

## Result

The mobile entry now opens with a compact heading and List property action, all six horizontally scrollable search intents, a single contextual command search and locality shortcuts. The large introductory hero, architectural brand image and breadcrumb no longer precede search. Existing media is retained in the repository; no CSS or theme overrides were added.

The unfiltered research landing does not launch an unused sale/rent RPC; realtime updates refresh inventory only while its workspace is active. Registered project research is the default for an unfiltered visit to the new marketplace. Sale/rent URL filters open the offers workspace. Buy/Rent/New Launch/Commercial/Plots switch the same existing inventory filters; Registry selects the separate text-only research workspace. Search and locality chips target the selected source. BHK and possession quick controls call the existing search pipeline. Budget opens the existing full filter panel. Desktop sidebar, mobile filter controls, grid/map, approved-photo gating, comparison, saved items, seller review and enquiry flows remain.

The homepage now requests up to six genuine registry summaries through a validated endpoint using the same anonymous RLS reader and five-minute success-only cache as the directory. Only slug/title/RERA/promoter/location fields are returned. Cards have no invented price, stock photograph, available-units count or verification badge. Save reuses the existing device shortlist. Full directory links preserve the registry query and expose pagination and comparison. Failed reads show a retry and directory action; failures are never disguised as zero records.

Previously staged buyer planning, private research workspace, travel outbound fixes and approved registry-photo discovery remain in the same release branch. No new PR or production deployment is created.

## Data service evidence

Read-only inspection on 28 October confirmed RLS enabled on properties, property_inventory and property_published_media. Public SELECT on properties is present. Published-media access uses the existing six explicitly granted public metadata columns rather than a broad table grant. No permissions or policies were changed.

Recent logs contain PostgREST "Thread killed by timeout manager" errors. The current activity snapshot had ten idle connections and no idle-in-transaction sessions, unlike the earlier investigation. A fresh public anonymous one-row registry read returned HTTP 200 with one real row in 8.6 seconds. This is a recovery signal, not evidence of stable performance or a root-cause repair. No importer, session, schema, RLS, pool settings, compute tier or production records were modified.

## Verification boundaries

Behavior tests cover intent dispatch, contextual search, query validation, repeated/unknown parameter rejection before reads, six-record public projection, outage/recovery distinction, BHK/possession binding and preserving currency/budget while switching to commercial. Existing global-theme and security checks remain enforced. Full final CI evidence is recorded in the handoff.

The cloud browser cannot reach the workspace's local server (ECONNREFUSED). Physical-phone and deployed-candidate visual QA are therefore not claimed. Source-level responsive layout checks and React interaction tests are distinct from browser verification. Production deployment remains a later single main-merge release.

Final live verification: the full public anonymous 35-row registry projection returned HTTP 200 in 6.6 seconds, and all returned RERA references matched the required format. The deployed directory returned HTTP 200 in 7.7 seconds with a rendered table and no data-service outage message. This confirms rows were visible during this check; it does not establish the cause of the earlier intermittent timeouts or guarantee ongoing provider availability.
