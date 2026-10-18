import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Mapped city view only groups real ODbL source records and preserves caller RLS",()=>{
 const sql=read("supabase/migrations/20261018090000_osm_city_counts_discovery.sql");
 assert.match(sql,/WITH \(security_invoker = true\)/);
 assert.match(sql,/is_public=true/);
 assert.match(sql,/is_community_directory=true/);
 assert.match(sql,/lower\(btrim\(city\)\)/);
 assert.match(sql,/HAVING COUNT\(\*\) >= 2/);
 assert.match(sql,/REVOKE ALL ON public\.gth_osm_attraction_city_counts FROM PUBLIC/);
 assert.match(sql,/GRANT SELECT ON public\.gth_osm_attraction_city_counts TO anon,authenticated/);
 assert.doesNotMatch(sql,/service_role|SECURITY DEFINER|affiliate_link|price_numeric/);
});
test("Mapped city finder enforces safe filters and true count-based bounded pagination",()=>{
 const query=read("src/lib/travel/mappedCities.ts");
 assert.match(query,/gth_osm_attraction_city_counts/);
 assert.match(query,/Number\.isInteger\(filters\.page\)/);
 assert.match(query,/pageSize<=48/);
 assert.match(query,/count:"exact"/);
 assert.match(query,/\.range\(\(page-1\)\*pageSize,page\*pageSize-1\)/);
 assert.match(query,/\.eq\("country_code",filters\.country\)/);
 assert.match(query,/\.ilike\("city"/);
 assert.match(query,/from "@supabase\/supabase-js"/);
 assert.doesNotMatch(query,/Math\.random|SUPABASE_SERVICE_ROLE_KEY/);
});
test("Tours, Attractions, Guides, Blogs and Destinations surface actual mapped cities",()=>{
 const pages=[
  "src/app/tours/page.tsx","src/app/attractions/page.tsx","src/app/guides/page.tsx",
  "src/app/blog/page.tsx","src/app/destinations/page.tsx"
 ];
 for(const page of pages){
  const content=read(page);
  assert.match(content,/listMappedCities/,"Mapped source missing: "+page);
  assert.match(content,/MappedCityDiscovery/,"Rail missing: "+page);
 }
 const explorer=read("src/app/attractions/cities/page.tsx");
 assert.match(explorer,/robots:\{index:false,follow:true\}/);
 assert.match(explorer,/role="search"/);
 assert.match(explorer,/Next cities/);
 assert.match(explorer,/source-mapped places|source-tagged city/i);
 const rail=read("src/components/travel/MappedCityDiscovery.tsx");
 assert.match(rail,/TourCarousel/);
 assert.match(rail,/mappedCityLink/);
 assert.match(rail,/\.records\.toLocaleString/);
 assert.match(rail,/\.country_name/);
 assert.match(rail,/tours\?city=/);
 assert.match(rail,/hotels\/results\?city=/);
});
test("Editorial blog expands with at least 15 distinct original complete articles and existing images",()=>{
 const blog=read("src/data/blogs.ts"),expanded=read("src/data/blogExpansion.ts");
 assert.match(blog,/\.\.\.expandedBlogs/);
 const slugs=[...expanded.matchAll(/slug:"([a-z-]+)"/g)].map(x=>x[1]);
 assert.ok(slugs.length>=15,"Insufficient original editorial expansion");
 assert.equal(new Set(slugs).size,slugs.length,"Duplicate editorial slug");
 const texts=[...expanded.matchAll(/content:`([\s\S]*?)`/g)].map(x=>x[1]);
 assert.equal(texts.length,slugs.length);
 for(const article of texts){
  assert.ok(article.split(/\s+/).length>=150,"Incomplete/thin editorial article");
  assert.match(article,/## /);
  assert.doesNotMatch(article,/guaranteed ticket|live price at \$|Math\.random/i);
 }
 const images=[...expanded.matchAll(/image:"(\/images\/cities\/[^"]+)"/g)].map(x=>x[1]);
 assert.equal(images.length,slugs.length);
 for(const path of images)assert.ok(existsSync(new URL("../public"+path,import.meta.url)),path+" is missing");
});
