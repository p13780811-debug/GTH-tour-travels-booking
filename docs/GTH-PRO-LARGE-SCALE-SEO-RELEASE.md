# GTH PRO Production SEO — One consolidated release

## Current verified snapshot (2026-10-18)
- OSM hotel directory 19,786 rows; **not** independently approved bookable hotel listings.
- Tour rows 110; publication/media/source approvals are not yet present.
- Destination table 100 active; only original source and media-verified, substantial text records join the dynamic SEO feeds.
- Wikidata attractions are initially private and require independent approval and a sufficiently substantial description.
- These numbers are inventory metrics, not indexed Google URLs. No traffic or ranking guarantee.

## Production contract
- Preserve `/sitemap.xml` for GTH PRO core, curated destinations, blogs, approved older listings and guides.
- Add `/sitemap-index.xml`: an XML *sitemap index* linking the core sitemap and paged per-module XML child sitemaps.
- Add `/seo-sitemaps/{hotels|tours|destinations|attractions|tenders}/{page}.xml`, generated **on demand** (not build-time hardcoded `generateStaticParams`). Each shard contains at most 1,000 URLs, max 500 shards/module; new approved records appear as DB grows, without a code redeployment.
- One public Supabase **SECURITY INVOKER** RLS-respecting view per module; queries are anonymous/read-only and use exact publication/source/media controls. Default to noindex for unreviewed tour/destination/attraction detail records. Hotels already gate index eligibility.
- Only proper canonical, source-backed, independently approved rows enter the per-module sitemap. OSM community mapping is discovery information and remains **noindex** until a separate approved venue/content workflow exists.
- Titles/descriptions derived from public record name, city/country and genuine description. Never invent timings, entrance fees, ratings, luxury grades, rates, sold-out status or supplier bookings.
- No raw phone/customer data, Supabase service_role or private/unpublished records returned via SEO.

## Deployment and migration order (ONE production merge only)
1. Finish *all* SEO changes in a single feature branch, one consolidated commit/push, PR and CI.
2. Run tests, TypeScript, lint, root/destination/tour/hotel security checks, one complete production build and Real Estate integrity guard.
3. Apply the **additive** `20261018111500_large_scale_seo_views.sql` Supabase migration only when the complete branch passes. Existing live pages unaffected by the new read-only views until the final merge.
4. **Exactly one squash merge into main**. GitHub→Vercel auto deployment is the only release trigger; no manual Vercel calls, retries, promotions or partial deploys.
5. Verify GitHub SHA = Vercel production READY SHA and production page + sitemap HTTP 200 before claiming publicly live. Vercel quota reset **does not guarantee** failed builds will automatically retry.

## Search Console and SEO reality
- Submit **`https://www.gthproglobal.com/sitemap-index.xml`** in Google Search Console once live; `robots.txt` also exposes it.
- Existing `/sitemap.xml` remains valid. Google can independently discover both.
- Monitor core sitemap daily and sample up to 12 sitemap shards, at most three canonical pages per selected shard. Test site status, <title>, source-specific description, canonical and noindex. This is health monitoring, **not** evidence that Google has indexed/ranked any page.
- Google sitemap per-file limit 50,000 URLs or 50 MB; GTH PRO uses conservative 1,000-URL shards.
- Even 30,000 public records do **not** necessarily become 30,000 quality indexable pages. Google may skip thin, duplicate, unavailable or weak content; encourage meaningful licensed photos, original destination guides, internal links, availability verification and actual visitor usefulness.

## Source and business approval policy
- Real Estate untouched (PR1–6 protected).
- Hotels: independently approved supplier/owner public records, source URL and permitted media; no OSM hotel directory SEO flood.
- Tours: real published supplier records, appropriate media permission, approved external booking URL, identifiable provider/source. A destination guide is not a sellable tour.
- Destinations: known curated editorial cities or source-backed active DB rows with approved rights and substantial original text.
- Attractions: approved Wikidata CC0 name/coordinates, explanatory text and individually licensed Commons photos if present. Bare OSM community listings stay noindex.
- Tenders: verified public notices with genuine future deadlines and meaningful summaries; expired tenders drop from live sitemaps.

## Rollback
- A rollback of the website can revert the UI/sitemap routes without deleting new read-only SQL views. No data import or destructive migration is part of this release. Never force deployment or recreate indexes just to work around Vercel quota.
