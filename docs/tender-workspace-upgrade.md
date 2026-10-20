# Tender discovery and preparation upgrade — 2026-10-20

Continues the existing GTH PRO `/tender` vertical and its existing public Supabase catalog, official-source importers, guided assistant and private bid-workspace API. No new site, database schema, source approval, credential, paid service or government submission integration is introduced.

## Visitor flows

- Country-first / nearby discovery, explicit worldwide search, all five procurement categories, language selection, closing date, closing-in-seven-days filter, sorting and server pagination remain intact. The seven-day choice now appears in the actual search form and active filters can be removed individually. Pagination retains the resolved country.
- Compact discovery hero, actionable workflow links, existing global inputs and buttons. Main and detail headings use 2xl/3xl sizes. Mobile layouts stack cards and fields; comparison scrolls inside its own accessible region.
- Save up to 40 notice IDs, select up to three for comparison, and retain up to eight canonical internal search URLs on this browser. No business profile, bidder document or private draft is placed into this discovery storage. Clear per-item choices with Save/Unsave, Compare, or Remove saved search.
- `/tender/saved` re-reads current public notices through the existing public detail API with concurrency limited to four. Closed/private/withdrawn notices are not reconstructed from cached metadata. Temporary errors retain the saved ID with a retry action. Comparison includes buyer, country/region, category, exact UTC deadline, original-currency estimated value, source, reference and qualification-review status. Values are not ranked or converted across currencies.
- Download a CSV of the current result page or selected workspace view. Spreadsheet formula-leading strings are escaped. No estimated contract value is called a bid price or converted into a guaranteed award value.
- Download an `.ics` deadline reminder using the shared calendar generator. It retains the complete HTTPS official source URL in both the description and event URL, with RFC 5545 UTF-8 line folding. Calendar import is a user action; no email-alert or connected calendar subscription is claimed.
- Detail pages expose full UTC date **and time**, publication date, source reference, estimated value, qualification-review state, Save/Compare and preparation actions. Existing original-document links, document staging/checklists, attendance review and seven-step assistant remain available.
- Existing optional Gemini extraction/coaching stays consent-gated. Guidance now receives the recorded UTC deadline snapshot with an explicit official-recheck note, rather than omitting it and reporting it missing. Pre-bid/clarification dates are never inferred from the submission deadline. The assistant retains owner-authenticated private save/resume and editable draft generation/download. Discovery shortcuts do not bypass any validation, RLS, consent or source-review requirement.

## Central styling and scope

All Tender action buttons reuse `gth-btn` / `gth-btn-gold`; the discovery form reuses `gth-input`. No local stylesheet, inline button appearance, global CSS edit, new theme, navigation/footer/policy edit, Real Estate edit or database write is part of this upgrade. Existing token-based card layouts and day/night colors are retained. Preparation checklist labels remain checkboxes, with normal accessible semantics.

## Security and verification

`tests/tender-discovery-workspace.test.mjs` checks malformed/oversized browser state, version and UUID boundaries, comparison limits, canonical safe search URLs, hostile/duplicate saved searches, CSV formula protection, currency honesty, blocked storage, storage quota failure, clearing data and concurrent mounted-card updates. Existing tender tests cover source/public/deadline filtering, geography, eligibility, preparation state, authenticated private drafts and source revisions.

Production read-only audit at implementation: 552 total tender rows, 523 current public notices in 62 countries; nine current India notices. Anonymous RLS query independently returned 523 rows, all published/public/source-verified and future-dated. These are time-sensitive audit counts, not fixed UI metrics or independent eligibility certifications.

Run `npx tsc --noEmit`, `npm run lint`, `npm run test:security`, and `npm run build`. Local production build needs the existing public Supabase URL/key environment, as other pre-existing ecosystem routes instantiate their clients during collection. Do not print or commit environment values. No service-role credential is needed for this feature.

The managed local preview supervisor passes Vite-specific flags to `next dev` and cannot currently serve this existing Next.js project. Do not alter the working project/framework to compensate. Browser checks use the released website. The available browser does not support viewport resizing; actual phone-width visual QA remains unverified. Responsive source review is separate from a device test.

### Production browser checks — 2026-10-20

PR #118 released as main `429154a65adba04c929d1eae04a0840f643edcae`, with the exact CI-tested tree `af9808f6365a5a6cde11b27fee10695fb5eb9dfc`. Vercel deployment `dpl_3eV3siN32V6gxJXBz6P1w1KHediw` reached READY and was aliased to the existing custom domain. Both required PR workflows passed, including 413 Node tests, types, lint and production builds.

Live checks confirmed keyword search, clearing filters, the seven-day selector, shortlist and saved-search persistence across reload, two-record comparison with full UTC deadlines, current-record saved view, CSV export (two records with source references), calendar download, detail-to-assistant prefilling, optional consented AI coaching with the recorded deadline, and editable local draft generation/text download. Only public notice details and a generic question were used for AI testing; no bidder identity, confidential fields, sign-in email, bid submission or database test record was sent. Authenticated private save/resume was not exercised with a user account.

The calendar download exposed an existing 180-character description truncation that cut the official source URL. The follow-up correction preserves the full bounded HTTPS URL, rejects credentials/control-character injection, and folds lines at 75 UTF-8 octets. Five regression tests cover the observed long-URL failure, Unicode folding, UTC deadlines, unsafe inputs and expired/invalid dates.

Second-page testing also reproduced a pre-existing country-first pagination bug: when the home group contained fewer than 12 notices, its second-page offset triggered PostgREST `PGRST103` before nearby rows were loaded. Local discovery now counts the public home/nearby groups before requesting bounded row ranges, skipping exhausted groups. Explicit worldwide out-of-range pages recover the exact public count and return an empty page. Three regression tests use realistic PostgREST 416 behavior and cover exhausted/empty home groups, no duplicates across the boundary, and out-of-range local/world pages.

## Release

The Tender feature and calendar-correction branches have automatic Vercel previews disabled to conserve the user's deployment quota. Keep existing unrelated draft PRs and their release holds unchanged. Main merges deploy automatically; verify each released SHA reaches READY on the GTH PRO custom domain. No manual Vercel deployment or hosting-plan change is required.
