# Consistent travel search and registry photo discovery

## Travel behavior

The Activities hero previously skipped the outbound handler using a Tours-only guard, then displayed an additional Search on Klook control. Tours and Activities now share the same validated first-submit behavior: open one partner-search tab and retain native GET navigation to the filtered original supplier cards at `#discover`. The redundant hero and search-summary controls are removed. The optional Klook provider card also uses the tracked destination handoff.

Cars and Transfers now start with a native destination search form that opens the appropriate Klook keyword search in one click, including without JavaScript. Existing QEEQ, Localrent, intui.travel and Kiwitaxi widgets remain available. The optional rental and transfer checklists are separate from the primary search; their dates, driver details and route endpoints are not represented as automatically transferred. Hotel Nuitee and flight white-label flows are preserved.

`/api/travel/partner-search` validates the travel kind, destination and optional experience category server-side. It rejects unknown/repeated parameters, malformed destinations and arbitrary redirect URLs. It builds a fixed HTTPS Klook search wrapped in the account's Travelpayouts campaign. No credential, private API call or untrusted script URL is involved. Search keywords are discovery intent, not exact vehicle matches or guaranteed availability.

## Tracking evidence

On 27 October 2026 the owner's existing authenticated Travelpayouts account successfully generated a London Klook search link. Its Full link control displayed:

- campaign_id: 137
- marker: 417668
- p: 4110
- trs: 504342
- encoded u: the exact Klook destination-search URL

These are public referral identifiers. The implementation uses category-specific `gth_<kind>_search` SubIDs. The account-generated short link reached a real London result page with `aff_pid=417668` visible in the final URL. Separate provider UI searches confirmed relevant Dubai rental-car and Heathrow airport-transfer results. These observations verify destination routing and displayed results; they do not establish a booking, commission, live GTH inventory feed or full catalogue coverage.

Affiliate link availability is separate from a licensed product data feed. Original WeGoTrip cards, reviewed exact-product mappings and existing partner widgets remain the source of displayed products. No Klook result-page scraper or invented product feed was introduced.

## Real Estate photo audit and behavior

Live Supabase inspection returned:

- `property_published_media`: 0 rows
- `property_media_candidates`: 0 rows
- `properties.media_rights_verified=true`: 0 records
- `properties.image` populated: 608 records
- Actual nonempty array `registry_media_evidence`: 0 records

Three image-bearing samples repeated the same Unsplash photo and had no verified media rights. Therefore populated image columns cannot be treated as photographs of the corresponding registry project. No existing image was approved, scraped, copied, imported or published.

The new optional Registry projects with approved photographs section reads only publicly visible `property_published_media` photos through existing RLS, matches recorded MahaRERA projects and deduplicates projects. It uses the existing `/api/property-media/<id>` publication proxy and attribution. Archived/invalid project records and stock-image columns are excluded. Cards link to recorded project details, disclose unconfirmed availability, and never add sale prices, offers or sale/rent listing schema. The section stays hidden until actual approved photos are published. The text registry directory and genuine marketplace remain separate.

Public media `status` is intentionally not selected or filtered by the browser: that column is private. Existing `is_property_media_public(id)` RLS enforces publication. No grants, policies, schemas, importer jobs or production data were changed.

## Validation and release boundary

Behavior tests exercise both hero submit handlers, exactly one outbound open, native local navigation, category/city preservation, malformed/open-redirect rejection, native car/transfer forms, and deduplicated registry photo rendering/empty-state behavior. Local validation passed: TypeScript, ESLint, all 546 JS/TS tests, diff whitespace checks, existing central-CSS protection and the full 140-route production build with `VERCEL_ENV=production GTH_PUBLIC_LAUNCH_ENABLED=true` and real public Supabase configuration. No private credentials were used for the build.

Built-app HTTP smoke passed: all four valid travel handoffs returned 302 to the fixed affiliate host with marker 417668 and the correct London/category query; an arbitrary `u` redirect parameter returned 400. Cars, Transfers, London Activities and Real Estate returned 200. Cars/Transfers HTML contained the native first-click form and Activities contained no redundant Search London on Klook control. This is local production-server verification, not a claim that the changed GTH front end is already deployed. Remote commit/check evidence is recorded with the branch handoff.

Only existing global semantic classes/tokens are used; no CSS files change. The sole new Real Estate component is explicitly scoped in the integrity guard; all other protected files retain their existing checks. Feature-branch Vercel deployments are disabled for `fix/travel-consistent-outbound` to preserve the owner's one-shot release policy.

No new PR, main merge or production deployment is authorized merely by preparing this branch. This candidate is reviewable on the safe feature branch under the owner's existing instruction not to create another PR without being asked. Browser verification of the deployed GTH candidate, physical-device QA and authenticated publication writes are not claimed.

The generated test affiliate link was inadvertently added to Saved during UI inspection. Automatic review rejected the subsequent unsave action as a persistent account preference change without specific authorization. It does not affect website source, tracking configuration or bookings; no workaround was attempted.
