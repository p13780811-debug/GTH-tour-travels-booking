import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {mobility} from "./helpers/mobility-loader.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const origin="https://www.gthproglobal.com";
function compile(path,deps,env={}){
 const compiledModule={exports:{}};
 const js=ts.transpileModule(read(path),{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
 }}).outputText;
 vm.runInNewContext(js,{
  module:compiledModule,exports:compiledModule.exports,Response,URL,
  process:{env:{GTH_OSM_PLACE_PAGES_ENABLED:"true",...env}},
  AbortSignal:{timeout:()=>({})},
  console:{warn:()=>{}},
  require:key=>{
   if(Object.hasOwn(deps,key))return deps[key];
   throw new Error("Unexpected dependency: "+key);
  },
 },{timeout:2000});
 return compiledModule.exports;
}
const site={isPublicLaunch:()=>true,siteOrigin:()=>origin};

test("one failed public SEO view does not suppress healthy property sitemap shards",async()=>{
 const queried=[];
 const client={
  from(view){
   queried.push(view);
   return {
    select:()=>({
     abortSignal:async()=>view==="gth_seo_properties_v1"
      ?{count:1201,error:null}
      :{count:null,error:{message:"source unavailable"}},
    }),
   };
  },
 };
 const helper=compile("src/lib/seo/large-sitemaps.ts",{
  "server-only":{},"@/lib/mobility/city":mobility,
  "@/lib/real-estate/property-seo":{isIndexableProperty:()=>false},
  "@supabase/supabase-js":{createClient:()=>client},
  "@/lib/seo/public-listings":{isIndexableHotel:()=>false,isIndexableTender:()=>false},
  "@/lib/seo/site":site,
 },{
  NEXT_PUBLIC_SUPABASE_URL:"https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:"public-test-key",
 });
 const results=JSON.parse(JSON.stringify(await helper.seoShardCountsSafe()));
 assert.deepEqual(results,[{kind:"properties",pages:2}]);
 assert.equal(queried.length,7);
 assert.ok(queried.includes("gth_seo_hotels_v1"));
 const index=compile("src/app/sitemap-index.xml/route.ts",{
  "@/lib/seo/large-sitemaps":helper,
  "@/lib/seo/site":site,
 },{
  NEXT_PUBLIC_SUPABASE_URL:"https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:"public-test-key",
 });
 const response=await index.GET();
 assert.equal(response.status,200);
 const xml=await response.text();
 assert.ok(xml.includes(origin+"/sitemap.xml"));
 assert.ok(xml.includes(origin+"/seo-sitemaps/properties/0.xml"));
 assert.ok(xml.includes(origin+"/seo-sitemaps/properties/1.xml"));
 assert.ok(!xml.includes("/seo-sitemaps/hotels/0.xml"));
 assert.ok(!xml.includes("/attractions/sitemap.xml"),"Do not nest OSM sitemap index inside another sitemap index");
});

test("preview gate does not touch the database or publish a master sitemap",async()=>{
 const index=compile("src/app/sitemap-index.xml/route.ts",{
  "@/lib/seo/large-sitemaps":{seoShardCountsSafe:()=>{throw Error("Count must not run");}},
  "@/lib/seo/site":{isPublicLaunch:()=>false,siteOrigin:()=>origin},
 });
 const response=await index.GET();
 assert.equal(response.status,404);
 assert.equal(response.headers.get("cache-control"),"no-store");
});
