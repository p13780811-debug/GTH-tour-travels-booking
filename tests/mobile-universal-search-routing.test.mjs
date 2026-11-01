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
const route=moduleFrom("src/lib/mobile/universal-search.ts",{"@/data/destinations":{destinations}});
const href=(q,c)=>route.resolveUniversalTarget(q,c).href;

test("Goa hotel and other curated city stays go directly to existing app hotel results",()=>{
 for(const query of ["Goa hotel","hotels in Goa","Goa hotels","hotel Goa","find rooms in Goa"]){
  assert.equal(href(query),"/app/hotels?directory=1&destination=goa",query);
 }
 assert.equal(href("Taj hotel in Goa"),"/app/hotels?directory=1&destination=goa&q=Taj");
 assert.equal(href("Hotels in Mumbai"),"/app/hotels?directory=1&destination=mumbai");
 assert.equal(href("hotels near Palava"),"/hotels/results?city=Palava");
 assert.equal(href("The Taj Palace hotel"),"/app/hotels?directory=1&q=The+Taj+Palace");
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
 assert.equal(href("Goa hotel","__proto__"),"/app/hotels?directory=1&destination=goa");
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
 assert.match(dispatcher,/redirect\(target.href\)/);
 assert.match(explorer,/resolveUniversalTarget\(q,pillar\)/);
 assert.match(explorer,/if\(target.category!=="all"\)redirect\(target.href\)/);
 assert.match(explorer,/id="search-results"/);
 assert.match(hotelPage,/query.directory==="1"/);
 assert.match(catalog,/if\(destination\)/);
 assert.match(catalog,/city\.ilike\./);
 assert.match(catalog,/href:"\/app\/hotels\/osm:"/);
 assert.match(rail,/mobileAppHref\(item.href\)/);
 assert.doesNotMatch(dispatcher,/createClient|service_role|SUPABASE_SERVICE_ROLE/);
});
