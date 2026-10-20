# One-time Phase 1 hotel source enrichment execution

This branch deliberately invokes the isolated GitHub Actions hotel enrichment QA job once.
- Source scope: the 166 OSM IDs frozen in docs/hotels/phase1-existing-osm-catalog-snapshot.json.
- No Supabase credentials or write endpoints are configured or needed.
- No website code, Vercel deployment or schedule activation is involved.
- Public Nominatim: at most one request per 1.2 seconds, cached, single machine.
- Wikimedia files: reuse permitted only with identity tag, approved license and attribution.
- Output: GitHub Actions artifact containing JSON plus audit readiness metadata.
- Source name/location never modified; no fictitious amenities, ratings or hotel image URLs.

## CI retry
Original run found a pre-existing Python escaped-newline syntax defect in the Phase 1 Overpass module. Fixed in commit 8678453ae7f775a5beba353c2698e6dd81474a41; rerun complete offline QA before network enrichment. No deployment or database writes.
