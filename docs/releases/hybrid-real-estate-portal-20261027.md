# Hybrid Real Estate Portal — 27 October 2026

Owner requested an upgrade of the existing portal, retaining all valid data and workflows. This branch extends the existing Explorer, submission/moderation screens, comparison dialog, map, lead capture, calculators and project detail routes. It does not replace the portal or change global/scoped CSS.

## Audit findings and corrections

- Existing public search mixed project registry rows with real sale/rent inventory and paginated before photograph approval. New anonymous, validated server search calls a SECURITY INVOKER RPC. It filters published inventory and independently approved photographs before sorting/pagination. Every budget/BHK/possession predicate applies to the same inventory row. Project cards summarize only matching units.
- Registry identities, dates and sale/rent offers are different facts. Added a separate source-scoped, searchable, paginated text directory, retaining existing detail URLs and source links. Missing source links are labelled; recorded dates never certify possession or delay. No fixed inventory totals are advertised.
- Existing owner uploads lacked an independent publication path. Added explicit rights declaration, a separate admin photo review/publication/takedown path through `property_published_media`, and exact account/object checks in the public proxy. Existing RERA claim media and independent-review predicates remain intact. Uploaders cannot approve their own photographs, even when they are admins. Approval of listing facts does not approve photos.
- Raw unit-upload galleries previously described images as reviewed without independent publication. Removed those galleries; approved project photography remains in the existing gallery. Cards require actual published photographs, rather than architectural renders or legacy image URLs.
- Existing filters lacked new launches, possession and 4+ BHK. Added validated possession/new-launch/area-basis fields to submissions and inventory; moderation copies them without inferring them from registry dates. Channel partner registration is collected for review and never turned into a verified badge.
- Reused existing EMI calculation and global theme controls. Added unit conversion plus an explicitly user-supplied carpet/built-up ratio; there is no universal inferred efficiency.
- Added offer-backed `RealEstateListing` JSON-LD on property detail pages. Registry-only pages never become offers; unknown prices and unverified availability are omitted. Descriptive metadata distinguishes registry records from reviewed inventory.

## Release and verification

- Local strict TypeScript and ESLint pass.
- Local JS/TS suite: 532 tests pass, including search validation, fail-closed errors, photo/source gates, actual offer schema and area calculations.
- Existing claim RLS tests and new hybrid SQL migration/assertions pass in isolated PGlite PostgreSQL. Covered self-publication denial, same-unit filters, new-launch classification, private-field exclusion, immediate takedown and 24+2 deterministic pagination over eligible records.
- Added a disposable PostgreSQL 17 CI job running those same SQL files alongside the existing claim/media assertions.
- Launch-enabled production build passes (139 routes). Placeholder public DB settings exercise compilation/fallback behaviour; this is not proof of production connectivity.
- Browser layout/interaction tests passed at 360, 390, 768 and 1440 px in day/night themes using isolated intercepted inventory/photo fixtures (no DB writes). Comparison, filter state, micro-market URL, EMI/area tools and the site-visit modal worked; no page overflow or JavaScript page errors observed. This is UI evidence, not live inventory or submitted-lead proof.
- No CSS files modified. Existing global semantic controls and hidden-scrollbar class are reused. Existing account, registry import, enquiry and private media pipelines are retained.
- Branch previews are disabled. Production release is intended to be one Git merge after schema activation and all release checks.

## Unresolved production gate

Two connected SQL reads failed with `Connection terminated due to connection timeout`; table inspection also timed out. A different read-only public REST attempt for inventory and published media timed out as well. Project metadata reports ACTIVE_HEALTHY, which does not prove query connectivity. A read-only recent-log aggregation returned no rows and provides no explanation for the timeout.

No production schema/RLS mutations, records, publication flags or imports have been applied. The additive migration must be reviewed against the current production columns/functions, applied and verified with anonymous/authenticated role checks before this code can be merged. Exact-head remote CI, final browser verification and production deployment verification must be recorded separately. No completed production deployment is claimed.

The real-estate subset of draft PR #142 was used as a starting point for the registry/photo correction. Its separate non-real-estate changes and other open drafts are not included or merged.
