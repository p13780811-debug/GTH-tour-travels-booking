import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

function seoModule(){
  const js=ts.transpileModule(read("src/lib/seo/large-sitemaps.ts"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  const mod={exports:{}};
  const require=name=>{
    if(name==="server-only")return {};
    if(name==="@supabase/supabase-js")return {createClient:()=>{throw Error("No DB in eligibility unit test")}};
    if(name==="@/lib/real-estate/property-seo")return {isIndexableProperty:()=>false};
    if(name==="@/lib/seo/public-listings")return {isIndexableHotel:()=>false,isIndexableTender:()=>false};
    if(name==="@/lib/seo/site")return {siteOrigin:()=>"https://www.gthproglobal.com",isPublicLaunch:()=>true};
    throw Error("Unexpected dependency: "+name);
  };
  vm.runInNewContext(js,{module:mod,exports:mod.exports,require,URL,process:{env:{}},AbortSignal},{timeout:2000});
  return mod.exports;
}
const accepted={
  wikidata_qid:"Q424242",name:"Sample Cultural Landmark",
  description:"This is an independently sourced public reference description with documented background and factual geographic context, rather than a generic placeholder.",
  wikidata_url:"https://www.wikidata.org/wiki/Q424242",
  source_license:"CC0-1.0",is_public:true,
};

test("one eligibility rule protects Wikidata page metadata, root sitemap and shard sitemap",()=>{
  const seo=seoModule();
  assert.equal(seo.isIndexableAttraction(accepted),true);
  assert.equal(seo.eligibleSeoRow("attractions",accepted),true);
  for(const row of [
    {...accepted,source_license:"ODbL-1.0"},
    {...accepted,source_license:null},
    {...accepted,source_license:undefined},
    {...accepted,is_public:false},
    {...accepted,description:"unverified"},
    {...accepted,wikidata_url:"https://untrusted.example.org/wiki/Q424242"},
    {...accepted,wikidata_qid:"not-a-QID"},
  ]){
    assert.equal(seo.isIndexableAttraction(row),false);
    assert.equal(seo.eligibleSeoRow("attractions",row),false);
  }
  const shard=read("src/lib/seo/large-sitemaps.ts");
  const qidPage=read("src/app/attractions/[qid]/page.tsx");
  const root=read("src/app/sitemap.ts");
  const sourceView=read("supabase/migrations/20261018111500_large_scale_seo_views.sql");
  assert.match(shard,/fields:"wikidata_qid,name,description,wikidata_url,source_license,updated_at"/);
  assert.match(shard,/row\.source_license==="CC0-1\.0"/);
  assert.match(qidPage,/\.select\("wikidata_qid,name,description,source_license,/);
  assert.match(qidPage,/isPublicLaunch\(\)&&isIndexableAttraction\(item\)/);
  assert.match(qidPage,/robots:\{index,follow:index\}/);
  assert.match(root,/import \{ isIndexableAttraction \} from "@\/lib\/seo\/large-sitemaps"/);
  assert.match(root,/if\(!isIndexableAttraction\(item\)\)continue/);
  assert.match(root,/\.eq\("source_license","CC0-1\.0"\)/);
  assert.match(sourceView,/WHERE is_public IS TRUE AND source_license='CC0-1\.0'/);
});

test("OSM sitemap and OSM page keep the existing exact same eligibility rule (no mass deindex)",()=>{
  const detail=read("src/app/(mapped-places)/attractions/osm/[id]/page.tsx");
  const sitemap=read("src/lib/seo/osm-sitemaps.ts");
  const rule=read("src/lib/travel/osm-place.ts");
  assert.match(detail,/isPublicLaunch\(\)&&isIndexableOsmPlace\(item\)/);
  assert.match(sitemap,/\.filter\(isIndexableOsmPlace\)/);
  assert.match(sitemap,/OSM_SEO_CACHE_SECONDS/);
  assert.match(rule,/export function isIndexableOsmPlace/);
  assert.match(detail,/revalidate=86400/);
  assert.match(read("src/app/attractions/sitemap.xml/route.ts"),/osmSitemapCountries/);
  assert.doesNotMatch(sitemap,/service_role|SUPABASE_SERVICE_ROLE_KEY/);
});

test("temporary sitemap source errors remain 503, not noindex fabrication or false empty index",()=>{
  const shard=read("src/app/seo-sitemaps/[kind]/[page]/route.ts");
  const index=read("src/app/sitemap-index.xml/route.ts");
  const osm=read("src/app/attractions/sitemaps/[country]/[page]/route.ts");
  for(const source of [shard,index,osm]){
    assert.match(source,/status:503/);
    assert.match(source,/no-store/);
  }
});
