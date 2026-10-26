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
