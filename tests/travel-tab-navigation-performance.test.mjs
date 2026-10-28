import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const nav=read("src/components/travel/TravelSectionNav.tsx");
const cached=read("src/lib/travel/cachedDiscovery.ts");
test("travel category tabs provide immediate accessible navigation feedback",()=>{
 for(const item of ['href:"/activities"','href:"/attractions"','href:"/destinations"','href:"/guides"'])
   assert.ok(nav.includes(item),item);
 assert.ok(nav.includes('setOpening({href,from:pathname})'));
 assert.ok(nav.includes('role="status" aria-live="polite"'));
 assert.ok(nav.includes("opening?.from===pathname"),"clear feedback when route changes");
});
test("adjacent slow destination routes have streaming loading fallbacks",()=>{
 for(const route of ["attractions","activities","destinations","guides"]){
  const loading=read("src/app/"+route+"/loading.tsx");
  assert.ok(loading.includes('aria-busy="true"'),route);
  assert.ok(loading.includes("<TravelSectionNav/>"),route);
 }
});
test("public OSM summaries are cached, not mocked or fetched for each page visit",()=>{
 assert.ok(cached.includes('unstable_cache('));
 assert.ok(cached.includes('revalidate:300'));
 assert.ok(cached.includes('sourceProgress()'));
 assert.ok(cached.includes('listMappedCities({pageSize:48})'));
 for(const file of ["attractions","destinations","guides"]){
  const source=read("src/app/"+file+"/page.tsx");
  assert.ok(source.includes("cachedHomepageCities()"),file);
 }
 assert.ok(read("src/app/attractions/page.tsx").includes("cachedSourceProgress()"));
 assert.ok(read("src/app/guides/page.tsx").includes("cachedSourceProgress()"));
 assert.ok(!cached.includes("service_role"));
});
