# GTH PRO Travel bulk hotel ingestion — release gate

The existing **PR #14** adds a source-attributed OpenStreetMap hotel catalog and a guarded Python GeoJSONSeq importer. This runbook does not authorize a production release.

## Region-by-region licensed bulk ingestion
1. Download a verified regional OSM PBF from https://download.geofabrik.de/ (OpenStreetMap contributors, ODbL 1.0).
2. With `osmium-tool`, filter accommodation features before exporting, which avoids wasting work on unrelated OSM features:

```bash
osmium tags-filter region.osm.pbf n/tourism=hotel,motel,hostel,guest_house,apartment,resort -o accommodation.osm.pbf --overwrite
osmium export --add-unique-id=type_id -f geojsonseq -o hotels.geojsonseq --overwrite accommodation.osm.pbf
python3 scripts/import_osm_hotels.py hotels.geojsonseq --limit 5000 --dry-run
```

3. Only after validating feature IDs and row samples, run importer in an authorized private execution environment with `GTH_INGESTION_ENABLED=true`, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_INGESTION_KEY` (server-only, never committed); start with `--limit 5000`.
4. Verify Supabase `hotel_catalog` row counts and public SELECT-only RLS. Then increase batches by region; repeated source IDs upsert.
5. Keep regional OSM extracts, raw data and credentials out of GitHub commits. Honor attribution and derivative-database license obligations. Never claim static OSM point records are validated hotel inventory or live room availability.

This working environment may be unable to reach OSM download hosts. The ingestion script is implemented, but **no new hotel data may be claimed until a successful import has been verified**.

## Release policy
Do not merge travel PR #7 onward into main until the Travel development package has been tested end-to-end; do not touch the approved PR #1-#6 real-estate code or central CSS.
