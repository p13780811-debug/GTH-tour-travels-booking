# GTH PRO — Consolidated Post-PR90 Quality Release

Status: DRAFT / NOT APPROVED FOR DEPLOYMENT

This branch accumulates post-PR90 fixes in one reviewable release. Do not merge to main, trigger production deployment, or change existing ecosystem navigation/footer/legal policies until all checks pass and the owner approves a single release.

## Confirmed issues to address
- Mobile destination guide section "Popular in India" scroll jank; profile image loading, carousel behavior and mobile paint/layout before optimizing.
- Tours discovery empty results: inspect public tours inventory, RLS and publication/media rights; never fabricate tours. Do not display nonfunctional rating sort (public tour rating currently null).
- Supabase ingestion-to-publication visibility: validate existing queries, RLS, published filters and freshness; do not assume imported OSM map points are bookable tours.
- First-visit stale content from Google search: reproduce direct landing, soft navigation and hard reload, then identify cache layer before changing caching policies.
- Destination catalogue pagination ceiling (existing loader stops at 1200 records).
- Mobile regression checks, booking links, tests, and production build.

- Global hotels: audit Dubai and other international destinations for absent imported records versus city/country query mismatches; verify actual country coverage before making availability claims.
- Hotel media: measure Mumbai/Goa missing-photo rates; enrich only exact-property licensed images with source attribution, never unrelated stock or fabricated images.
- Destination-to-hotel links: verify destination slug, city and country routing end-to-end, and ensure a meaningful honest empty state when no records exist.

- Worldwide multi-source hotel ingestion: audit prior Kaggle CSV provenance/license and actual geographic coverage before treating it as Europe-only; inventory OSM/Geofabrik and partner sources by country, including UAE/Dubai; add resumable, deduplicated, quota-aware cloud ingestion only from authorized sources.
- Verify per-country imported/published/searchable/photo-covered counts and destination-to-hotel routes; never conflate accommodation directory entries with confirmed bookable inventory.

- Destination-first visual discovery: add image-rich country and destination rails on Hotels, Tours, Activities and other relevant landing pages using real licensed destination media and verified inventory imagery where available. Keep cards light on mobile and avoid blank first impressions.
- Clearly distinguish inspirational destination imagery from specific hotel/tour/property media and from bookable inventory. Show honest empty search results, never imply a hotel or tour exists solely from a destination cover photo.
- Respect source attribution, responsive image sizes, lazy loading, accessibility and mobile scroll performance; preserve existing global header/footer and navigation.

## Release guardrails
- Keep MahaRERA/OSM importer deployment independent of website deploys. Data-only updates must not trigger Vercel builds.
- Preserve source attribution, data rights, user privacy, existing Real Estate behavior, SEO canonicals, and global ecosystem shell.
- Do not merge or deploy this draft until all changes and regression tests are complete.
- No fabricated hotel/tour/property inventory or placeholder data presented as verified.
