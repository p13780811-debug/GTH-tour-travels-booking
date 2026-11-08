# GTH PRO — native app and OSM place SEO, one release

Owner instruction on 9 November 2026: finish the existing native app in PR #153,
add source-backed SEO pages for the imported OSM directory, use a 24-hour cache,
preserve existing sitemap shards, and merge the tested work together.

## Existing work preserved

- Native Home/Discover/Research Desk/Services, 28 shortcuts, offline notes/checks,
  source refresh and live canonical service screens remain in the same PR.
- Ecosystem homepage, Mega Aggregator, global CSS/navigation, Nuitée Hotels,
  Aviasales, supplier booking engines, original Tours/Activities catalogues,
  Real Estate/MahaRERA, Tenders, PWA and all existing SEO shard routes stay intact.
- No schema/RLS migration, new table, secret, ingestion change, paid API, new
  cron, background polling, external map SDK or catalogue-wide build is added.

## Public pages and discovery

- `/attractions/osm/node-123`, `way-123`, `relation-123` use the original OSM
  element identity. An update to a place name never changes its canonical URL.
- The route lives under `(mapped-places)` so the existing `/attractions/loading`
  streaming boundary cannot turn missing records into successful HTTP 200s.
- `generateStaticParams()` returns an empty list: no enumeration of 174k records
  at build time. Pages generate on demand and use 86,400-second ISR and source
  caches. Metadata/body share a request read; related records share six rows per
  country/day. Added place links disable automatic Next.js prefetch.
- Pages contain recorded names, categories, location, coordinates, provenance,
  real import timestamps, maps/directions, visitor checks and independent
  provider searches. No photos, opening hours, facilities, prices or reviews
  are fabricated. Missing facilities remain explicitly unknown.
- Indexing follows the existing production/public-launch gate. Damaged source
  provenance, missing country location and generic names such as “Park” remain
  out of search discovery. The same eligibility function controls page robots
  and the sitemap. TouristAttraction/Breadcrumb data contains no fake offers.
- Existing Attractions directory/rail cards now link to the original record's
  detail page while retaining the original OSM source link and ODbL attribution.

## Partner handoff

- Klook search preserves the original place/location in its query and reuses
  existing owner-approved Travelpayouts campaign 137, publisher 417668,
  p=4110/trs=504342. It works without loading a widget or making a per-view API call.
- GetYourGuide search preserves the same context using the existing public
  partner ID DF3NBKA. Neither search pretends to be an exact confirmed ticket.
- Audio/self-guided tours open the existing city-filtered WeGoTrip catalogue;
  genuine supplier products retain their original exact-product handoffs.
- Existing Hotels/Flights and 12Go Bus/Train/Ferry planners remain the booking
  path. No station, provider product ID, live availability or commission is guessed.
- Affiliate disclosure and sponsored links are visible. Actual matching products,
  dates, travellers, checkout and final availability stay with the supplier.

## Sitemap and resource budget

- Existing `/sitemap.xml`, `/sitemap-index.xml` and category shards are preserved.
- Robots adds the independent `/attractions/sitemap.xml` OSM sitemap index.
  It contains direct shard URLs, not nested sitemap indexes.
- `/attractions/sitemaps/IN/0.xml` etc partition each country into source-ID-ordered
  groups of at most 1,000 raw source records. New countries/pages appear on the
  next daily cache refresh, without a deploy. There is no fixed 12-shard cap.
- Country counts use the existing public summary view once per 24-hour cache
  fill. A shard uses one country-indexed, bounded row range and is cached for
  24 hours. Ineligible source rows are omitted; no arbitrary DB count runs per
  shard, and no supplier API runs per page or sitemap request.
- Existing OSM summary/top-city caches also move from five minutes to 24 hours.
  Interactive filters, their row limits and request timeouts stay intact.
- The existing daily SEO monitor adds at most two OSM shard reads and two detail
  samples. It does not crawl all imported records or trigger a redeployment.
- For D cold distinct detail pages, C viewed countries and S cold sitemap shards,
  the new read path is approximately D + C + S + one daily summary read per cache
  fill (plus misses/retries); warm HTML views do not repeat DB reads. CDN response
  bodies and database egress still count toward the account's actual quotas.
- Cold initial discovery of 174k pages can still create 174k page generations.
  Cache reduces repeat work; it does not guarantee unlimited free traffic or
  Google indexing/ranking. Exact account plans, usage and production row count
  are not available in this workspace and must not be claimed audited.
- `GTH_OSM_PLACE_PAGES_ENABLED=false` disables new detail pages and the OSM sitemap
  surface without altering existing directory data or booking functionality.
  Existing launch visibility remains independently authoritative.

## Verification and release

Automated contracts cover stable IDs, unsafe input, source provenance, Unicode
partner searches/tracking, truthful structured data, 24-hour expiry, changed
source facts, failed-read recovery, disabled/preview gates, 174,231-record count
partitioning, 1,000-row shard limits, generic-name exclusion and shared country
reads. Local HTTP/browser QA uses explicitly labelled fixtures and local font
fixtures; it is not production inventory or booking/commission evidence.

Run `node --test tests/osm-place-*.test.mjs`, the complete website/native checks,
and `scripts/qa-osm-place-seo.mjs` against an isolated production-mode test server.
The HTTP acceptance verifies real Next.js warm-cache behavior, missing-record
404s, canonical metadata/JSON-LD, XML discovery, unsafe source text escaping and
320/390/768/1440px day/night layouts. CI must independently pass the actual
production build and final-commit native APK/AAB/emulator gates before merge.

Merge once to main after these gates, respecting branch protection. Do not run
manual Vercel promotions/redeploys, migrations or supplier ingestion. Main's
existing deployment integration remains the single release trigger. Production
phone/store signing and publishing are separate from a tested QA APK.
