import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = readFileSync(new URL("../src/lib/seo/public-listings.ts",import.meta.url),"utf8");
const detail = readFileSync(new URL("../src/app/tender/[id]/page.tsx",import.meta.url),"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{
  module:mod,exports:mod.exports,
  require:()=>({siteUrl:path=>"https://www.gthproglobal.com"+path}),
  Date,URL,Number,Math
},{timeout:2500});
const {tenderMetadata,isIndexableTender}=mod.exports;
const tender={
 id:"31058765-7532-4638-9964-bdb8b6157763",
 title:"Global public procurement opportunities for the modernization of public transport, construction supplies, information technology systems, professional services, and related infrastructure for regional administrations",
 buyer:"Public procurement department",country_code:"IN",sector:"services",
 summary:"Detailed official sourcing, eligibility, contract specifications and participation requirements must be verified in the original tender notice. Bidders should check the authority's documents for any amendments.",
 deadline_at:new Date(Date.now()+45*86400000).toISOString(),
 source_name:"The National Government e-Procurement Marketplace for International Opportunities",
 source_reference:"NATIONAL-REFERENCE-2026-99",
 source_url:"https://procurement.example.com/notice/31058765-7532-4638-9964-bdb8b6157763"
};
test("approved long tender title stays short in SEO metadata, H1 remains full",()=>{
 assert.equal(isIndexableTender(tender),true);
 const meta=tenderMetadata(tender,tender.id,true);
 assert.ok(meta.title.length<=118,"SEO title too long: "+meta.title.length);
 assert.ok(meta.title.length>=45);
 assert.match(meta.title,/Tender India.*GTH PRO/);
 assert.match(meta.description,/Deadline:/);
 assert.equal(meta.alternates.canonical,"https://www.gthproglobal.com/tender/"+tender.id);
 assert.equal(meta.openGraph.title,meta.title);
 assert.equal(meta.twitter.title,meta.title);
 assert.equal(meta.robots.index,true);
 assert.match(detail, /\{tender\.title\}<\/h1>/);
 assert.doesNotMatch(detail,/truncate|line-clamp/);
});
test("short source-backed tender title remains intact, offline catalog remains noindexed",()=>{
 const short={...tender,title:"Procurement of certified regional laboratory testing equipment"};
 const publicMeta=tenderMetadata(short,short.id,true);
 assert.ok(publicMeta.title.startsWith(short.title+" | "));
 assert.ok(publicMeta.title.length<=118);
 const betaMeta=tenderMetadata(short,short.id,false);
 assert.equal(betaMeta.robots.index,false);
 const missing=tenderMetadata(null,tender.id,true);
 assert.equal(missing.robots.index,false);
});
