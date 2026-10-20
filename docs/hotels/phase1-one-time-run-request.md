# One-time Phase 1 hotel source enrichment execution

This branch deliberately invokes the isolated GitHub Actions hotel enrichment QA job once.
- Source scope: the 166 OSM IDs frozen in docs/hotels/phase1-existing-osm-catalog-snapshot.json.
- No Supabase credentials or write endpoints are configured or needed.
- No website code, Vercel deployment or schedule activation is involved.
- Public Nominatim: at most one request per 1.2 seconds, cached, single machine.
- Wikimedia files: reuse permitted only with identity tag, approved license and attribution.
- Output: GitHub Actions artifact containing JSON plus audit readiness metadata.
- Source name/location never modified; no fictitious amenities, ratings or hotel image URLs.
