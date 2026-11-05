# GTH PRO Nuitee free integration — audit and release notes

Date: 2026-11-05
Scope: Nuitee MCP read-only inspection and additive, zero-runtime-API airport discovery.
Branch: `feature/nuitee-airport-discovery-free`
Status: Staged; NOT merged to production. No production build attestation.

## Confirmed through connected Nuitee MCP

- Airport reference lookup returned verified records for CCU, BOM, NMI, DEL, BLR, HYD, MAA, GOI, GOX, COK, DXB, SIN, BKK, LHR, CDG, and JFK.
- Experiences tour search (Mumbai) returned HTTP 403, error `40301`, description: `Experiences API access is not enabled for this account.`
- Nuitee Flights and Experiences expose API endpoints in the MCP catalog; endpoint discovery does **not** confirm production authorization.
- Nuitee docs state production enablement is separate and required for Flights and Experiences. Do not treat a ChatGPT MCP session as a deployable API credential.

## Cost controls

Pricing reference: https://docs.liteapi.travel/reference/api-pricing-usage-costs
Access references:
- https://docs.liteapi.travel/docs/getting-access-to-flights
- https://docs.liteapi.travel/docs/getting-access-to-experiences

- No booking, prebooking, cancellation, paid lookup, payment, invoicing, account-plan change, or API credential write was performed as part of this feature.
- Do **not** call Nuitee flight fare search in production without explicit accounting for the search-to-book ratio and potential surcharge.
- Do **not** call Places or Price Index endpoints; published pricing includes per-request charges.
- Do **not** enable paid dashboard add-ons or ticket issuance without explicit financial authorization.
- Airport guide pages import **static verified reference data** and do not call Nuitee at runtime.
- Confirm account-specific commercial terms and usage before any further live integration.

## Additive website implementation

- `src/lib/travel/nuiteeAirportDirectory.ts`: static airport directory, 16 checked records.
- `src/app/travel/airports/page.tsx`: index and functional GET route selector; links to existing GTH PRO Flights page. Provider search dates still need to be selected in provider form.
- `src/app/travel/airports/[iata]/page.tsx`: statically generated airport guides; no fabricated fares or bookable inventory.
- `src/app/travel/page.tsx`: one new navigation entry; service integrations unchanged.
- `src/app/sitemap.ts`: airport guide URLs; launch/indexing guard preserved.

No existing Flight, Hotel, Activity, Tour, database or API integration was edited. No new secrets, .env variables, or CSS theme were introduced.

## Required release checks before merge

1. Run `npm ci`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` against the exact branch SHA using existing CI, without a forced production deployment.
2. Verify mobile route selector works and the linked Flights page displays the route information without claiming automatic booking availability.
3. Confirm robots/sitemap indexing, existing Travel layout, day/night theme, and route 404 behavior for unknown IATA codes.
4. Verify zero unexpected Vercel/API billing and review deployment quotas before any preview/production build.
5. Obtain explicit production release approval; do not force deploy or auto-merge.

## Growth expectation

Airport guides may improve long-tail search discoverability but do not guarantee traffic, revenue, indexed pages, or supplier booking availability. Monitor Search Console indexing and real analytics after an approved launch. Existing organic social scheduling can promote the page only after the public URL is live.
