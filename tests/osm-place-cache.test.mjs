import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function harness(){
 let now=0,failed=false,launched=true,enabled=true;
 const calls=[],cacheOptions=[];
 const source={source_id:"node/123",name:"Fixture Heritage Fort",category:"fort",region_scope:"india",city:"Mumbai",country_code:"IN",country_name:"India",source_url:"https://www.openstreetmap.org/node/123",source_license:"ODbL-1.0",latitude:19.1,longitude:72.8,updated_at:"2026-11-08T00:00:00Z"};
 const env={NEXT_PUBLIC_SUPABASE_URL:"https://test.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY:"anon-fixture",get GTH_OSM_PLACE_PAGES_ENABLED(){return enabled?"true":"false";}};
 function compile(path,deps){const m={exports:{}};vm.runInNewContext(ts.transpileModule(readFileSync(path,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,URL,Response,Request,process:{env},AbortSignal,Date,require:name=>{if(name in deps)return deps[name];throw Error("Unexpected dependency "+name);}});return m.exports;}
 const caches={unstable_cache(fn,key,opts){cacheOptions.push(opts);const values=new Map();return async(...args)=>{const key=JSON.stringify(args),entry=values.get(key);if(entry&&now-entry.time<opts.revalidate*1000)return entry.value;const value=await fn(...args);values.set(key,{time:now,value});return value;};}};
 const db={from(table){const call={table,ops:[]};calls.push(call);let single=false;const q=new Proxy({}, {get(_t,key){if(key==="then")return (resolve,reject)=>Promise.resolve(failed?{data:null,error:{message:"private-database-error"}}:{error:null,data:table==="gth_osm_attraction_country_counts"?[{country_code:"IN",records:125432},{country_code:"US",records:48799}]:single?{...source}:[{...source}]}).then(resolve,reject);return (...args)=>{call.ops.push([key,...args]);if(key==="maybeSingle")single=true;return q;};}});return q;}};
 const shared={"server-only":{},"next/cache":caches,"@supabase/supabase-js":{createClient:(url,key)=>{assert.equal(key,"anon-fixture");return db;}}};
 const contract=compile("src/lib/travel/osm-place.ts",{"./cruise-provider-search":{GETYOURGUIDE_PARTNER_ID:"DF3NBKA"}});
 const reader=compile("src/lib/travel/osm-place-reader.ts",{...shared,react:{cache:fn=>fn},"./osm-place":contract});
 const site={isPublicLaunch:()=>launched,siteOrigin:()=>"https://www.gthproglobal.com"};
 const sitemaps=compile("src/lib/seo/osm-sitemaps.ts",{...shared,"./site":site,"@/lib/travel/osm-place":contract,"@/lib/travel/osm-place-reader":reader});
 const index=compile("src/app/attractions/sitemap.xml/route.ts",{"@/lib/seo/osm-sitemaps":sitemaps,"@/lib/seo/site":site});
 const route=compile("src/app/attractions/sitemaps/[country]/[page]/route.ts",{"@/lib/seo/osm-sitemaps":sitemaps,"@/lib/seo/site":site});
 return {source,reader,sitemaps,index,route,calls,cacheOptions,advance:ms=>now+=ms,fail:value=>failed=value,launch:value=>launched=value,enabled:value=>enabled=value};
}
test("24-hour shared point cache deduplicates reads and refreshes changed source facts after expiry",async()=>{
 const h=harness();assert.equal((await h.reader.getOsmPlace("node-123")).name,"Fixture Heritage Fort");
 h.source.name="Updated Fort";
 for(let i=0;i<50;i++)assert.equal((await h.reader.getOsmPlace("node-123")).name,"Fixture Heritage Fort");
 assert.equal(h.calls.length,1);h.advance(86400001);
 assert.equal((await h.reader.getOsmPlace("node-123")).name,"Updated Fort");assert.equal(h.calls.length,2);
 assert.ok(h.cacheOptions.every(o=>o.revalidate===86400));
 const ops=h.calls[0].ops;assert.ok(ops.some(([k,...a])=>k==="eq"&&a[0]==="source_id"&&a[1]==="node/123"));
 for(const field of ["is_public","is_community_directory"])assert.ok(ops.some(([k,...a])=>k==="eq"&&a[0]===field&&a[1]===true));
 assert.ok(ops.some(([k])=>k==="maybeSingle"));
});
test("malformed IDs and disabled feature never query; a transient outage throws and does not poison recovery",async()=>{
 const h=harness();for(const id of ["node-0","way-01","node-1/other","arbitrary"])assert.equal(await h.reader.getOsmPlace(id),null);
 assert.equal(h.calls.length,0);h.fail(true);await assert.rejects(h.reader.getOsmPlace("node-123"),/temporarily unavailable/);
 h.fail(false);assert.ok(await h.reader.getOsmPlace("node-123"));assert.equal(h.calls.length,2);
 h.enabled(false);assert.equal(await h.reader.getOsmPlace("node-234"),null);assert.equal(h.calls.length,2);
});
test("174k+ records produce country shards automatically, using cached summary and at most 1000 rows per shard",async()=>{
 const h=harness();const response=await h.index.GET();assert.equal(response.status,200);
 const xml=await response.text();assert.equal([...xml.matchAll(/<sitemap>/g)].length,175);assert.match(xml,/IN\/125\.xml/);assert.match(xml,/US\/48\.xml/);
 assert.equal(h.calls.length,1);assert.match(response.headers.get("cache-control"),/s-maxage=86400/);
 for(let i=0;i<10;i++)await h.index.GET();assert.equal(h.calls.length,1);
 const shard=await h.sitemaps.osmSitemapShard("IN",125);assert.equal(shard[0].url,"https://www.gthproglobal.com/attractions/osm/node-123");
 assert.equal(h.calls.length,2);const range=h.calls[1].ops.find(([key])=>key==="range");assert.equal(range[1],125000);assert.equal(range[2],125999);
 assert.ok(h.calls[1].ops.some(([key,...args])=>key==="eq"&&args[0]==="country_code"&&args[1]==="IN"));
 await h.sitemaps.osmSitemapShard("IN",125);assert.equal(h.calls.length,2);
 assert.equal(await h.sitemaps.osmSitemapShard("IN",126),null);assert.equal(await h.sitemaps.osmSitemapShard("../bad",0),null);assert.equal(h.calls.length,2);
});
test("sitemap HTTP output preserves real modification time, enforces publication/quality and keeps outages out of cache",async()=>{
 const h=harness(),req=new Request("https://example.test");
 let response=await h.route.GET(req,{params:Promise.resolve({country:"IN",page:"0.xml"})});assert.equal(response.status,200);
 const xml=await response.text();assert.match(xml,/<urlset/);assert.match(xml,/2026-11-08T00:00:00.000Z/);assert.doesNotMatch(xml,/private-database/);
 response=await h.route.GET(req,{params:Promise.resolve({country:"IN",page:"01.xml"})});assert.equal(response.status,404);
 const off=harness();off.launch(false);assert.equal((await off.index.GET()).status,404);assert.equal(off.calls.length,0);
 const broken=harness();broken.fail(true);response=await broken.index.GET();assert.equal(response.status,503);assert.equal(response.headers.get("cache-control"),"no-store");
 broken.fail(false);assert.equal((await broken.index.GET()).status,200);
 const generic=harness();generic.source.name="Park";response=await generic.route.GET(req,{params:Promise.resolve({country:"IN",page:"0.xml"})});assert.doesNotMatch(await response.text(),/<url>/);
});
test("related country records share one six-row cache instead of one query per attraction",async()=>{
 const h=harness();for(let i=0;i<100;i++)await h.reader.relatedOsmPlaces("IN");assert.equal(h.calls.length,1);
 assert.ok(h.calls[0].ops.some(([key,n])=>key==="limit"&&n===6));await h.reader.relatedOsmPlaces("ZZZ");assert.equal(h.calls.length,1);
});
