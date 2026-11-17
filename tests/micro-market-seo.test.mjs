import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import ts from "typescript";

function loadTs(path,deps={}){
  const code=ts.transpileModule(fs.readFileSync(path,"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
  }).outputText;
  const exports={};
  new Function("exports","require",code)(exports,mod=>{
    if(Object.prototype.hasOwnProperty.call(deps,mod))return deps[mod];
    throw new Error("Unmocked server import: "+mod);
  });
  return exports;
}
const registry=loadTs("src/lib/real-estate/global-registry.ts");
const calls=[];
const makeQuery=table=>{
  const chain={};
  for(const op of ["select","eq","or","in","neq","not","gt","gte","lte","order","limit","abortSignal"]){
    chain[op]=(...args)=>{calls.push({table,op,args});return chain;};
  }
  chain.then=(resolve,reject)=>Promise.resolve({data:table==="properties"?[
    {id:20015,slug:"adora",title:"Adora",rera_id:"P52100001498",city:"Mumbai",district:"Pune",
      taluka:"Mulshi",village:"Wakad",locality:null,developer:"Developer A",official_source_url:null,
      lat:18.60,lng:73.78},
    {id:20022,slug:"wakad-project",title:"Wakad Project",rera_id:"P52100001230",city:"Mumbai",
      district:"Pune",taluka:"Mulshi",village:"Wakad",locality:null,developer:"Developer B",
      official_source_url:null,lat:18.605,lng:73.784},
    {id:20034,slug:"thane-project",title:"Thane Project",rera_id:"P51700001234",city:"Mumbai",
      district:"Thane",taluka:"Thane",village:"Thane",locality:null,developer:"Developer C",
      official_source_url:null,lat:19.19,lng:72.96},
  ]:table==="tenders"?[]:table==="hotel_catalog"?[
    {source_id:"node/12345",name:"OSM Hotel A",city:"Pune",latitude:18.604,longitude:73.781},
    {source_id:"node/12346",name:"Outside Five KM",city:"Pune",latitude:18.8,longitude:73.9}
  ]:[],error:null}).then(resolve,reject);
  return chain;
};
const micro=loadTs("src/lib/real-estate/micro-market.ts",{
  "server-only":{},
  "next/cache":{unstable_cache:fn=>fn},
  "@supabase/supabase-js":{createClient:()=>({from:makeQuery})},
  "./global-registry":registry,
});
test("canonical country and region paths are validated, not guessed",()=>{
  const a=micro.parseMicroPlace("india","maharashtra","thane-west");
  assert.equal(a.path,"/real-estate/india/maharashtra/thane-west");
  assert.equal(a.countryCode,"IN");
  const b=micro.parseMicroPlace("united-arab-emirates","dubai","dubai-marina");
  assert.equal(b.countryCode,"AE");
  assert.equal(b.path,"/real-estate/united-arab-emirates/dubai/dubai-marina");
  assert.equal(micro.parseMicroPlace("india","fake-region","thane-west"),null);
  for(const bad of ["%2e%2e","../admin","two%2fwords","a".repeat(81),"thane west"]){
    assert.equal(micro.parseMicroPlace("india","maharashtra",bad),null);
  }
  assert.equal(micro.segmentSlug("Nashik (M Corp.)"),"nashik-m-corp");
  assert.equal(micro.segmentSlug("New Town Action Area 1"),"new-town-action-area-1");
});
test("distance calculation rejects unsupported radius conclusions",()=>{
  assert.equal(micro.distanceKm({lat:19,lng:73},{lat:19,lng:73}),0);
  assert.ok(micro.distanceKm({lat:18.6,lng:73.78},{lat:18.604,lng:73.781})<5);
  assert.ok(micro.distanceKm({lat:18.6,lng:73.78},{lat:18.8,lng:73.9})>5);
});
test("only real official source hosts can be reported as official references",()=>{
  assert.ok(micro.safeRegistryEvidence("https://maharera.maharashtra.gov.in/projects-search-result"));
  for(const url of ["https://maharera.maharashtra.gov.in.evil.com/project",
    "http://maharera.maharashtra.gov.in/projects-search-result",
    "https://user:pw@maharera.maharashtra.gov.in/projects",
    "https://maharera.maharashtra.gov.in:8443/projects","javascript:alert(1)"]){
    assert.equal(micro.safeRegistryEvidence(url),null);
  }
});
test("Legacy RERA villages display recorded district, but no unverified index or hotel-distance claim",async()=>{
  const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY="ci-fixture";
  try{
    const data=await micro.readMicroSnapshot("india","maharashtra","wakad");
    assert.equal(data.place.localityName,"Wakad");
    assert.equal(data.projects.length,2);
    assert.deepEqual(data.projects.map(x=>x.district),["Pune","Pune"]);
    assert.deepEqual(data.projects.map(x=>x.city),["Mumbai","Mumbai"]);
    assert.equal(data.indexable,false);
    assert.equal(data.hotels.length,0);
    assert.equal(data.anchor,null,"Legacy geotags without official source must not justify 5km claims");
    assert.ok(!data.projects.some(x=>x.sourceUrl));
    assert.ok(calls.some(c=>c.table==="properties"&&c.op==="limit"&&c.args[0]===18));
    assert.ok(!calls.some(c=>c.table==="hotel_catalog"),"No hotel DB read without independent source evidence");
  }finally{
    if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;
    if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;
  }
});
test("SEO route is noindex when local evidence is inadequate, uses only factual schema",()=>{
  const page=fs.readFileSync("src/app/real-estate/[slug]/[region]/[locality]/page.tsx","utf8");
  assert.match(page,/s\.indexable/);
  assert.match(page,/siteUrl\(s\.place\.path\)/);
  assert.match(page,/CollectionPage/);
  assert.match(page,/BreadcrumbList/);
  assert.match(page,/OSM hotels within 5 km/);
  assert.match(page,/5-km radius is not asserted/i);
  assert.match(page,/official source not linked/i);
  const home=fs.readFileSync("src/app/real-estate/page.tsx","utf8");
  assert.match(home,/href="\/real-estate\/markets"/);
});
