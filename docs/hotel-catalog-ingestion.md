# GTH PRO — Hotel Catalog Ingestion

## What this does
- Adds a separately attributed OpenStreetMap (OSM) accommodation catalog to existing Supabase hotel listings. It does not replace `hotels`, change real estate, or assert prices/room availability.
- Imports only named accommodation **point** features with stable `node/123`, `way/123`, `relation/123` identifiers and recognized tourism tags. Polygon and line features are deliberately rejected rather than inventing entrance coordinates.
- OSM content is under [ODbL 1.0](https://www.openstreetmap.org/copyright). Attribute OpenStreetMap contributors, and assess ODbL share-alike and attribution duties for produced databases, exports, and downstream reuse.
- No public write permissions. The importer uses a privileged, server-only Supabase credential; do not run it in a Vercel browser/client request.

## Bulk extract workflow (operator-driven)
1. Obtain an up-to-date regional `.osm.pbf` extract from a legitimate OSM extract publisher, e.g. [Geofabrik](https://download.geofabrik.de/). The original file is typically large; **do not commit extracts to the repository**.
2. Install the `osmium-tool` CLI locally. Convert to newline-delimited GeoJSON:
   ```bash
   osmium export --geometry-types=point -f geojsonseq region.osm.pbf -o hotels.geojsonseq
   python3 scripts/import_osm_hotels.py hotels.geojsonseq --dry-run
   ```
   Conversion format and field naming should be checked with one sample before a full import. The importer requires a stable OSM identifier such as `node/123`, either at feature `id` or properties `@id`.
3. Confirm the catalog migration is applied to the correct Supabase project. Configure `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_INGESTION_KEY` (service role, **server-only**) and `GTH_INGESTION_ENABLED=true` only in an isolated execution environment. Never paste or log the credential.
4. Run `python3 scripts/import_osm_hotels.py hotels.geojsonseq`. Re-running the same extract performs deterministic upserts. Optionally test `--limit 100` first.
5. Verify counts, source attribution, RLS and real hotel results in `/api/hotels?city=Mumbai`. A catalog hotel without a booking-provider link is discovery-only and must not be advertised as live bookable inventory.

## Provider enrichment — contractual gate
Future adapters must explicitly record the provider's licensing terms, quota, free reset period and allowed storage duration before ingestion. Never rotate accounts or keys to circumvent limits. Caching restrictions apply separately to photos, ratings, amenities and pricing. Refresh live booking price/availability on the partner side.

## Operational limitations
- This version does **not** include API account registration, licensed photos, live supplier pricing, quota-backed third-party provider adapters, or automatic bulk harvesting from unsupported APIs.
- Geofabrik extracts are *inputs*; deployment to Vercel does not automatically download them. A separate, authorized ingestion runner is necessary.
- The source has potential duplicates across OSM and supplier-backed `hotels` records; name-based suppression for the current result page is only a display guard, not a global entity-resolution guarantee.
