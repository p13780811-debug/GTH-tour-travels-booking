# GTH PRO — Worldwide Sports & Stadium Tickets (staging only)

**Status:** Prepared offline. No sports-ticket authorization, live match inventory, paid API, checkout, ticket issuance or public launch is claimed.

## Architecture

- src/app/sports-tickets/page.tsx — feature-gated, server-rendered marketplace shell, noindex by default. Returns 404 until launch is explicitly authorized.
- src/components/sports-tickets/SportsTicketsExperience.tsx — responsive premium GTH CSS-token layout with screenshot-matching Country & City, Match Date, Sport & Team, Stadium, Available Matches & Tickets and Authorized Ticketing Partner sections.
- src/lib/sports-tickets/validation.ts — strict server-side route search validation. No arbitrary URL/redirect parameters and no unvalidated date or city.
- src/lib/sports-tickets/providers.ts — empty-by-default server-owned provider adapter registry and verified-event/HTTPS checkout allowlist.
- src/lib/sports-tickets/service.ts — guarded provider search with timeout, deduplication, maximum record counts, freshness and event validity gates.
- src/app/api/sports-tickets/events/route.ts — same feature gate and parser as the page. GET-only, no-store and 404 when disabled.
- tests/sports-tickets-staging.test.mjs — filter, expiry, authorized checkout, noindex, integration isolation and fail-closed tests.
- vercel.json — staging branch is explicitly denied automatic Vercel deployment.

## Intentionally not live

No supplier is connected; AUTHORIZED_TICKET_PROVIDERS is empty. There are no synthetic match results, fabricated prices, dummy ticket availability or fee-bearing integrations. Zero vendor APIs are called. No copy of stadium photos, club/league logos or licensed fixtures has been taken.

There is **no** new main-menu link, homepage link, sitemap change, global CSS adjustment, payment/checkout implementation or change to existing 12Go, Flights, Hotels, Tours, Real Estate or Tender integrations.

## Launch gating

Public visibility requires **both**:
1. At least one authorized provider manually added to the server-side registry with an approved exact HTTPS checkout origin and written contract/authorization reference.
2. Production server variable GTH_SPORTS_TICKETS_PUBLIC_ENABLED=true after explicit review.

Local UI inspection only via next dev and GTH_SPORTS_TICKETS_LOCAL_PREVIEW=true. The preview flag is ignored in production. Keep all flags absent from Vercel until release approval. Staged and local preview responses retain robots.noindex.

## Provider integration contract

For each written-approved provider, create a separate server-only adapter implementing AuthorizedTicketProvider.search(). Return provider-issued event IDs, source-verifiable fixture/sport/teams, stadium/city/country, UTC start time, accurate source status, up-to-date verification timestamp and supplier-provided HTTPS ticket URLs. Pass only approved data through the normalization and exact-origin allowlist. Keep private API keys exclusively in server-side environment variables.

Perform no automated ticket purchases or reservation holds. Payment, ticket issuance, refunds, transfer/entry rules and customer support must be performed by the approved supplier unless contracts explicitly authorize otherwise. Confirm legal limits for resale and territorial/sport-specific ticket distribution before enabling each source.

## Required checks before launch

- [ ] Written reseller/affiliate authorization, organizer restrictions, trademark and image licensing, and supported countries/leagues.
- [ ] Verified API documentation, quota and pricing review; **no unexpected billing**.
- [ ] Provider-specific authorization and HTTPS host allowlist, signed link/attribution handling, timeouts and error behaviour.
- [ ] Verified real event data, start time/timezone, availability, seat mapping and fee-inclusive price disclosure.
- [ ] Privacy, consumer disclosures, accessibility and physical mobile QA.
- [ ] Run node --test tests/sports-tickets-staging.test.mjs, relevant regressions, TypeScript, ESLint and production build on the exact candidate commit.
- [ ] Approved final PR/merge/deployment, site navigation and indexing only when the provider is truly live and contract allows it.

Keep this branch isolated until authorization. Do not merge or deploy merely because the code exists.
