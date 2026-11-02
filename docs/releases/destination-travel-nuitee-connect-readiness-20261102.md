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

### Provider activation blocker — exact owner-approved scope (verified from Nuitee docs 2026-11-03)

**Hotels are finished. Do not modify or reconfigure the existing Hotel Whitelabel.**

GTH PRO's requested business flow for Flights and Experiences is **discovery and selection on GTH PRO, final traveller booking and payment exclusively at a Nuitee- or partner-operated hosted checkout**. The business does not currently want to implement local passenger payment/Stripe capture, prebooking, ticketing, cancellation or refund operations.

Nuitee documentation confirms:
- Flights sandbox access is generally enabled by default, with limited non-live test data; production Flights and **Flights in Whitelabel** require separate provider approval. See [Getting Access to Flights](https://docs.liteapi.travel/docs/getting-access-to-flights).
- Experiences sandbox may require explicit activation; Experiences production and **Experiences in Whitelabel** each require approval. See [Getting Access to Experiences](https://docs.liteapi.travel/docs/getting-access-to-experiences).
- The published Flights/Experiences **REST booking flows** include prebook and Stripe checkout orchestration. Those are **not** confirmation that a provider-hosted **deep link from a selected live flight offer or selected tour slot** exists. See [Build a Flight Booking Experience](https://docs.liteapi.travel/docs/build-a-flight-booking-experience) and [Build an Experiences Booking Flow](https://docs.liteapi.travel/docs/build-an-experiences-booking-flow).
- MCP enables agent access but does **not** itself activate account products, remove production onboarding, or turn the API into a hosted partner checkout.

**Hard gate before implementation:** Obtain a provider-confirmed Flights and Experiences Whitelabel/hosted-checkout entry URL or a documented deep-link contract including attribution and whether selected flights/tours/dates are carried over. If only an on-site API/Stripe checkout is offered, **do not implement it** under the current owner-approved model. Preserve the currently operational Aviasales/Travelpayouts and existing tour partners. Do not invent selected-offer redirects, live data, approval, booked status or merchant-of-record claims.

### Focused Request Assistance message (no Hotels changes)
Subject: GTH PRO — Flights & Experiences partner-hosted checkout enablement (Hotels unchanged)

We operate GTH PRO (https://www.gthproglobal.com/), an Indian sole-proprietor travel discovery platform. Our existing Nuitee Hotel Whitelabel is already configured. **Please do not change our Hotels or Hotel Whitelabel.**

For only **Flights and Experiences**, users should research and select on our GTH PRO website and complete final traveller details, booking, payment and after-sales actions on a **partner-operated hosted site**. We do not wish to run our own payment gateway or agency-side booking/Stripe flow.

Please confirm:
1. Are Flights sandbox and Experiences sandbox enabled on our account? What non-production endpoints/testing are permitted?
2. Can Flights and Experiences be activated **for the existing Whitelabel without modifying Hotels**, and can customers complete **all payments/bookings** there?
3. Is there a documented **deep-link/redirect** from a GTH PRO selected flight offer or tour/time slot into the partner's hosted checkout? What booking context is transferred, and how is referral attribution retained?
4. What additional separate approval, commercial charges, supported countries/currencies, merchant-of-record responsibilities and support/refund obligations apply for both products?
5. We are an Indian **sole proprietor without GSTIN**: may we use an applicable PAN/other tax identifier for production verification? Please specify actual accepted documents; we will not enter invented business identifiers.

We can continue the existing Aviasales and third-party tour handoffs until the supported partner-checkout route is verified. We request no changes to Hotels.

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
