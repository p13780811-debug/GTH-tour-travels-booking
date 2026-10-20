# Hotel Phase 1 — targeted OSM source extraction (staging; no deployment)

## Scope and exact run

Only 18 small **approximate bounding boxes** in Digha, Puri and the specified
Mumbai/Navi Mumbai visitor hubs are queried. These coordinates are operator
research windows, not certified neighborhood boundaries. Use a locally verified
boundary/geocoding dataset before advertising exact locality membership.
No other city or city-wide extraction is permitted until user acceptance.

```bash
python scripts/hotels/phase1_overpass_hotels.py \
  --out artifacts/hotels/phase1-osm-raw.json --verify-images
python -m unittest discover -s tests -p 'test_phase1_overpass_hotels.py'
```

The exporter **does not import anything into Supabase**, enable schedules,
alter the deployed website or touch production importer state. It POSTs small
Overpass queries at a limited pace; record IDs and location come from OSM,
and source ODbL credit stays attached. In case of timeout/rate limiting,
`zones_failed` is explicitly nonempty and script exits nonzero.

## Verification contract

- `strict_complete` can only be true if all zones respond and every returned
  accommodation includes the six requested supplementary fields.
- Missing address, photo, gallery, stars, amenities or affiliate link are
  represented as `null` or empty lists and counted in `missing_fields`.
  Never replace missing metadata with invented addresses, image URLs, stars,
  amenities, fake offers or unsupported affiliate tracking IDs.
- `stars` refers only to a literal OSM `stars` tag of 1–5. OSM stars tags
  **do not themselves prove independent government certification**.
- Hotel `name` is an actual OSM `name` tag, **not evidence of official
  registered trading name**. Cross-check with a licensed/official registry
  when one is available; do not automatically elevate OSM to verification.
- `thumbnail` only publishes a direct HTTPS image tag if --verify-images
  makes a successful HTTP HEAD request returning `image/*`.
  This checks URL technical reachability, **not copyright, accuracy or rights**.
  Even then, a separate rights audit is mandatory before gallery publication.
- `affiliate_url` stays null until the existing protected, exact-hotel
  `hotel_booking_links` process confirms a provider hotel ID and partnership.
  Klook/Travelpayouts generic searches are not an exact verified property deep
  link and must never be presented as such.
- The exporter conservatively de-duplicates identical OSM element IDs across
  overlapping windows. A relation/way/node representing the same property may
  require manual entity-resolution review before publication.
- No strict completeness claim is made when any required metadata is missing;
  a hotel lacking these details can still remain in the *source staging*
  collection but must not be falsely labeled fully enriched.

## Verified existing catalog reality (read-only SQL, 2026-10-20)

The **broader** destination windows (not the exact 18 rectangles) contain
41 Digha, 67 Puri and 140 Mumbai-area OSM accommodation rows in
`public.hotel_catalog`. Missing `image_url`: 41, 67 and 140 respectively.
Missing address: 40, 38 and 107 respectively. These rows are not validated
official business registry entries. A live Overpass fetch was attempted
during authoring but unavailable in the execution environment; no fresh
Overpass extraction or new database import is claimed.

## Deployment control

Existing importer PR #93 retains this self-contained read-only source
script and tests. Nothing from this task is copied into the one-shot
website release PR #121. Running export requires an environment with
external HTTPS connectivity; no website deployment is involved.

## Phase 1 — enrichment module and validation (2026-10-20)

Use `scripts/hotels/phase1_enrich_166.py` **after** obtaining the
166-record OSM snapshot. This is a self-contained enrichment stage on the
existing importer branch; it **never performs Supabase writes or website builds**.

```bash
# Offline zero-network, zero-invention baseline; full 166 record JSON:
python scripts/hotels/phase1_enrich_166.py --no-commons

# Deliberately opted-in, one-time source lookups:
python scripts/hotels/phase1_enrich_166.py --refresh-osm-tags \
  --allow-public-nominatim --output final_enriched_hotels_166.json

# Offline regression gates:
python -m unittest discover -s tests -p 'test_phase1_hotel_enrichment.py' -v
python -m unittest discover -s tests -p 'test_phase1_overpass_hotels.py' -v
```

**OSMF public Nominatim usage policy**:
https://operations.osmfoundation.org/policies/nominatim/
This command is a deliberately one-time operator-invoked run (not a cron,
not a public-facing website endpoint). It uses a distinctive identifying
User-Agent and contact email, a **single sequential worker**, >=1.2 seconds
between queries, and a persistent JSON cache. Avoid distributed execution
or regular API calls. For repeated enterprise-scale enrichment, deploy
your own Nominatim service or obtain a suitable licensed provider rather
than burdening the donated public endpoint. OSM/ODbL attribution required.

**Address provenance**: First prefer exact source element `addr:*` tags,
then existing catalog address. A Nominatim reverse result is treated as a
hotel address only if it has the **same OSM element type and ID**; other
nearby roads are explicitly labelled vicinity/unverified. Remaining blanks
become `"Hotel Name, Target Locality, City, State"`, labelled
`address_source=locality_display_fallback_not_street_verified`.
This is a user-friendly location label, not an official registered address.

**Facilities**: Positive source tags only. `internet_access=wlan` means
Wi-Fi, **not Free Wi-Fi** without explicit fee evidence. No AC, television,
power backup, CCTV, room service, pool or accessibility claims without
positive tags. Published `facilities=[]` means unknown, not absent.

**Photos**: Only explicit OSM Commons File or `wikidata=Q...` matching
the property's identity can be considered. Wikimedia API must expose an
allowlisted reuse license and artist metadata, and an HTTPS JPEG/PNG/WebP
thumbnail has to return a successful `HEAD` image check. Photo evidence
(`media_evidence`) retains source, artist and license. This is
*automated source matching*, not a guarantee that the image is current,
rights-cleared for every use or an accurate hotel exterior: editorial
review remains necessary. No DuckDuckGo hotlinking, fake gallery duplication,
generic luxury images masquerading as the hotel, or 3–4 photo guarantees.
Future verified regional artwork belongs in **separately labelled
illustrative_gallery**, never `gallery`.

**Affiliates/stars**: Exact affiliate URLs remain null until an approved
hotel/provider ID matches the existing `hotel_booking_links` workflow.
Stars appear only when an exact OSM element has a 1–5 `stars` tag; this
is *source attributed*, not independently certified government star
classification.

**Output certification**: `final_enriched_hotels_166.json` contains 166
preserved identities with `readiness.structurally_valid` and separately
`readiness.fully_enriched`. The initial committed version is an **offline
baseline**, not proof that online enrichment has succeeded. An isolated
GitHub Actions job may produce a later more enriched artifact, without
merging PR #93, affecting PR #121 or changing the live DB.
