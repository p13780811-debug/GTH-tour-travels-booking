# Connected Travel: Hotels, Flights and Experiences

Baseline: `main` at `b514a681de7fdda24a21245d8cbfac485b9ad4c3`.

The existing `/travel` directory becomes a trip workspace. Its Hotels, Flights
and Experiences tabs share an explicitly applied country, city and dates.
Hotel room preferences and the supported nine hotel currencies travel with
real Nuitee property IDs. Flight airport/date searches use the existing public
Aviasales handoff. Activity discovery preserves the selected city/currency and
all existing partners. Every service directory link remains available.

The owner verified the Nuitee White Label's Stays and Flights tabs at
`https://hotel.gthproglobal.com`. Both the workspace and existing `/flights`
page offer that shared entry and explicitly tell visitors to select Flights
there. No selected-flight pathname, flight offer or checkout URL is invented.
The owner also supplied the Experiences layout settings, but these do not
establish a public selected-experience URL or bookable offer. Existing activity
providers remain the working experience path; the shared booking site is an
additional generic option.

## Cost and supplier boundaries

- No new private Nuitee API endpoint, flight fare request, prebooking, booking,
  payment, paid Places/Price Index request or optional dashboard add-on.
- Hotels reuse the existing cached, budgeted free content endpoint. Profiles
  are not room availability or cached rate promises. The SDK mounts only when
  the visitor explicitly opens advanced hotel search.
- No Supabase writes, tables, migrations or new database queries. Trip context
  is validated URL state with no customer account, contact or payment details.
- Aviasales's original search/results component remains byte-for-byte unchanged
  on `/flights`. The hub uses public route handoff to avoid a second vendor
  instance and global-style or module-remount interference.
- Nuitee's flight API ticketing, modification and excessive search fees are
  described in its pricing terms; no direct flight REST integration is enabled.
  The White Label remains subject to the owner's supplier commercial agreement.
- Provider-managed passenger/cabin/currency and visit-date confirmation are
  stated explicitly; hotel guests are never misrepresented as flight passengers.

## Styling and accessibility

Scoped navy/gold tab accents and existing day/night tokens; opaque select
options; native date controls use the dark color scheme at night. Keyboard
tabs support arrows/Home/End, selected state and associated panels. Controls
have labels, visible focus and at least 44px targets. City/country, date,
room/child-age and currency validation stops malformed handoffs. Errors are
announced and unapplied drafts do not replace the active trip.

The provider-hosted White Label does not inherit GTH's stylesheet. Owner
screenshots confirm provider Appearance controls for primary color, font,
corners and images; arbitrary Custom CSS support has not been verified. No
provider dashboard setting is modified by this release.

## Validation and release

`tests/connected-travel.test.mjs` checks validation, context round trips, exact
property/date/room handoff, public flight routes and the paid API boundary.
`scripts/qa-connected-travel.mjs` exercises real Next pages at 320, 390, 768
and 1440px in day/night with explicit local hotel/SDK fixtures. It verifies
hotel dates/currency, destination application/reload, keyboard tabs, experience
city links, opaque dropdowns, no overflow, invalid drafts, on-demand hotel SDK
and the unchanged Aviasales widget on `/flights`. Fixtures never make a real
booking, supplier search, payment or production database call.

The release guard restricts changes to this feature and verifies the existing
fare builder, Flights page extension and Vercel policy. Homepage, mega
aggregator, native app, existing hotel/flight engines, shared CSS/navigation,
Real Estate, Tender, SEO inventory and database/security settings are preserved.
The work branch has Vercel deployment disabled. Release uses the existing
one-shot main deployment after exact-head checks; no manual extra deployment.

Local verification: 784/784 tests, TypeScript, lint, CSS scope protection and
production build passed. The connected workspace passed eight viewport/theme
browser scenarios; existing Hotels passed ten viewport/theme scenarios plus
mobile/desktop booking handoff, geographic/currency caching and supplier
failure/retry checks. Browser evidence is explicitly fixture-only. Cloud QA
rebuilds the final commit with the original production fonts before release.

## Owner-requested visual and action-label follow-up

The follow-up replaces the initial hub presentation with a compact editorial
hero, photo collage, search-first product tabs and mode-specific forms. Light
tabs use a white surface with navy text; dark tabs use a raised navy surface
with readable text and a gold indicator. They no longer share the same fixed
gold gradient. All new control styles are scoped to the workspace.

Flights now has an immediately usable airport suggestion form, keyboard
selection, swap, one-way/round-trip dates and a real public route-search link.
It uses the existing route/date builder; no flight fare or ticketing API is
called. Destination-photo cards prepare a route without inventing fares.

Experiences has real product-photo cards from the existing free public
catalogue and distinctly labelled destination collections. The catalogue is
bounded to six cards, coalesced, cached for 24 hours and has an outage cooldown.
It adds no Supabase query. Supplier-listed prices are explicitly in USD with
current price/date confirmation at booking. A missing feed never manufactures
products or prices. An independent visit date does not overwrite hotel checkout
or a flight return date. No Nuitee Experiences checkout URL is guessed.

The owner also requested neutral action labels throughout existing travel
surfaces. `scripts/travel-action-copy.json` records exact text substitutions in
22 files, including supplier search, hotel detail, tours, transport, promotion
and marketplace actions. These are copy-only changes: an executable guard and
regression test compare every file with its original contents and retain every
provider URL, tracking parameter and booking handler. Existing shared CSS,
supplier logic, SEO, database/security and ecosystem layouts remain intact.
Provider-owned hosted screens and widget attribution are not rewritten.

Performance refinement: `/travel` is statically prerendered for CDN serving.
Preferences hydrate from the URL in the browser; switching product tabs uses
local history and does not request a server render. Opened discovery panels
remain mounted, so revisiting Hotels does not repeat its metadata request.
Worldwide hotel SDK frames close when leaving Hotels. Experience cards load
only when their tab opens through a public, fixed-purpose CDN-cached endpoint;
successful catalogues have a 24-hour shared cache, failures a short cache,
and the browser coalesces repeated reads. Internal links disable speculative
prefetching in this hub. There is no new Supabase read or private supplier API.
