import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const read=path=>readFileSync(path,"utf8");
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(read("src/lib/travel/osm-place.ts"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module:mod,exports:mod.exports,URL,URLSearchParams,require:name=>{assert.equal(name,"./cruise-provider-search");return {GETYOURGUIDE_PARTNER_ID:"DF3NBKA"};}});
const api=mod.exports;
const row={source_id:"way/987654321",name:"Fort São João",category:"fort",region_scope:"world",city:"Porto",country_code:"PT",country_name:"Portugal",source_url:"https://www.openstreetmap.org/way/987654321",source_license:"ODbL-1.0",latitude:41.148,longitude:-8.675,updated_at:"2026-11-08T09:00:00Z",wikidata_qid:"Q123"};
test("all OSM identity types have stable canonical paths without numeric precision loss",()=>{
 for(const kind of ["node","way","relation"]){const id=kind+"/9999999999999999999";const path=api.osmPlacePath(id);assert.equal(path,"/attractions/osm/"+kind+"-9999999999999999999");assert.equal(api.osmSourceId(path.split("/").at(-1)),id);}
 for(const value of ["node-0","way-01","node-1?next=evil","node-1/evil","node/12","relation-1e10","relation-12345678901234567890"])assert.equal(api.osmSourceId(value),null);
});
test("OSM quality gate permits sourced location facts, excluding generic names and damaged provenance",()=>{
 assert.equal(api.isIndexableOsmPlace(row),true);
 for(const patch of [{name:"Park"},{name:"Unnamed"},{country_code:null},{country_code:"XXY"},{source_url:"https://www.openstreetmap.org.evil/way/987654321"},{source_license:"unknown"},{latitude:NaN},{longitude:181},{category:"private-villa"}])assert.equal(api.isIndexableOsmPlace({...row,...patch}),false,JSON.stringify(patch));
 assert.equal(api.validOsmPlace({...row,name:"Park"}),true,"generic records remain usable without indexing");
});
test("partner handoffs keep source context, confirmed affiliate IDs and fixed destinations without product invention",()=>{
 const links=api.osmPlaceLinks({...row,name:"Fort & Museum / São João"});
 const tracked=new URL(links.klook);assert.equal(tracked.origin,"https://tp.media");assert.equal(tracked.searchParams.get("campaign_id"),"137");assert.equal(tracked.searchParams.get("marker"),"417668");
 const target=new URL(tracked.searchParams.get("u"));assert.equal(target.origin,"https://www.klook.com");assert.equal(target.pathname,"/en-IN/search/result/");assert.equal(target.searchParams.get("query"),"Fort & Museum / São João Porto Portugal");
 const gyg=new URL(links.getyourguide);assert.equal(gyg.hostname,"www.getyourguide.com");assert.equal(gyg.pathname,"/s/");assert.equal(gyg.searchParams.get("partner_id"),"DF3NBKA");assert.match(gyg.searchParams.get("q"),/São João Porto Portugal/);
 assert.equal(links.tours,"/tours?city=Porto");assert.equal(new URL(links.directions).searchParams.get("destination"),"41.148,-8.675");
 assert.equal(api.osmPlaceLinks({...row,city:null}).tours,"/tours");
 assert.equal(api.osmPlaceLinks({...row,city:"https://evil.example"}).tours,"/tours");
});
test("metadata and structured data describe real source facts without prices, ratings, facilities or ticket offers",()=>{
 const seo=api.osmPlaceSeo(row),schema=api.osmPlaceSchema(row,"https://www.gthproglobal.com/attractions/osm/way-987654321");
 assert.match(seo.title,/Fort São João in Porto, Portugal/);assert.match(seo.description,/directions/);
 assert.equal(schema["@type"],"TouristAttraction");assert.equal(schema.geo.latitude,row.latitude);assert.ok(schema.sameAs.includes(row.source_url));
 assert.equal(schema.subjectOf.isBasedOn,row.source_url);assert.equal(schema.subjectOf.url,schema.url);assert.equal(schema.subjectOf.dateModified,"2026-11-08T09:00:00.000Z");
 assert.doesNotMatch(JSON.stringify(schema),/aggregateRating|openingHours|isAccessibleForFree|offers|priceCurrency|amenityFeature/);
 assert.equal(api.osmPlaceSchema({...row,updated_at:"invalid"},"https://example.test").subjectOf,undefined);
});
test("on-demand pages, discovery links and separate OSM sitemap preserve existing sitemap sources",()=>{
 const page=read("src/app/(mapped-places)/attractions/osm/[id]/page.tsx");
 assert.match(page,/revalidate=86400/);assert.match(page,/generateStaticParams\(\)\{return \[\];\}/);assert.match(page,/dynamicParams=true/);
 assert.match(page,/getOsmPlace\(id\)/);assert.match(page,/isPublicLaunch\(\)&&isIndexableOsmPlace\(item\)/);
 assert.match(page,/notFound\(\)/);assert.match(page,/prefetch=\{false\}/);assert.match(page,/not a confirmed ticket/);for(const route of ["bus","train","ferry"])assert.ok(page.includes('"/'+route+'"'));
 for(const path of ["src/app/attractions/page.tsx","src/components/travel/OSMAttractionsRail.tsx"])assert.match(read(path),/href=\{osmPlacePath\(place.source_id\)!\}/);
 assert.match(read("src/app/robots.ts"),/attractions\/sitemap\.xml/);
 assert.match(read("src/app/sitemap-index.xml/route.ts"),/seoShardCounts/);
 assert.match(read("scripts/monitor-seo.mjs"),/validOsmShards.slice\(0, 2\)/);
 assert.doesNotMatch(page,/fetch\(|iframe|api\.travelpayouts|SUPABASE_SERVICE_ROLE/);
});
export {row};
