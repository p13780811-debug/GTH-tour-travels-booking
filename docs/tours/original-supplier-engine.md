# Original tour source, media and exact-link engine

Preserves the PR #134 Tours/Activities layout, global CSS and all existing partner programs. No database writes, flag promotions or migrations in this change.

## Findings

`backend/import_activities_tours.py` and `backend/import_travel_data.py` generated city-name templates, fixed prices, stock photographs and generic marker-only booking URLs. They were seed generators, not supplier importers. Both now fail closed with a clear replacement command. `scripts/update-images.ts` no longer overwrites tour photos with city stock photographs or reads a public Pexels key.

Historical repository audit recorded 110 unpublished tours. A fresh Supabase aggregate audit was attempted, but the database connection timed out even though project metadata reported ACTIVE_HEALTHY. Do not label all 110 rows original, demo or duplicate without completing `scripts/tours/audit-legacy.sql`. No rows were deleted or published. The read-only export audit distinguishes duplicate IDs, possible title/city duplicates, repeated images and missing provenance.

Actual supplier requests returned 17 Edinburgh products from WeGoTrip and a current detail record with exact product/city IDs, canonical URL and supplier photos. A listing response alone does not establish media rights or exact affiliate conversion for legacy database rows.

## Runtime supplier cards

Server-only catalogue requests use the fixed public WeGoTrip API described by Travelpayouts and the supplier documentation linked there. Card previews are used under that documented product-card integration; this is not a claim that arbitrary scraped photos have a reusable licence.

API city identities are resolved exactly; ambiguous names never guess a destination. Available English supplier products are validated for numeric identity, matching city, supported type, original preview host and URL. Source IDs and slugs generate the documented exact product URL. Duplicates are suppressed by supplier ID and exact title/city. Price currency is retained, never converted silently. Audio tours are labelled self-guided. Ticket products appear in Activities. Other selected categories retain existing booking options rather than relabelling audio tours as guided day trips.

Cards contain the supplier photo and listed price. Broken photos remove the card; no generic stock substitution. Requests are bounded, cached and isolated behind Suspense so the approved search and partner links stay usable. These supplier products are separate from unpublished GTH database rows.

Existing Travelpayouts Drive processes eligible ordinary product links. Runtime tracking and arrival at the same product must be verified before claiming affiliate conversion. Affiliate-program membership does not itself provide a Klook product feed/API. No Klook inventory or commissions are fabricated.

## Cloud and CLI

`GTH Original Tour Source Engine` runs a bounded read-only supplier/detail/photo smoke on relevant PRs, manually and daily at 21:00 UTC (02:30 IST). It uploads public supplier candidates only. It never uses credentials or writes to Supabase.

```
python3 scripts/tours/catalog_engine.py audit --input /private/path/tours-export.json
python3 scripts/tours/catalog_engine.py fetch --city Edinburgh --limit 4 --output /tmp/original-products.json
python3 scripts/tours/catalog_engine.py links --input /private/path/confirmed-products.json --output /tmp/tracked-products.json
```

Link input requires provider, provider_product_id and source_url. Klook, WeGoTrip, KKday and Tiqets product paths must contain the same genuine supplier ID. Homepages, searches, altered IDs and foreign hosts are rejected. No product discovery is inferred from names. The links command reuses the existing tested Travelpayouts batch transport (maximum 10 links/request, bounded retries), validates response URL association and provider tracking hosts, and does not publish.

For link conversion configure existing server-only TRAVELPAYOUTS_API_TOKEN (or TRAVELPAYOUTS_TOKEN), TRAVELPAYOUTS_MARKER and TRAVELPAYOUTS_TRS in the execution environment; never send credentials into browser code or logs. Klook product feed access is a separate prerequisite for original Klook inventory, not a reason to rerun demo seeders.

## Release

Branch deployments disabled. One Git merge after exact-head checks; then verify Vercel READY, merged SHA, aliases, actual supplier photos and an exact-product handoff. Record outcome and limits in the PR. Rollback baseline: 7982c31f783799e7c4ec6cfcff66538a302f646c / dpl_6rxCKfPgmYEuaMPuX1Qz9gLdi8VP.

Sources: https://support.travelpayouts.com/hc/en-us/articles/360016170039-WeGoTrip-affiliate-program-API ; https://gist.github.com/4eRTuk/6b6a4b06b5f6d4ce90973e1931052991 ; https://support.travelpayouts.com/hc/en-us/articles/25289759198226-API-for-Travelpayouts-partner-links
