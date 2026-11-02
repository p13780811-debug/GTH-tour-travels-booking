# GTH PRO Travel — destination navigation and Nuitee Connect readiness (2026-11-02)

## Isolated scope — no production deployment
This change fixes previously general/no-op destination actions on **existing pages**. It does not replace the global GTH PRO CSS, current hotel Whitelabel, Aviasales/Travelpayouts flight supplier, Tours/Activities partners, tender/real-estate, or production API credentials.

## Destination navigation contract
- On both destination directory cards and the individual destination guide, **Hotels** opens the existing city/destination-filtered hotel directory or its original results page.
- **Tours and Activities** send a validated city **display name** (e.g. `New York`), not a slug (`new-york`) to their existing `?city=...#discover` searches.
- **Flights** opens the existing first-party flight search route with `destinationCity` and, **only** for the names in `src/data/flight/destinations.ts`, a curated IATA destination code. It deliberately does not fake an origin airport, travel date, fare, provider selection, or populated supplier widget.
- The Flights page validates the optional display name and tells users to choose actual airports/dates with the existing provider.
- Existing `Hotels`, `Tours` and `Flights` service sources and explicit booking/provider handoffs are preserved.

## Nuitee Connect three-product audit — public documentation, NOT account activation
- **Hotels**: the existing official `gthproglobal.nuitee.link` Whitelabel flow and GTH PRO hotel search stay unchanged. Previous sandbox search/prebook evidence is **not** live production booking proof.
- **Flights**: Nuitee Connect now documents Flights search, pricing, seat/baggage selection and booking. The same API key scheme can be used **if Flights access is enabled**. Sandbox data is limited and not representative of live inventory. Production Flights and Whitelabel Flights require explicit separate approval. There is no authenticated evidence this account has that approval.
- **Experiences**: Nuitee Connect documents tours/activities search, details, live dates/slots, booking options, prebook, Stripe payment and booking. It also requires Experiences activation, production approval and **separate Whitelabel enablement**. There is no authenticated evidence GTH PRO has this approval.
- **Do not route visitors to Nuitee Flights or Experiences** until access, provider contract, checkout behavior and permitted branding are verified. Preserve existing Aviasales and Klook/other approved tours handoffs.
- **Do not commit** `sand_...`, `prod_...`, or any provider keys to GitHub, `NEXT_PUBLIC_*`, client JS, scripts or test snapshots. If API integration later approved, keep keys and privileged booking/payment operations server-side and perform exact-provider read-only/sandbox tests first.

### Official docs
- Flights access: https://docs.liteapi.travel/docs/getting-access-to-flights
- Experiences access: https://docs.liteapi.travel/docs/getting-access-to-experiences
- Experiences end-to-end flow: https://docs.liteapi.travel/docs/build-an-experiences-booking-flow
- Whitelabel configuration: https://docs.liteapi.travel/docs/configuring-your-liteapi-powered-white-label-booking-site

### Request Assistance message to submit in Nuitee Connect dashboard
Subject: GTH PRO — enable Flights and Experiences (sandbox, production evaluation and Whitelabel)

We operate GTH PRO (https://www.gthproglobal.com/), a Travel/Real Estate/Tender discovery platform, with an existing Nuitee hotel Whitelabel: https://gthproglobal.nuitee.link/.

Please confirm the enabled products and commercial terms on our Nuitee Connect account and request:
1. Flights sandbox endpoint access and recommended Nuitee Air E2E test credentials/data; guidance for production review and enablement.
2. Flights on our existing Whitelabel, including any route/deeplink, supplier checkout and branding configuration requirements.
3. Experiences sandbox search and booking-flow access; production approval criteria.
4. Experiences on our existing Whitelabel, including destination/product search, booking/Stripe flow, cancellations and callback support.
5. API limits, fees, partner payout obligations, activation prerequisites, scope restrictions and allowed environment separation.

We will not claim production bookability or substitute sandbox data for current offers. Please share the specific next steps for both products.

## QA and release
Run the isolated destination routing tests and the existing Travel, property and global-theme CI before merge. Test mobile links for Mumbai, Goa, Dubai, Paris and multiword destination names. **Do not merge into main or trigger production deployment without separate owner approval.**

## Owner-approved commercial architecture: discovery on GTH PRO, checkout at partner

**Merchant of Record / payment:** GTH PRO currently intends to be a discovery and affiliate referral platform, **not** a merchant of record. Guest card capture, payment gateway, payment confirmation, final booking, refund processing and primary post-booking support must remain with the approved supplier/Whitelabel. Do not add an owner-side payment gateway, store card details, create bookings using GTH PRO's payment account, or claim on-site booking confirmation.

**GTH side:** destination, hotel, room and rate browsing; city filters, dates, occupancy and source-backed information; user clicks **Continue to partner checkout**. Display the correct final merchant name and disclose handoff clearly. Do not mark something bookable without its verified supplier entitlement.

**Nuitee hotel Whitelabel:** Nuitee documents the direct `/booking?offerId=...` handoff (and optionally `prebookId`) for a genuine returned live hotel rate. In that mode Nuitee performs prebook/rate revalidation and handles Whitelabel checkout; no fabricated offerIds. Its Whitelabel documentation says Nuitee handles guest payments and booking logistics and defaults to Nuitee guest support. Exact availability and checkout must be tested with approved production access, and the Whitelabel URL must be allowlisted. When no exact supplier rate exists, fall back to honest Nuitee destination search, **not** a guessed hotel or room match.

**Flights and Experiences:** Do not assume the hotel's checkout deep-link API also works for flights/tours. Their Whitelabel products require individual account enablement and approval; until confirmed, retain the existing Aviasales flight handoff and approved partner tour/activities handoff. Do not introduce local checkout merely because their APIs expose prebook and payment SDKs.

**Onboarding screenshot (Nuitee Connect):** production flow explicitly asks registered business name, tax ID, address, live site, closed-user-group status, commercial/payment model and a verifying card (bank link optional). An intended partner-merchant model does **not** eliminate production KYC, tax identification or payment-card verification. A sole proprietor with no GSTIN must ask Nuitee whether the applicable Indian PAN/non-GST tax ID is accepted; never enter an invented GSTIN or business registration.

Authoritative references:
- https://docs.liteapi.travel/docs/whitelabel-booking-site
- https://docs.liteapi.travel/docs/revenue-management-and-commission
- https://docs.liteapi.travel/docs/deeplinking-to-whitelabel
- https://docs.liteapi.travel/docs/getting-access-to-flights
- https://docs.liteapi.travel/docs/getting-access-to-experiences

Release rule: no provider/payment/production credentials or external checkout integration changes until Nuitee confirms the exact account-specific entitlement and owner explicitly authorizes the release.
