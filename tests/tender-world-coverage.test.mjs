import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const locale=loadTenderTs("src/lib/tender/localization.ts",{"server-only":{},"next/headers":{headers:async()=>new Headers()}}),coverage=loadTenderTs("src/lib/tender/coverage.ts");
test("global country selection includes ISO territories without claiming imported inventory, keeping original local preferences",async()=>{
 assert.equal(locale.COUNTRY_CODES.size,250);
 for(const code of ["IN","GB","US","BR","ZA","BS","PS","HK","XK"])assert.equal(locale.validCountry(code),code);
 assert.equal(locale.validCountry("XX"),null);assert.ok(locale.nearbyCountries("IN").includes("NP"));
 assert.equal((await locale.resolveTenderAudience("IN","en")).language,"en");
});
test("source coverage distinguishes existing feed connectors, optional free-key access and official-only guidance",()=>{
 const india=coverage.tenderSourcesFor("IN");assert.ok(india.some(row=>row.id==="cppp"&&row.mode==="official-portal"));assert.ok(india.some(row=>row.id==="worldbank"&&row.mode==="feed"));assert.ok(!india.some(row=>row.id==="brazil"));
 assert.equal(coverage.TENDER_COVERAGE.filter(row=>row.mode!=="official-portal").length,8);
 assert.equal(coverage.TENDER_COVERAGE.find(row=>row.id==="sam").mode,"free-key");
 for(const row of coverage.TENDER_COVERAGE){const url=new URL(row.url);assert.equal(url.protocol,"https:");assert.equal(url.username,"");assert.equal(url.password,"");}
});

test("worldwide results beyond page 100 and the company filter remain navigable",async()=>{
 const calls=[];
 const result={data:[{id:"source-fixture"}],error:null,count:3197};
 const query=new Proxy({}, {get(_target,key){
   if(key==="then")return Promise.resolve(result).then.bind(Promise.resolve(result));
   return (...args)=>{calls.push([key,...args]);return query;};
 }});
 const catalog=loadTenderTs("src/lib/tender/catalog.ts",{"@supabase/supabase-js":{createClient:()=>({from:()=>query})}},
   {process:{env:{NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY:"local-fixture"}}});
 const {tenderFilterHref}=loadTenderTs("src/lib/tender/urls.ts");
 const parsed=catalog.parseTenderFilters(new URLSearchParams("scope=world&channel=company&page=101"));
 assert.equal(parsed.ok,true);
 assert.match(tenderFilterHref(parsed.filters,"en",102),/channel=company.*page=102/);
 assert.equal(catalog.parseTenderFilters(new URLSearchParams("channel=invalid")).ok,false);
 assert.equal(catalog.parseTenderFilters(new URLSearchParams("page=100001")).ok,false);
 assert.equal((await catalog.searchPublicTenders(parsed.filters)).ok,true);
 assert.ok(calls.some(([key,column,value])=>key==="eq"&&column==="notice_channel"&&value==="company"));
 assert.ok(calls.some(([key,from,to])=>key==="range"&&from===1200&&to===1211));
 assert.ok(coverage.tenderSourcesFor("IN","company").every(source=>source.kind==="company"));
 assert.ok(coverage.tenderSourcesFor("IN","public").every(source=>source.kind!=="company"));
});
