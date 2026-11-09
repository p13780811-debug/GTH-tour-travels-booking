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
