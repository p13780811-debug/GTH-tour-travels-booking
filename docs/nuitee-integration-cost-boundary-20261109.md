# Nuitee integration: existing free surface and API cost boundary

Owner constraint: use the available free integration scope; do not introduce paid API hits. The owner reports completing Nuitee White Label production activation on 9 November 2026. Prior dashboard screenshots were Sandbox; that environment issue was external to the GTH iframe's browser-security `sandbox` attribute. Production status is owner-confirmed, not an independently performed reservation.

## Implemented capabilities — reuse, do not duplicate

| Capability | Existing implementation | New direct private Nuitee REST calls |
| --- | --- | --- |
| Worldwide destination, dates, guests and room search | Official public SearchBar in `HotelBookingExperience.tsx` | None |
| Hotel photographs and supplier hotel links | Official HotelsList in `NuiteeHotelsListWidget.tsx`; one selected city list | None |
| Hotel details, amenities, room options, final price/cancellation and provider checkout | Existing `gthproglobal.nuitee.link` White Label; desktop results/full-window link and mobile same-tab handoff | None |
| Exact stay deep links | Existing `hotel-whitelabel.ts` / `/api/hotels/booking`; strict destination/hotel/date/occupancy/currency allowlist, room expansion and child ages retained | None; the GTH endpoint only validates and redirects |
| Country/city/airport reference discovery | Existing static, verified `airportReference*.ts`, `nuiteeAirportIndex.ts` and `/travel/airports` | None at runtime |
| Eighteen city guides and source-backed directory | Existing local editorial markets and GTH/OSM directory routes | No Nuitee REST calls; existing Supabase directory operations are a separate existing dependency |

The hotel landing is upgraded around these existing integrations. A second catalogue API or locally invented hotel/rate is unnecessary. Browser acceptance observes zero `/api/hotels` directory calls on the default booking landing. Supplier SDK requests are handled by the SDK; their commercial entitlement remains governed by the account's White Label terms.

## Charges are not assumed away

The repository's 5 November audit records the official pricing and access documentation:

- https://docs.liteapi.travel/reference/api-pricing-usage-costs
- https://docs.liteapi.travel/docs/deeplinking-to-whitelabel
- https://docs.liteapi.travel/docs/getting-access-to-flights
- https://docs.liteapi.travel/docs/getting-access-to-experiences

That prior audit identifies charges/conditions for Places, Price Index, flight search ratios, ticketing and modifications. It also distinguishes production authorization for Flights and Experiences from merely seeing an endpoint in a catalogue. These historical observations are not a fresh verification of the owner's current commercial agreement.

Current official-document fetches return CONNECT/HTTP 403 in this workspace, including after network permission was granted. The Companion page supplied no document text. Current pricing, any free allowance and the account's exact entitlements therefore cannot be independently re-verified here. The owner has been asked for the public pricing/free-usage text. No new REST endpoint is enabled while that information is missing.

- No supplier private API credential is introduced or read by the GTH production source.
- No direct REST hotel-rate, Places, Price Index, prebook, booking, payment, modification, cancellation, flight or experience request is added.
- No live chargeable probe, booking/payment verification, paid add-on activation, API-key change or subscription change is performed.
- `tests/nuitee-free-usage-boundary.test.mjs` scans production source ASTs for private LiteAPI REST endpoints and supplier credential lookups. It is a regression boundary for GTH code, not a claim about all activity or costs inside external supplier widgets.

If the current documentation confirms an additional free reference endpoint and the account has that entitlement, review that exact endpoint separately: allowlist the host/fields, bound rows/timeouts and refresh frequency, retain reference data outside visitor-triggered calls, and avoid country-by-country fan-out. Do not expose private keys in client bundles or describe a fair-use allowance as unlimited free use.
