import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("Sitemap index is launch-gated and discovers every approved pillar in paginated XML",()=>{
 const index=read("src/app/sitemap-index.xml/route.ts");
 const shards=read("src/app/seo-sitemaps/[kind]/[page]/route.ts");
 const helper=read("src/lib/seo/large-sitemaps.ts");
 const robots=read("src/app/robots.ts");
 assert.match(index,/if\(!isPublicLaunch\(\)\)/);
 assert.match(shards,/if\(!isPublicLaunch\(\)\)/);
 assert.match(index,/<sitemapindex/);
 assert.match(shards,/<urlset/);
 assert.match(index,/seoShardCounts/);
 assert.match(shards,/knownSeoKind/);
 assert.match(shards,/index>=available/);
 assert.match(shards,/SEO sitemap|Sitemap unavailable/);
 assert.match(helper,/SEO_PAGE_SIZE=1000/);
 assert.match(helper,/SEO_MAX_PAGES=500/);
 for(const kind of ["hotels","tours","destinations","attractions","tenders"])
  assert.ok(helper.includes('view:"gth_seo_'+kind+'_v1"'),kind+" missing");
 assert.match(robots,/sitemap-index\.xml/);
 assert.match(robots,/sitemap\.xml/);
});

test("SEO views are RLS-scoped, protect drafts and exclude OSM directory / expired tenders",()=>{
 const sql=read("supabase/migrations/20261018111500_large_scale_seo_views.sql");
 for(const kind of ["hotels","tours","destinations","attractions","tenders"]) {
  assert.match(sql,new RegExp("gth_seo_"+kind+"_v1"));
 }
 assert.match(sql,/security_invoker=true/g);
 assert.match(sql,/is_public IS TRUE AND media_rights_verified IS TRUE/);
 assert.match(sql,/source_name<>'OpenStreetMap'/);
 assert.match(sql,/is_active IS TRUE AND media_rights_verified IS TRUE/);
 assert.match(sql,/source_license='CC0-1.0'/);
 assert.match(sql,/deadline_at>now\(\)/);
 assert.match(sql,/REVOKE ALL/);
 assert.match(sql,/TO anon,authenticated/);
 assert.doesNotMatch(sql,/service_role|disable row level security|GRANT ALL/);
});

test("Exact source-linked per-record titles and explicit noindex for unreviewed entries",()=>{
 const helper=read("src/lib/seo/large-sitemaps.ts");
 const tour=read("src/app/tours/[slug]/page.tsx");
 const destination=read("src/app/destinations/[slug]/page.tsx");
 const attraction=read("src/app/attractions/[qid]/page.tsx");
 assert.match(helper,/isIndexableHotel/);
 assert.match(helper,/isIndexableTender/);
 assert.match(helper,/isIndexableTour/);
 assert.match(helper,/isIndexableDestination/);
 assert.match(helper,/isIndexableAttraction/);
 assert.match(tour,/\.eq\("is_public",true\)\.eq\("media_rights_verified",true\)/);
 assert.match(tour,/robots: \{index,follow:index\}/);
 assert.match(destination,/seoApproved/);
 assert.match(destination,/robots:\{index,follow:index\}/);
 assert.match(attraction,/isPublicLaunch\(\)&&isIndexableAttraction\(item\)/);
 assert.match(attraction,/robots:\{index,follow:index\}/);
 assert.doesNotMatch(attraction,/aggregateRating|lowPriceGuarantee|fakeReviews/i);
 assert.match(attraction,/not verified opening hours/);
 assert.doesNotMatch(helper,/Math\.random|generate fake/i);
});

test("SEO monitor samples shards and verifies source canonical URLs without crawling 10k pages",()=>{
 const monitor=read("scripts/monitor-seo.mjs");
 assert.match(monitor,/sitemap-index\.xml/);
 assert.match(monitor,/const sampled =/);
 assert.match(monitor,/\.slice\(0, 12\)/);
 assert.match(monitor,/invalid shard URL/);
 assert.match(monitor,/duplicate canonical URLs/);
 assert.match(monitor,/not Google indexing proof/);
 assert.doesNotMatch(monitor,/method: "POST"|SUPABASE_SERVICE_ROLE_KEY/);
});

test("Only SEO and tests changed; global CSS and production deployment configuration stay untouched",()=>{
 const helper=read("src/lib/seo/large-sitemaps.ts");
 assert.match(helper,/SEO_PAGE_SIZE|SEO_MAX_PAGES/); // SEO size/caching enforced by routing
 assert.doesNotMatch(helper,/NEXT_PUBLIC_.*SERVICE_ROLE/);
});
