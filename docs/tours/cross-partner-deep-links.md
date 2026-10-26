# Cross-provider exact product handoffs (follow-up to PR #136)
This branch preserves PR #134/136 Tours and Activities pages, all existing flight/hotel
integrations and global CSS. Feature preview deploy is disabled; no database mutation.

## What works immediately
When a visitor selects a city, Klook's Tours/Activities partner card uses the
existing `directTourSearch` destination/category search, not its generic shortlink
homepage. Existing global Travelpayouts Drive may automatically convert the
normal supplier search URL; exact product identity is NOT implied by that fallback.
WeGoTrip's proven exact supplier-product cards remain untouched.

## Klook, KKday and Tiqets exact-product cards
`scripts/tours/reviewed_partner_feed.py` consumes an **authorized supplier feed**
or owner-reviewed product export. Each row must supply an original supplier
product ID, exact official product URL, title, city, country, classification,
supplier-authorized image URL, dimensions, a current review date, and affirmative
media rights approval. Missing/expired/mismatched IDs, generic homepages/search
pages, or rights not cleared = no card. It does not scrape or manufacture products.

Example (illustrative schema, not publishable inventory):
```json
{"products":[{"provider":"tiqets","provider_product_id":"12345",
"title":"REPLACE with original supplier title","city":"Paris","country":"France",
"experience_category":"attraction-ticket",
"source_url":"https://www.tiqets.com/en/paris-c66746/replace-with-real-product-p12345/",
"image_url":"https://supplier-approved-photo-cdn.example/photo.jpg",
"image_width":1200,"image_height":800,
"media_rights_verified":false,"source_type":"approved_partner_feed",
"source_checked_at":"2026-10-26T00:00:00Z","price_numeric":null,"currency":null}]}
```
Placeholders above intentionally cannot pass verification.

For real approved input:
```bash
python3 scripts/tours/reviewed_partner_feed.py --input /secure/approved-export.json --output /tmp/reviewed-partner-products.json
python3 scripts/tours/catalog_engine.py links --input /secure/confirmed-products.json --output /tmp/affiliate-products.json
```
After code review, approved JSON may be copied to
`src/data/tours/reviewed-partner-products.json`. Initial manifest is empty,
not fabricated inventory. Product cards appear only for approved snapshots
within 30 days, using the original partner image and product URL. Browser
Travelpayouts conversion must be tested for each supplier, separately from
the exact landing and actual booking commission. Stale records fail closed.

## Supplier access constraints (not a bug in this repository)
- WeGoTrip has a public documented API and real source-backed photos, already live.
- Tiqets offers a list of product/city IDs for widgets, but it is *not* a complete
  product+photography+URL feed. Valid product URLs and image reuse still require
  supplier documentation/authorization and matching review.
- Klook's product feed is on request; it is not granted by the fixed affiliate link.
- KKday's product lists/API are available only to selected partners.
- Go City city passes do not have the same numeric product detail URL contract;
  the program stays a clearly labelled brand/city discovery handoff until
  verified pass-level identifiers and URLs are available.

Sources:
- https://support.travelpayouts.com/hc/en-us/articles/20384016664594-Brands-that-provide-access-to-APIs-and-data-feeds-for-Travelpayouts-partners
- https://support.travelpayouts.com/hc/en-us/articles/360010455179-Data-from-Tiqets
- https://www.travelpayouts.com/blog/klook-affiliate-program/
- https://kkpartners.kkday.com/
- https://support.travelpayouts.com/hc/en-us/articles/360027634052-How-to-create-and-use-affiliate-links

## Release
No PR #135 merge, no schema/RLS/publication changes, no second Emerald script,
no main deploy. Verify TypeScript, regressions, Python ingestion tests,
browser city-preserving handoff and provider-specific real product landing
before one-shot production merge. Never label an untested supplier link
"affiliate converted" or claim supplier bookings/commission.

## India-first original supplier sync (Viator excluded)
- Original WeGoTrip country API exposes 87 countries; India currently returns 5 country-level products across Agra (3), Mumbai (1), Jaipur (1). Do not promise every country or city has 3 products. Other providers' catalog access is separate.
- `scripts/tours/india_first_sync.py --scope india` is safe read-only discovery by default; `--scope world` rotates through other supplier countries so every country is revisited over multiple days.
- It validates supplier product detail, approved/published status, exact city/product IDs, source URL, original supplier photo response, type 1 audio/type 2 admission/type 3 ticket+audio, and deduplicates by supplier product ID.
- Strict `--write` upserts only validated products into the isolated `public.tour_supplier_products` table. Legacy 110 Tours/218 Activities and their publication flags are untouched. The additive migration `supabase/migrations/20261026062000_tour_supplier_inventory.sql` must be reviewed/applied first at release; the new table is read-only under RLS for public users.
- Daily cloud workflow `.github/workflows/gth-india-tour-inventory.yml` runs importer tests and India smoke; on merged main with protected Supabase URL/service-role credentials it also upserts India daily + a rotating worldwide batch. Missing secrets produce an explicit no-write skip. Feature branch never writes or deploys.
- Tours/Activities server section uses live supplier results plus recent RLS-approved persisted inventory (14-day freshness), no fake filler. No customer information/secret is exposed to the browser. An original supplier photo is used under the supplier affiliate API's display integration; this is not a blanket licence to redistribute its bytes.
- Provider price and availability are indicative; confirm on supplier page. The global Travelpayouts Drive continues to handle eligible exact-product handoffs. No new Emerald script is added.
- Conservative default: max 12 verified products per country per sync, max 8 non-India countries/day; no mass fan-out or scraper. No Viator integration.

## Existing GTH PRO OIDC workflow compatibility
Cloud sync uses the same GitHub OIDC design already used by GTH hotels and open attractions. `GTH_TOURS_OIDC_TOKEN` is requested with exact `gth-tours-inventory:dqprqjmhxjnrllczqyhz` audience on the **main-only** schedule/dispatch; `supabase/functions/gth-tour-supplier-ingest/index.ts` verifies GitHub RS256 JWKS, exact repository ID, main workflow ref, event and freshness before any service-role upsert. GitHub has no static Supabase key. The Edge Function's project URL/key remain server-only. Deploy the Edge Function and SQL migration together at the single approved release gate. The importer retains an explicit manual protected-key fallback for isolated operator testing; automated GH Actions does not use it.
