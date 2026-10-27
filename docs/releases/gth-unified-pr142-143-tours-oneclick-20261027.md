# GTH PRO unified PR #142–#143 + Tours first-click
27 October 2026. **DRAFT. DO NOT MERGE / DEPLOY.**

## Inclusion
- Retain all #143 hybrid Real Estate files and its additive SQL migration, approved-photo safeguards, current filters, tests and central global theme unchanged.
- Take exactly #142 independent Nuitee hotel fallback implementation in `src/app/hotels/stay/[id]/page.tsx` and `src/lib/travel/hotel-provider-search.ts`, plus five matching hotel/Travel tests. The old fallback must not represent Booking.com as an approved affiliate or suggest a guaranteed exact hotel match. Verified exact-property links remain unaffected.
- Do not overwrite newer #143 Real Estate files with obsolete #142 revisions. #142 legacy presentation test assumes an older card implementation and is superseded by #143's hybrid-photo tests; #142 travel navigation test overlaps #143 and is left on the newer version.
- New first-submit Tours handler parses and validates submitted city/category, opens Klook search in a separate tab on user gesture and leaves the native GET form to navigate to local `#discover` verified filtered tour cards. Tours no longer displays a second in-form Klook CTA; Activities retains its existing action. Browsers can block new tabs, but local search still works.
- Only changes are Nuitee fallback, Tours handler, tests, release note and preview-disabling config. No CSS, provider keys, service-role data, fabricated product links or DB writes.

## Required gates before a single production merge
1. Exact-head unified CI tests, Next production build, strict types, Real Estate security and migration tests.
2. Production Supabase live schema/RLS checks, review and safe activation of additive hybrid migration, authenticated and anonymous smoke checks; previous linked project reads timed out.
3. Manual or automated browser Tours London first click, filtered cards, Klook new-tab handoff, mobile/day/night, and Nuitee booking screen; a popup blocker may restrict a new tab.
4. Confirm final diff and one authorized main merge only; verify Git-source Vercel production READY/aliases afterward. No per-PR merge/deploy or preview branch deploy.

## Release validation resumed — 27 October 2026

This section supersedes the earlier timeout/prerequisite blockers above. Production schema inspection now succeeds, and the three required claim/media/hybrid migrations are active. The current owner instruction authorizes completing this release through one final Git merge after checks.

A fresh live permission audit found that `listing_submissions` allowed authenticated INSERT on only the original seven text fields. Consequently the inventory/rights fields sent by the existing form would fail despite correct ownership RLS. Added `20261027063921_hybrid_portal_permissions.sql` to grant only the 21 accepted form columns; ownership, status, property publication and review fields remain non-insertable. Existing owner-only pending-submission policy is retained. The same migration enables `cities` RLS, preserves public SELECT, revokes public mutations, preserves trusted service-role grants, and explicitly binds the claim-media policy to the outer media project ID. The existing validation trigger remains unchanged.

The permissions migration was applied successfully to the connected production project and recorded as version `20261027064211` / `hybrid_portal_permissions`. SQL verification under actual `anon` and `authenticated` roles confirms:

- Public city reads work; INSERT/UPDATE/DELETE/TRUNCATE privileges are false for both public roles.
- All 21 form columns are insertable for authenticated callers; owner/status/review fields are not.
- An unauthenticated authenticated-role session sees zero private submissions.
- Hybrid search is executable by both roles, returning a successful empty result; public callers cannot execute the photo-publication procedure.
- Anonymous REST reads of allowed published-media metadata succeed. Private publication notes and private project-claim rows are denied. Public city REST reads succeed.
- The `cities` RLS-disabled ERROR no longer appears in fresh security advisors. Existing non-blocking warnings remain, including intentionally guarded moderation functions; this is not a claim that every historic advisory is resolved.

The complete existing claim/media and hybrid SQL assertions plus new submission/permission regressions pass in isolated PostgreSQL. Added the new permission migration/assertions to the disposable PostgreSQL 17 CI workflow. Local strict TypeScript, ESLint, 536 JS/TS tests and the real-public-configuration 139-route production build pass. Live-connected local-browser checks at 390/1440 px in both day/night modes confirm empty marketplace handling, Rent search, 35 real registry rows on each of the first two pages, and no page overflow. Additional final Tours/hotel checks and exact-head remote CI are recorded in the PR description before merge.

A fresh actual SQL aggregate found 12,587 total project records: 11,747 `registry`, 812 `rera`, 28 `manual`. These are source-type counts, not an independently certified total of all MahaRERA projects. There are zero published sale/rent inventory rows and zero public approved-photo rows at this checkpoint. The marketplace deliberately shows its honest empty state; no registry row is fabricated into an offer or given a substitute photograph.

### Migration version mapping

| Source SQL version | Recorded production version | Name |
| --- | --- | --- |
| 20261020091500 | 20261027053650 | re_master_98_project_media_claims |
| 20261020123000 | 20261027053703 | re_07_09_media_candidate_publication |
| 20261026224030 | 20261027053715 | hybrid_real_estate_portal |
| 20261027063921 | 20261027064211 | hybrid_portal_permissions |

These SQL files have already been activated. The Git/Vercel site release does not run a production migration runner. Do not replay non-idempotent source SQL through a future file-based migration runner until its migration bookkeeping is reconciled against this mapping. No record import, deletion, auto-approval, fabricated stock photo, or independent source-PR deployment forms part of this release. Physical-device and signed-in administrator/photo-publication operations have not been claimed tested; owner/admin identity checks are covered by isolated SQL/route regressions and live read-only privilege checks.
