# GTH PRO Hotels — premium landing, local discovery and verified White Label handoff

Baseline: `5d198ab775e5dd44f92f4d8f721a87728e7e06bd`. Owner-confirmed Production/DNS and live custom White Label: **https://hotel.gthproglobal.com**, singular `hotel`.

## Latest inventory/PR audit

Remote main was inspected directly and still points to the baseline. Latest hotel **PR #181**, head `42c7141a73131b42a02e1be2d530ef676d813da0`, fixes SearchBar stylesheet precedence and dark theme; it does not add a new booking provider or private REST integration. Its actual five-commit history is merged into this candidate. Its two `:is(...)` selector lists fail the existing comma-based scope checker; equivalent fully scoped selectors are expanded to satisfy the unchanged checker. A dedicated boundary guard requires the remaining global CSS to match that reviewed PR exactly. The old plural-domain DNS note in that draft is superseded by the owner's verified singular live domain.

## Existing features retained

Original hotel directory filters/paging, source attribution, approved partner mappings, hotel detail routes, 18 city guides and SEO stay implemented. Nuitee SearchBar isolation, validated dates/rooms/child ages, mobile full-window handoff, desktop results, retry and secure-site links remain. App callers retain the default INR contract. Homepage/navigation, Flights, Real Estate, Tender data/security, app/OSM inventory and existing SQL/RLS are unchanged. No database, secret or DNS changes are performed. The original older checkout's pending hotel work is untouched.

## Exact files and visible changes

| Files | Result / dependencies |
| --- | --- |
| `src/app/hotels/page.tsx`, `HotelsLanding.module.css`, `layout.tsx` | Compact premium hero contains the existing booking search and mode controls; theme-aware typography and existing destination imagery; actionable guide cards; useful expandable location/total-price/cancellation guidance and existing free property-listing link. Supplier discovery precedes destination inspiration. |
| `src/components/hotel/NuiteeHotelOffers.tsx`, `HotelsDiscoveryPlacement.tsx` | Existing supplier content reused; one Mumbai/London list at a time, country preference where applicable, all city guides retained; no duplicate integration. |
| `src/components/hotel/NuiteeHotelsListWidget.tsx`, `.module.css`, `nuitee-widget-theme.ts` | Neutral vendor surfaces/text/borders follow GTH day/night tokens, including asynchronously injected content. Supplier coloured badges, imagery, identifiers, URLs and click behavior are preserved. No guessed vendor class names or sandbox-banner hiding. |
| `src/app/globals.css`, `HotelBookingExperience.tsx`, `tests/hotels-mobile-whitelabel-width.test.mjs` | Incorporates PR #181's hotel-only scoped SearchBar repair and stylesheet precedence; existing core theme and checker remain protected. Search accepts the selected validated currency; app defaults are preserved. |
| `HotelCurrencySelector.tsx`, `src/lib/travel/hotel-currency.ts`, `nuitee-free-currencies.ts`, `src/app/api/hotels/reference/currencies/route.ts` | Nine-currency UI with free daily-cached reference names and a safe local fallback; fixed server-only metadata GET, no private key in the browser. |
| `NearbyHotelDiscovery.tsx`, `src/lib/travel/hotel-audience.ts`, `nuitee-free-hotels.ts`, `src/app/api/hotels/discovery/route.ts` | Visitor city/nearby profiles → country profiles → worldwide options. Manual country/city override, staged reveal and bounded paging. Country/city-verified supplier property IDs open their exact White Label pages. Availability/prices are checked with the provider for actual dates; no fake rates/reviews. |
| `src/lib/travel/hotel-whitelabel.ts`, `hotel-provider-search.ts`, `src/app/hotels/explore/[slug]/page.tsx` | All hotel handoffs align with the owner's exact singular custom domain. No arbitrary target, fabricated hotel match or DNS mutation. |
| `src/lib/travel/nuitee-read-budget.ts`, `src/lib/security/rate-limit.ts` | One new cache-fill budget reuses existing Upstash. Existing policies remain byte-identical. No new paid service/Supabase load. |
| `src/app/tender/layout.tsx`, `TenderForms.module.css` | Opaque native option surfaces and explicit light/dark control schemes fix the reported white-on-white Tender dropdown. No shared ecosystem styling override. |
| `scripts/check-hotel-landing-boundaries.mjs`, `qa-hotel-landing.mjs`, `qa-nuitee-free-reference.mjs`, related hotel/cost tests, `.github/workflows/gth-hotel-landing-qa.yml` | Scoped regression, actual Next HTTP/browser journeys and fully isolated free-endpoint fixtures; existing preview-disabled review branch and main deployment strategy. |

## Accessibility / mobile requirements

320/390/430/768/1440 widths, readable day/night text and native menus, visible keyboard focus, native buttons/select/details, 44px main actions and reduced-motion destination cards. Search remains inside the hero. Country/city controls stack on phones. Geo-IP is a coarse hint; missing city falls back to country and unknown location to explicit choice. No GPS prompt or persistent visitor location record.

## Evidence and practical limits

- Local production build, lint, strict types, existing CSS scope checker and exact boundary check pass. The combined regression suite currently passes **779 tests**.
- Actual Next/browser acceptance passes all ten viewport/theme combinations: search visible, no overflow, one search initialization and selected supplier list, themes, manual country/city override, city-first order, country fallback and private/public cache isolation, USD selection, mobile dates/two rooms/child-age preservation, desktop embedded results and failure/retry.
- Forty warm currency views and forty warm personalized hotel views each produce **0 additional upstream API calls**. The default booking landing produces zero directory API requests; new free-content features use no Supabase operations.
- Local fixture search actions end at 679px (320) or 656px (390/430); these are fixture measurements, not a physical-device claim about the external SDK.
- Supplier fixtures intentionally reproduce white vendor surfaces, inherited light titles and black prices; repaired text/surfaces match GTH theme while green badges remain unchanged. Fixtures do not prove live room availability or completed reservations.
- The Tender repair separately passed 32 contrast/native-control scenarios, including >=4.5:1 option contrast, opaque backgrounds, keyboard selection, country submission, theme changes and forced-colors. Native OS popup chrome is not captured by headless screenshots.
- Direct official/live host access remains unavailable from the workspace proxy. Account/domain Production is owner-confirmed; no actual reservation/payment was made. Cloud verification uses original fonts and isolated source/auth/reference fixtures.
- Free nearby REST profiles require server-only `NUITEE_PRODUCTION_API_KEY` in Vercel Production. No key was copied from old Preview sandbox variables. If absent/unavailable, public White Label search remains usable and local previews report unavailable rather than guessing. Current private credential configuration is not independently inspected.
- Profile/cache TTL is 24 hours; live rates are never cached as static content. Page size 24, maximum page 100. This is bounded discovery, not exhaustive global inventory coverage. The existing supplier can verify a selected hotel's current room options.

See [free usage and request budget](../nuitee-integration-cost-boundary-20261109.md) for exact paid exclusions and fallback limits. No replacement supplier engine, fake prices, duplicated city pages, giant catalogue import, new SQL, paid Places lookup, Price Index, private booking/payment API or dashboard add-on. Release remains one tested normal main update through existing Git integration; no manual Vercel production deployment.
