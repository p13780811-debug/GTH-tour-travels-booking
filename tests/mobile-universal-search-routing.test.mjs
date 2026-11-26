import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function moduleFrom(path,required={}){
 const obj={exports:{}};
 const js=ts.transpileModule(read(path),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(js,{module:obj,exports:obj.exports,require:key=>{
  if(!(key in required))throw Error("Unexpected import "+key);
  return required[key];
 },URL,URLSearchParams,RegExp,Date},{timeout:2000});
 return obj.exports;
}
const {destinations}=moduleFrom("src/data/destinations.ts");
const stadiums=moduleFrom("src/lib/travel/stadiums.ts");
const venues=moduleFrom("src/lib/travel/stadium-ticket-routing.ts",{"./stadiums":stadiums});
const route=moduleFrom("src/lib/mobile/universal-search.ts",{"@/data/destinations":{destinations},"@/lib/travel/stadium-ticket-routing":venues});
const href=(q,c)=>route.resolveUniversalTarget(q,c).href;

test("City hotel queries open Nuitee booking, not the local directory",()=>{
 for(const query of ["Goa hotel","hotels in Goa","Goa hotels","hotel Goa","find rooms in Goa"]){
  assert.equal(href(query),"/app/hotels?view=booking&city=Goa",query);
 }
 assert.equal(href("Taj hotel in Goa"),"/app/hotels?view=booking&city=Goa&name=Taj");
 assert.equal(href("Hotels in Mumbai"),"/app/hotels?view=booking&city=Mumbai");
 assert.equal(href("hotels near Palava"),"/app/hotels?view=booking&city=Palava");
 assert.equal(href("The Taj Palace hotel"),"/app/hotels?view=booking&name=The+Taj+Palace");
});
test("Eden Gardens routes only to Kolkata reviewed venue, never Australia tours",()=>{
 assert.equal(href("Eden Gardens"),"/stadiums/eden-gardens");
 assert.equal(href("Eden Gardens stadium tickets"),"/stadiums/eden-gardens");
 assert.equal(href("Kolkata Eden Gardens tickets","ticket"),"/stadiums/eden-gardens");
 assert.equal(href("Eden","ticket"),"/tickets?q=Eden");
 assert.equal(href("Sweden tickets","ticket"),"/tickets?q=Sweden+tickets");
 assert.equal(href("Kolkata tickets","ticket"),"/tickets?q=Kolkata+tickets");
});
test("existing specialist engines receive compatible query keys",()=>{
 assert.equal(href("road construction tender"),"/app/tenders?q=road+construction");
 assert.equal(href("Lodha project","property"),"/app/property?q=Lodha+project");
 assert.equal(href("apartments in Mumbai"),"/search?q=apartments+in+Mumbai&category=property");
 assert.equal(href("Maharera registry project"),"/real-estate/registry?q=Maharera+project");
 assert.equal(href("flight from CCU to BOM"),"/app/flights");
 assert.equal(href("Goa tours"),"/tours?city=Goa");
 assert.equal(href("visit Goa"),"/app/destinations?q=Goa");
 assert.equal(href("Goa"),"/app/explore?q=Goa#search-results");
 assert.equal(href("Goa","travel"),"/app/destinations/goa");
 assert.equal(href("","hotel"),"/app/hotels");
});
test("unsafe URL content is only encoded as text, never used as redirect destination",()=>{
 const bad=["https://evil.example","//evil.example","http://host/path","javascript:alert(1)"];
 for(const text of bad){
  const link=href(text);
  assert.ok(link.startsWith("/"),link);
  assert.ok(!link.startsWith("//"),link);
 }
 assert.equal(href("Goa hotel","__proto__"),"/app/hotels?view=booking&city=Goa");
 assert.equal(route.normalizeUniversalCategory("__proto__"),"all");
});
test("all entry points use the same dispatcher; old Explore URLs redirect on specialist intent",()=>{
 const home=read("src/components/mobile/MobileAppDashboard.tsx");
 const explorer=read("src/app/app/explore/page.tsx");
 const dispatcher=read("src/app/app/search/page.tsx");
 const catalog=read("src/lib/mobile/catalog.ts");
 const hotelPage=read("src/app/app/hotels/page.tsx");
 const rail=read("src/components/mobile/MobileDiscoveryRail.tsx");
 assert.match(home,/form action="\/app\/search"/);
 assert.match(explorer,/form action="\/app\/search"/);
 assert.match(dispatcher,/resolveUniversalTarget\(params.q,params.category\)/);
 assert.match(dispatcher,/redirect\(appSearchHref\(target,params.q\)\)/);
 assert.match(explorer,/resolveUniversalTarget\(q,pillar\)/);
 assert.match(explorer,/if\(target.category!=="all"\)redirect\(appSearchHref\(target,q\)\)/);
 assert.match(explorer,/id="search-results"/);
 assert.match(hotelPage,/query.directory==="1"/);
 assert.match(catalog,/if\(destination\)/);
 assert.match(catalog,/city\.ilike\./);
 assert.ok(catalog.includes('const hint="%"+escapeLike(match.name)+"%";'));
 assert.match(catalog,/href:"\/app\/hotels\/osm:"/);
 assert.match(rail,/mobileAppHref\(item.href\)/);
 assert.doesNotMatch(dispatcher,/createClient|service_role|SUPABASE_SERVICE_ROLE/);
});

test("website-only tools open through an app confirmation without losing search context",()=>{
 for (const [query, category, id, website] of [
  ["Eden Gardens", "ticket", "tickets", "/stadiums/eden-gardens"],
  ["Goa tours", "tour", "tours", "/tours?city=Goa"],
  ["apartments in Mumbai", "property", "property-search", "/search?q=apartments+in+Mumbai&category=property"],
  ["rera registry Thane", "property", "property-registry", "/real-estate/registry?q=Thane"],
 ]) {
  const target=route.resolveUniversalTarget(query,category);
  const app=new URL(route.appSearchHref(target, query),"https://example.test");
  assert.equal(app.pathname,"/app/services/"+id);
  assert.equal(app.searchParams.get("q"),query);
  const fallback=id==="property-registry"?"/real-estate/registry":"/"+id;
  assert.equal(route.appServiceWebsiteHref(id,fallback,query),website);
 }
 assert.equal(route.appSearchHref(route.resolveUniversalTarget("Mumbai property"),"Mumbai property"),"/app/property?q=Mumbai");
});

test("explicit itinerary intent opens native package planner without overriding business searches",()=>{assert.equal(href("plan my trip"),"/app/packages");assert.equal(href("holiday package Tokyo"),"/app/packages");assert.notEqual(href("tender bid package"),"/app/packages");assert.equal(href("Tokyo hotels","hotel"),"/app/hotels?view=booking&city=Tokyo");});
