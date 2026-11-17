# GTH PRO: source-first hyper-local SEO

## Architecture

- /real-estate/markets: public discovery hub linked from the existing Real Estate page and sitemap.
- /real-estate/[country]/[region]: cached regional directory. Under the hood it reuses the already existing [slug] dynamic segment to avoid a Next.js parameter-name collision.
- /real-estate/[country]/[region]/[locality]: six-hour on-demand ISR, Next unstable_cache, public RLS-scoped Supabase anon reads. No service role, large build-time generation, third-party API, theme rewrite or bulk database import.
- Bounded reads: 18 project records, 18 published/verified marketplace offers, 5 active source-verified regional tender notices and up to 160 local OSM hotel candidates within a geo-bounding box (five closest at most after exact Haversine distance).
- Marketplace offers and OSM hotels have separate data/booking sources. Hotel directory entries are not evidence of bookability. Tender labels indicate regional not street-level relevance.
- Dynamic canonical, OpenGraph and robots metadata. Default factual CollectionPage / Place / ItemList / BreadcrumbList JSON-LD. Conditional RealEstateListing only for real published verified offers, and conditional LodgingBusiness only when public OSM source provides name, address and coordinates. Never misrepresent GTH PRO as having a physical office in every locality.
- Indexing is disabled on evidence-poor micro-location pages. More than a slug or a generic city reference is needed. Google indexing is not guaranteed.

## 812-record legacy RERA audit — 17 November 2026

The Supabase public.properties table contains 812 source_type=rera rows from May 21-23, 2026. 784 have district, taluka and village. All 812 have PIN and latitude/longitude and old verified=true, but zero have official_source_url. The generic city=Mumbai was hardcoded even for Pune, Raigarh, Nashik and Thane districts. The original raw_json.land.locality is populated in 459 rows, often as a street or landmark rather than a controlled area label. Some historical coordinates are repeated for entirely different districts. In parallel, the separate 11,747 source_type=registry records have district but no filled locality, taluka or village.

Therefore exact village or locality labels may be displayed as historical research records, but must NOT establish official verification, geocoded hotel distance, current project status or sale availability. Legacy geotags are excluded from nearest-hotel calculations until a trustworthy source identity corroborates them. The old geo candidate is quarantined, never silently overwritten.

## Recovery and India source expansion

The historical RERA V5 source exists in commit b27bf98, but that Selenium scraper exposed a generic Mumbai city, four table cells and uncontrolled paging/upserts. The 812 May 21-23 rows have nested land/geo JSON and were not proven to originate from that exact V5 source. A V9 name in propertyService.ts is a UI/search engine, not an authenticated ingestion source; the exact V7/V9 import provenance remains unknown.

The offline-only legacy_recovery.py retains district, taluka, village, optional land locality and PIN; rejects conflicting source/geo inputs; does not propagate city=Mumbai; quarantines duplicate cross-district points; does not write to the DB. The India source catalog represents independently listed state/UT RERA authorities rather than assuming MahaRERA covers the whole country. The MoHUA directory is https://www.mohua.gov.in/documents/acts-and-policies/rera-YDM4EzMtQWa. Each regulator still requires its own licensed downloadable source or documented authorized endpoint, format validation and run caps. Neither the catalog nor the universal identity adapter proves all-India project inventory exists.

## Release gates

PR #218 and #220 must remain unmerged until the user approves their joint main merge and all exact-head TypeScript, ESLint, Node tests, Python import validation, PostgreSQL RLS tests and Next production builds pass. Never run the old Selenium importer against government portals without source permission, safe pacing and a deduplicated, approved writer. No permanent cron or source ingestion is activated as part of these changes.
