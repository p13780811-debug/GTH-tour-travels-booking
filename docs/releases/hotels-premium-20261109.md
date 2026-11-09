# Hotels search-first premium landing and Tender dropdown repair

Baseline: `5d198ab775e5dd44f92f4d8f721a87728e7e06bd`.

The existing hotel landing separated the booking search from its hero, presented destination inspiration as cards without actions, and placed two already-connected Nuitee supplier lists after the page content. The upgrade puts the existing search inside a compact hero and moves the existing supplier hotel discovery before destination inspiration. It adds no hotel-data API, catalogue query, database change or fabricated inventory.

## Existing features retained

- The original isolated Nuitee SearchBar, destination/date/room/child-age validation, mobile full-window booking, desktop embedded results, invalid-link recovery, retry, theme propagation and secure-site escape link are byte-identical.
- Hotel directory search, country/type/source filters, pagination, partner mappings, exact hotel detail/partner routes, SEO and 18 city guides remain implemented through their existing files.
- The free property-listing workflow remains linked. OpenStreetMap records are still directory records, separate from supplier room availability.
- Homepage, shared CSS/navigation, Flights, Real Estate, native app, OSM SEO, Tender data/security and secrets are unchanged by the hotel commit. Original pending local hotel work in the older checkout is untouched.

## Files and visible differences

| File | Change and dependency |
| --- | --- |
| `src/app/hotels/page.tsx` | Existing booking widget moves into the hero with an accessible booking/directory segmented control. Supplier discovery precedes inspiration. Six existing city photographs become links to existing city guides. Native expandable location/price/cancellation guidance and the existing host-listing link provide useful next steps. Directory logic is retained. |
| `src/app/hotels/HotelsLanding.module.css` | Scoped day/night typography, desktop destination photograph, mobile spacing, two/three-column destination grid, keyboard outlines and reduced-motion behavior. Native directory options receive opaque theme-matched text/background. No global CSS override. |
| `src/app/hotels/layout.tsx` | Retains metadata; discovery is now positioned by the landing page rather than appended outside it. Other hotel routes still receive no discovery widget. |
| `src/components/hotel/NuiteeHotelOffers.tsx` | Reuses the original Nuitee HotelsList adapter and both original place IDs. A native-button Mumbai/London selector mounts one supplier list at a time. All 18 guide links remain under an expandable section. No additional Supabase reads. Existing reusable free directory cards are unchanged. |
| `src/components/hotel/NuiteeHotelsListWidget.tsx`, `.module.css`, `nuitee-widget-theme.ts` | A bounded, animation-frame-coalesced observer adapts actual neutral vendor surfaces, text and borders to existing theme tokens, including async cards and theme toggles. It does not depend on undocumented class names. Coloured rating badges and image-overlay palettes remain supplier-owned; no prices, URLs, identifiers, click handlers or sandbox banners are changed. Widget initialization options and supplier domain remain the same. |
| `src/app/tender/layout.tsx`, `TenderForms.module.css` | Follow-up `58aa7ef` supplies an opaque option surface and explicit light/dark native control scheme across Tender pages. Shared ecosystem CSS is preserved. |
| `scripts/qa-hotel-landing.mjs`, `check-hotel-landing-boundaries.mjs`, `.github/workflows/gth-hotel-landing-qa.yml` | Actual Next/browser acceptance with explicit isolated supplier/catalogue fixtures; exact protected-file boundary. Uses the existing preview-disabled hotel branch and existing main deployment integration. |
| `tests/nuitee-hotel-discovery-seo.test.mjs` | Updates the prior placement expectation to search → existing supplier discovery → inspiration; original supplier and source-integrity checks remain. |

## Verification and practical limits

- All **766 website regressions**, lint, strict production build/type validation, existing CSS guard, protected boundary and first-server-HTML check pass locally.
- Browser checks: **320, 390, 430, 768 and 1440 px**, day/night; no horizontal overflow; one search initialization; one selected supplier list; switching Mumbai/London and booking/directory; working guide URLs; expandable price guidance; day/night propagation into the isolated search document.
- On the local SDK layout fixture, the phone search action ends at **623 px** (320 width) or **600 px** (390/430 width). These are fixture measurements, not a physical-device guarantee about the external supplier SDK.
- Existing mobile handoff preserves travel dates, two rooms and a child's age. Existing desktop embedded results and full-window link remain available. SDK failure shows the existing recovery/secure-site links; search retry succeeds when the fixture transport recovers.
- The default booking landing issues **zero `/api/hotels` directory requests** in browser acceptance. Lists go through the existing Nuitee SDK; changing city mounts only the chosen list. Country/category directory views retain their original bounded API and rate/caching behavior, which this presentation change does not modify.
- Tender repair: 32 actual browser scenarios verify >=4.5:1 unselected-option contrast, opaque option backgrounds, day/night control schemes, keyboard selection, country submission, theme switching and forced-colors behavior. Exact-head cloud run for `58aa7ef` succeeded: https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/42539673721 . Native OS popup chrome itself is not captured by headless screenshots.
- The workspace tunnel returns 403 for the live site and official SDK download. Browser acceptance therefore uses explicit supplier fixtures; test hotel cards are labelled QA data. No production inventory, live rate, reservation, payment or Windows-device test is claimed. Final cloud build uses original fonts and isolated database fixtures.
- Owner screenshots show white SDK cards with inherited light headings and a **"Sandbox mode: test data only, no real transactions"** banner on the supplier's own `gthproglobal.nuitee.link` detail page. Later screenshots of `partners.wlbl.cloud` dashboard and configuration confirm that the provider account/session itself is currently in Sandbox. The visual repair tests that exact white-surface/light-heading/black-price conflict with unknown fixture classes, rather than using already-themed mock cards; themed text, prices and backgrounds match, and coloured badges stay unchanged. Source code supplies no sandbox mode flag or catalogue API key. The iframe HTML `sandbox` attribute is browser isolation, unrelated to the supplier booking environment. Supplier production activation is an unresolved external dependency: no Nuitee account-control tool is exposed here, and the activation control is not visible in the screenshots. The owner has been asked for its exact button/message text. No fake production switch or banner hiding is implemented. This visual release does not claim production-ready supplier bookings.

## Unnecessary or duplicate work avoided

No replacement search engine, second supplier integration, extra landing catalogue scan, guessed hotel/deep link, fake price/rating/review, separate payment form, database migration or shared theme redesign. Existing supplier cards were repositioned rather than rebuilt. No manual production deployment; release uses one tested normal main update through the existing integration.
