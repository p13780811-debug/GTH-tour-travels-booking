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
