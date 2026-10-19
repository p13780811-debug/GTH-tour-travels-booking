# Integrated property explorer — 19 October 2026

The approved compact GTH PRO design replaces only the existing Real Estate
discovery content at `/real-estate`. It uses the existing public marketplace RPC,
listing detail routes, local shortlist and saved searches, filters, map, pagination,
enquiry flow and submission/account routes. Comparison is limited to three records.
Missing prices, specifications and photographs remain explicitly unrecorded.
Stored ranking, field coverage and GTH verification are explained separately.

The existing `Navbar`, `EstateHeader`, `RealEstateFooter`, Real Estate layout,
root rendered layout, policy pages and global CSS remain unchanged. New CSS uses
the existing theme variables and is scoped to the explorer and compact detail
typography. Responsive breakpoints provide a filter drawer and single-column cards.

## Consolidated release scope

- Include the explorer in PR90; do not merge PR93 or its MahaRERA scraper.
- Suppress Vercel Git previews on the integration/release branches. Release once
  from the final main commit after checks pass, then verify that exact production SHA.
- The unrelated OSM resume migration was rejected by automatic approval review.
  Its importer, gateway, workflow and progress changes remain preserved in PR87
  and are excluded from this release. Existing production OSM behavior is retained.
  No OSM migration or Edge Function replacement was applied by this release.
- The additive SEO eligibility views and exact-hotel-link overlay migration are
  applied. SEO views use SECURITY INVOKER and public SELECT grants only. Hotel
  link rows stay inactive unless separately reviewed and approved.
- The isolated simulated market-research route remains disabled by default until
  its source license discrepancy is resolved; no enabling flag is set by this release.

## Validation

Run TypeScript, ESLint, `npm run test:security`, Python ingestion unit tests and a
production build. Verify desktop search/reset, filter/sort, compare/remove,
shortlist, stored-coordinate map behavior, real listing details and policy links
through the deployed interface. Do not submit fake enquiries during QA.
