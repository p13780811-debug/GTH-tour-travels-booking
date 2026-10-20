# GTH PRO Phase 1 — 166 hotel evidence gate (20 October 2026)

## Source-only facts, NO publication assertion

- Scope: frozen 166 distinct OSM source IDs, exact name and source coordinates
  in 18 research windows in Digha, Puri and Mumbai/Navi Mumbai.
- The first public Nominatim/OSM cloud research [succeeded](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/39459667742).
  It found 115 reverse-address road/suburb details matched to the same OSM
  element, retained 39 previously stored source-address fields, and used
  display-only geographic fallback labels for 12 others. This does not
  certify registered business addresses or exact hotel entrance coordinates.
- The OSM tags subquery returned zero successful batches in that run;
  **hotel amenities, official star classification and property photography
  remain unknown**, not negative. The importer now reports OSM source
  failures explicitly; it does not invent any amenities.
- 12 original operator-bounding-box labels mentioning New Digha conflict
  with the source address saying Old Digha; **geospatial/manual review
  required**. Keep original coordinates and identity unchanged.
- 38 OSM hotel records carry property website candidates. They are leads,
  not proven current hotel operators or publication consent.

## Exact-photo sourcing

[Full 166-file Commons research](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/39463434550)
processed all records, with 3 initially plausible title matches, 6 source
errors. Strict filename+city screening rejected **two unrelated photos**:
person named Sharada and a generic SeaView landscape. One hotel-source
candidate is pending source/identity review:

- Hotel: **Sea Green Hotel**, Mumbai, OSM `node/1504771680`
- [Commons File: Hotel Sea Green Marine Drive Mumbai.jpg](https://commons.wikimedia.org/wiki/File:Hotel_Sea_Green_Marine_Drive_Mumbai.jpg)
- API reports author: Pradeep Mohandas; license: CC BY-SA 3.0.
- **Not yet publication-approved**; verify hotel subject, photo identity,
  attribution and applicable reuse rules. Do NOT auto-publish or make a
  fabricated 3/4-photo carousel.

[Six-error targeted follow-up](https://github.com/p13780811-debug/GTH-tour-travels-booking/actions/runs/39465001560)
**passed**, all six source lookups succeeded without additional licensed
hotel-photo matches. Effective source lookups: 166/166; pending candidates:
1; approved photos: **zero**. No media data added to Supabase.

## Publication release gate

All remaining properties require correctly licensed exact-property images
or owner/authorized-manager uploads. Existing
`/hotels/list-your-property` and `/admin/hotels` workflows provide
private submission and admin review. For owner-sourced images:
verify operator authority, property match, signed image-use permission,
actual exterior/room subject, photographer/license and file availability.

No "luxury photo" from another hotel can be substituted as an actual hotel.
A clearly labeled destination illustration may be used for UI ONLY after
separate rights review; such an illustration is never a hotel/gallery photo.

**Separate from PR #121**. Source branch for this work:
`gth-mumbai-thane-rera-ingestion` (PR #93). Original RERA importer,
existing OSM production schedules and website production unchanged.
GitHub Actions here only does source reads/tests and exports artifacts.
No secrets, commercial APIs, Supabase writes, production merge, Vercel
deployment or Phase-2 geographic expansion.
