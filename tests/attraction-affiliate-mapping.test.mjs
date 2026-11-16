import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(path,"utf8");
function compile(path,dependencies){
 const mod={exports:{}};
 vm.runInNewContext(ts.transpileModule(read(path),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
 }}).outputText,{module:mod,exports:mod.exports,URL,URLSearchParams,
  require:name=>{
   assert.ok(Object.hasOwn(dependencies,name),"unexpected dependency: "+name);
   return dependencies[name];
  }},{timeout:3000});
 return mod.exports;
}
const source=compile("src/lib/travel/osm-place.ts",{
 "./cruise-provider-search":{GETYOURGUIDE_PARTNER_ID:"DF3NBKA"},
});
const mapper=compile("src/lib/travel/attraction-affiliate-mapping.ts",{
 "./osm-place":source,
});
const row={
 source_id:"way/987654321",name:"Fort São João",category:"fort",
 region_scope:"world",city:"Porto",country_code:"PT",country_name:"Portugal",
 source_url:"https://www.openstreetmap.org/way/987654321",
 source_license:"ODbL-1.0",latitude:41.148,longitude:-8.675,
};
const get=provider=>mapper.mapAttractionAffiliateDiscovery(row).links.find(link=>link.provider===provider);

test("reuses exact GTH tracking and discovery URLs without new supplier requests",()=>{
 const v=mapper.mapAttractionAffiliateDiscovery(row);
 assert.equal(v.status,"search_available");
 assert.equal(v.bookable_on_gth,false);
 assert.equal(v.exact_product_match,false);
 assert.equal(v.requires_supplier_api,false);
 assert.equal(v.links.length,3);
 const original=source.osmPlaceLinks(row);
 assert.equal(get("klook").href,original.klook);
 assert.equal(get("getyourguide").href,original.getyourguide);
 assert.equal(get("wegotrip").href,original.tours);
 const tp=new URL(get("klook").href);
 assert.equal(tp.origin,"https://tp.media");
 assert.equal(tp.searchParams.get("marker"),"417668");
 assert.equal(new URL(tp.searchParams.get("u")).hostname,"www.klook.com");
 const gyg=new URL(get("getyourguide").href);
 assert.equal(gyg.hostname,"www.getyourguide.com");
 assert.equal(gyg.searchParams.get("partner_id"),"DF3NBKA");
 assert.equal(gyg.searchParams.get("q"),"Fort São João Porto Portugal");
 assert.equal(get("wegotrip").href,"/tours?city=Porto");
 for(const link of v.links){
  assert.equal(link.intent,"discovery_only");
  assert.equal(link.exact_product_match,false);
  assert.equal(link.date_specific_availability,false);
 }
});

test("untrusted or unpublished source shapes never produce outbound links",()=>{
 for(const patch of [
  {source_id:"way/0001"}, {source_id:"way/1?redirect=https://evil.invalid"},
  {source_url:"https://www.openstreetmap.org.evil.invalid/way/987654321"},
  {source_license:"unknown"}, {latitude:999}, {category:"non-attraction"},
  {name:"X"}, {source_id:"way/987654321;drop table tours"},
 ]){
  const result=mapper.mapAttractionAffiliateDiscovery({...row,...patch});
  assert.equal(result.status,"invalid_source",JSON.stringify(patch));
  assert.equal(result.links.length,0);
 }
});

test("source strings remain URL query data, never a redirect destination",()=>{
 const crafted={...row,name:"Fort & Museum / São João",city:"https://attacker.example"};
 const value=mapper.mapAttractionAffiliateDiscovery(crafted);
 const gyg=new URL(value.links.find(x=>x.provider==="getyourguide").href);
 const klook=new URL(value.links.find(x=>x.provider==="klook").href);
 assert.equal(gyg.origin,"https://www.getyourguide.com");
 assert.equal(klook.origin,"https://tp.media");
 assert.match(gyg.searchParams.get("q"),/https:\/\/attacker.example/);
 assert.equal(value.links.find(x=>x.provider==="wegotrip").href,"/tours");
 assert.equal(new URL(klook.searchParams.get("u")).hostname,"www.klook.com");
});

test("maps arbitrary existing OSM page identities on demand with bounded output",()=>{
 for(let i=1;i<=350;i++){
  const place={...row,source_id:"node/"+i,source_url:"https://www.openstreetmap.org/node/"+i,
   name:"World attraction "+i};
  const mapped=mapper.mapAttractionAffiliateDiscovery(place);
  assert.equal(mapped.status,"search_available");
  assert.equal(mapped.links.length,3);
  assert(mapped.links.every(x=>x.href.length<2048));
 }
});

test("additive public API contract leaves page generator, ISR, SEO and RLS untouched",()=>{
 const api=read("src/app/api/travel/osm-attractions/route.ts");
 const page=read("src/app/(mapped-places)/attractions/osm/[id]/page.tsx");
 const reader=read("src/lib/travel/osm-place-reader.ts");
 const mapping=read("src/lib/travel/attraction-affiliate-mapping.ts");
 assert.match(api,/items:result\.items\.map\(item=>\(\{\.\.\.item/);
 assert.match(api,/partner_discovery:mapAttractionAffiliateDiscovery\(item\)/);
 assert.match(api,/verified_tickets:false,available_for_booking:false/);
 assert.match(api,/const result=await listPlaces\(filters\)/);
 assert.match(page,/revalidate=86400/);
 assert.match(page,/generateStaticParams\(\)\{return \[\];\}/);
 assert.match(page,/dynamicParams=true/);
 assert.match(page,/isPublicLaunch\(\)&&isIndexableOsmPlace\(item\)/);
 assert.match(page,/osmPlaceLinks\(item\)/);
 assert.match(page,/not a confirmed ticket/);
 assert.match(reader,/\.eq\("is_public",true\)\.eq\("is_community_directory",true\)/);
 assert.doesNotMatch(mapping,/SUPABASE_SERVICE_ROLE_KEY|\.from\(|fetch\(|createClient|redirect\(|process\.env/);
 assert.doesNotMatch(api,/SUPABASE_SERVICE_ROLE_KEY|\.from\(|createClient/);
});
