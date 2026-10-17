import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Editorial content is separate from ODbL raw inventory and includes FAQs and itineraries",()=>{
 const catalog=read("src/lib/travel/guideCatalog.ts");
 for(const s of ['slug:"india"','slug:"france"','slug:"australia"','slug:"dubai"','slug:"paris"','slug:"mumbai"','slug:"goa"','paris/eiffel-tower-nearby-things-to-do'])assert.ok(catalog.includes(s),s);
 assert.match(catalog,/dayPlan:/);
 assert.match(catalog,/threeDayPlan:/);
 assert.match(catalog,/faq:/);
 assert.doesNotMatch(catalog,/Math\.random/);
});
test("Guides require approved editorial state and rights-cleared hero images for SEO",()=>{
 const sql=read("supabase/migrations/20261017233000_travel_guide_editorial_media.sql");
 const media=read("src/lib/travel/guideMedia.ts");
 const route=read("src/app/guides/[slug]/page.tsx");
 const sitemap=read("src/app/sitemap.ts");
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/g);
 assert.match(sql,/status<>'published' OR editorial_reviewed_at IS NOT NULL/);
 assert.match(sql,/NOT editorial_approved OR rights_reviewed_at IS NOT NULL/);
 assert.match(media,/publishedMedia/);
 assert.match(media,/GUIDE_CONTENT_VERSION/);
 assert.match(route,/robots:\{index:ready,follow:true\}/);
 assert.match(sitemap,/indexableGuidePaths/);
 assert.doesNotMatch(sql,/SUPABASE_SERVICE_ROLE_KEY/);
});
test("Four horizontal destination rails are additive and existing importer remains untouched",()=>{
 const page=read("src/app/attractions/page.tsx");
 const rail=read("src/components/travel/GuideDiscoveryRails.tsx");
 const details=read("src/components/travel/GuideDetail.tsx");
 assert.match(page,/GuideDiscoveryRails/);
 assert.match(page,/sourceProgress/);
 assert.match(page,/robots:\{index:false,follow:true\}/);
 assert.match(rail,/TourCarousel/);
 assert.match(details,/affiliate-disclosure/);
 assert.match(details,/OpenStreetMap contributors/);
});
test("Commons review automation proposes images but cannot publish, with no secrets",()=>{
 const workflow=read(".github/workflows/gth-guide-media-review.yml");
 const script=read("scripts/attractions/guide_media_candidates.py");
 assert.match(workflow,/cron: "17 2 \* \* \*"/);
 assert.match(script,/editorial_approved.*False/);
 assert.match(script,/auto_publish.*False/);
 assert.doesNotMatch(workflow,/SUPABASE_SERVICE_ROLE_KEY|secrets\./);
});


test("guide discovery shows actual imported source counts and sorts by source coverage",()=>{
 const guides=read("src/app/guides/page.tsx");
 const rail=read("src/components/travel/GuideDiscoveryRails.tsx");
 assert.match(guides,/sourceProgress\(\)/);
 assert.match(guides,/countries=\{progress\?\.countries\?\?\[\]\}/);
 assert.match(rail,/counts\.get\(second\.countryCode\)/);
 assert.match(rail,/Country directory: /);
 assert.match(rail,/Import in progress/);
 assert.match(rail,/href="\/ai-trip"/);
 assert.match(rail,/\/hotels\/results\?city=/);
});
test("guide funnel uses existing live city-filtered hotel, trip and insurance routes",()=>{
 const detail=read("src/components/travel/GuideDetail.tsx");
 assert.match(detail,/\/hotels\/results\?city=/);
 assert.match(detail,/name:"Plan a trip",href:"\/ai-trip"/);
 assert.match(detail,/name:"Travel insurance",href:"\/insurance"/);
 assert.match(detail,/affiliate-disclosure/);
 assert.doesNotMatch(detail,/\/esim|\$\d+|book now for/i);
});
