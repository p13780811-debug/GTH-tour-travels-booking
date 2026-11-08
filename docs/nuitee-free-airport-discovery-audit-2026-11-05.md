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

## Expanded global reference catalog (2026-11-05)

15 country-scoped read-only Nuitee Connect metadata searches were filtered to country-matching IATA airport records with the provider's airline-service indicator. Raw accepted counts are: India 22; Japan 24; United States 18; Germany 24; United Kingdom 22; France 21; Australia 24; China 23; Canada 25; Brazil 23; Thailand 25; UAE 7; Indonesia 24; Malaysia 24; Spain 7. **313 country-sourced records before de-duplication**, plus the original 16 manually verified airport-guide records. Search results are capped by the Nuitee API query endpoint, so this is not a complete list of all airports worldwide. The site de-duplicates by IATA code and filters unsuitable records. An airport reference or hasAirlineService flag is not a guarantee of a currently available route.

- `src/lib/travel/airportReference*.ts`: static country-scoped records, no runtime network access.
- `src/lib/travel/nuiteeAirportIndex.ts`: searchable, validated, deduplicated combined catalog.
- `src/components/travel/AirportDiscoveryTools.tsx`: accessible text/country search with incremental results, route selector, and existing flight-search navigation.
- `tests/nuitee-airport-discovery.test.mjs`: source contract and zero-booking-call regression checks.
- `.github/workflows/nuitee-airport-feature-qa.yml`: isolated branch CI for tests, TypeScript and lint. Does not build/deploy Next production or call third-party booking APIs.

Do not describe the feature as merged/live until exact-commit CI and release gates pass. Commercial/production Flights and Experiences API permissions remain outside this static reference feature.

## Verified QA result

The feature-specific GitHub Actions run completed successfully after fixing a shortened checkout SHA:
https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/42040745717
Checks passed on source commit `eea221f221c2217ad979110f813a592a0258ad26`: `npm ci --ignore-scripts`, airport reference test, repository `tsc --noEmit`, and feature-file ESLint. Subsequent commit(s) modified only this audit document, not application source. No full Next.js production build, browser QA, Vercel preview, or production release has been performed. Deployment is gated on explicit confirmation of a no-charge release path.
