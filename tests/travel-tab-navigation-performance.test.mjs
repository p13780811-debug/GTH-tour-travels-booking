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

test("live source progress has bounded queries and each travel page has a hard navigation deadline",()=>{
 const osm=read("src/lib/travel/osmAttractions.ts");
 const sourceProgress=osm.slice(osm.indexOf("export async function sourceProgress()"));
 assert.ok(sourceProgress.includes('.limit(300).abortSignal(AbortSignal.timeout(5_000))'));
 assert.ok(sourceProgress.includes('.limit(8).abortSignal(AbortSignal.timeout(5_000))'));
 assert.ok(cached.includes("export async function withDiscoveryDeadline"));
 assert.ok(cached.includes("Promise.race"));
 assert.ok(cached.includes("clearTimeout"));
 const guides=read("src/app/guides/page.tsx"),attractions=read("src/app/attractions/page.tsx"),destinations=read("src/app/destinations/page.tsx");
 for(const route of [guides,attractions,destinations])assert.ok(route.includes("withDiscoveryDeadline("));
 assert.ok(guides.includes("withDiscoveryDeadline(cachedSourceProgress()).catch"));
 assert.ok(attractions.includes("withDiscoveryDeadline(listPlaces(f))"));
 assert.ok(destinations.includes("withDiscoveryDeadline(loadDestinations())"));
 assert.ok(destinations.includes(".abortSignal(AbortSignal.timeout(4_500))"));
 assert.ok(!osm.includes("service_role"),"read only with anonymous permissions");
});
