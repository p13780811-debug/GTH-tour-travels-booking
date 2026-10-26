# GTH PRO — Bus & Rail supplier-integration readiness (26 Oct 2026)

Status: **planning only**. No supplier contract, affiliate authorization, API access, live inventory, ticket issue, commission attribution, or verified route-specific links implied by this document.

## Current repository state

- `src/app/bus/page.tsx`: planning UI and explicitly disclosed redBus external website handoff.
- `src/app/train/page.tsx`: planning UI and official IRCTC / NTES navigation.
- `src/components/travel/TransportPlanner.tsx`: client-side form captures departure, destination, travel date and passenger count, checks inputs, and sends visitors only to the provider homepage. Entered data is **not** transferred. No real-time fare, seat, PNR or booking is claimed.
- Keep existing global CSS/day-night tokens, property/tender modules, protected SEO work, and approved homepage design unchanged.

## Supplier status and contact routing

| Supplier | Product | Current stage | Technical route after written approval |
|---|---|---|---|
| INFOBUS | International bus/rail | Enquiry sent | Approved deep link or authorized widget; API only if contracted |
| AbhiBus | India bus | Enquiry sent | Verified hosted booking / agent / API terms |
| eTravelSmart | India bus | Enquiry sent | Approved affiliate, hosted handoff, or API |
| redBus | India bus | Outreach in progress; do not assume delivery | Partner-approved tracking URL, explicit supported query parameters |
| IRCTC | Indian rail/tourism | Outreach in progress; **rail e-ticketing requires applicable authorization** | Direct official untracked link unless PSP/authorized contract expressly permits referral and branded routing |
| IntrCity | India bus | Outreach in progress | Authorized hosted bus reservation handoff or partner URL |

Do not publish contact claims or partners' names as contractual endorsements.

## Contract-first routing design

1. A **server-owned partner registry** holds partner identifiers, capabilities, regulatory restrictions, verified base URL, allowed deep-link pattern, tracking format, geographic coverage, currency, contract verification date and approval state.
2. Only `approved` partners with verified route-specific URL specifications may receive user search parameters. Unknown/unapproved partners must use plain official navigational links, with explicit "search again on partner website" disclosure.
3. Never interpolate unvalidated provider URL or redirect targets from browser query parameters. Map `partnerId` to server-owned HTTPS allowlisted domain and server-owned path builder; validate origin/destination/date/passenger count server-side with existing validator conventions. Reject invalid and expired travel dates.
4. Do not claim affiliate attribution when link is only navigational, and never embed affiliate tokens or secret API keys in public source.
5. API keys, contract credentials and signatures belong exclusively to server-side environment variables, with per-provider scopes and outbound request timeouts. Use explicit verified inventory/source labels and suppress empty or unverified fares.
6. For rail: separate schedule enquiry, PNR, reserved e-ticketing and tourism programs. No automated ticket issue, scraping of restricted booking pages, IRCTC branding implication, or PNR handling without appropriate permissions and privacy controls.
7. Record minimal opt-in click analytics only; exclude passenger identity, PNR, payment data, credentials and full raw query strings. Apply existing privacy/retention practices.
8. External booking pages handle payment, fulfilment, refunds and support unless a partner contract authorizes a different role. Be transparent before external handoff.

## Implementation milestones and verification gates

- [x] Locate current Bus and Train pages and transport form; preserve existing working navigation.
- [x] Create isolated planning branch (no merge or deploy).
- [ ] Obtain written provider approval, link template, commission/tracking rules, API terms and permissible use.
- [ ] Implement modular server-side provider registry and strict allowlisted URL builders only for approved partners.
- [ ] Write table-driven unit tests for encoded city names, station codes, date bounds, missing tracking params, malicious URLs and duplicate redirect parameters.
- [ ] Supplier-hosted URL smoke tests using real approved provider examples; **no fabricated booking/availability**.
- [ ] Accessibility, mobile, regression and day/night QA using existing CSS.
- [ ] `npm run build` and relevant automated tests from checked-out code.
- [ ] Fold accepted code into the one consolidated release; deploy only on final approved merge to `main`.

## Partner response checklist

Record: contact date, actual response and contact channel, legal entity/GST prerequisites, product coverage, approved website origin, allowed link template, tracking/cookies attribution, APIs and quotas, cancellation/refund owner, support owner, fees/commission, launch domain/branding permissions and signed contract reference. Never treat an enquiry or a successful email send as commercial approval.
