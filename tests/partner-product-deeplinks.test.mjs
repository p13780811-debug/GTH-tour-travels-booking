import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(){
 const mod={exports:{}};
 const source=readFileSync(new URL("../src/lib/tours/reviewed-partner-products.ts",import.meta.url),"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(js,{module:mod,exports:mod.exports,URL,Date,Set,Object,Number,String},{timeout:2000});
 return mod.exports;
}
const engine=load();
const now=Date.parse("2026-10-26T00:00:00Z");
const product={provider:"klook",provider_product_id:"123",title:"Original supplier attraction ticket",city:"Dubai",country:"United Arab Emirates",
 experience_category:"attraction-ticket",source_url:"https://www.klook.com/en-IN/activity/123-original-attraction-ticket/",
 image_url:"https://images.klook.com/product/photo.jpg",image_width:1200,image_height:800,
 media_rights_verified:true,source_type:"approved_partner_feed",source_checked_at:"2026-10-25T00:00:00Z",price_numeric:null,currency:null};
test("only exact partner product IDs and URLs pass",()=>{
 assert.equal(engine.reviewedPartnerProduct(product,now).provider_product_id,"123");
 for(const invalid of [{source_url:"https://www.klook.com/"},{source_url:"https://www.klook.com/en-IN/activity/124-incorrect/"},{source_url:"https://www.klook.com.evil.test/en-IN/activity/123-tour/"},{source_url:"https://www.klook.com/en-IN/search/result/?query=Dubai"},{source_url:"https://www.klook.com/en-IN/activity/123-tour/?r=partner"}]){
  assert.equal(engine.reviewedPartnerProduct({...product,...invalid},now),null);
 }
});
test("other partner ID schemes validated, unsupported provider and city passes rejected",()=>{
 const kkday={...product,provider:"kkday",provider_product_id:"456",source_url:"https://www.kkday.com/en/product/456-original-tour"};
 const tiqets={...product,provider:"tiqets",provider_product_id:"789",source_url:"https://www.tiqets.com/en/paris-c66746/ticket-p789/"};
 assert.ok(engine.reviewedPartnerProduct(kkday,now));
 assert.ok(engine.reviewedPartnerProduct(tiqets,now));
 assert.equal(engine.reviewedPartnerProduct({...tiqets,provider:"gocity"},now),null);
 assert.equal(engine.reviewedPartnerProduct({...tiqets,source_url:"https://www.tiqets.com/en/paris-c66746/ticket-p788/"},now),null);
});
test("expired, unlicensed, broken-format or stock placeholders cannot publish",()=>{
 for(const extra of [{media_rights_verified:false},{source_type:"scraped_site"},{source_checked_at:"2026-01-01T00:00:00Z"},{image_url:"http://example.test/photo.jpg"},{image_width:200},{image_url:"https://localhost/photo.jpg"},{price_numeric:-1}]){
  assert.equal(engine.reviewedPartnerProduct({...product,...extra},now),null);
 }
});
test("activity vs tour and exact city filtering, duplicates, and no demo inventory",()=>{
 const tours={...product,provider:"kkday",provider_product_id:"888",source_url:"https://www.kkday.com/en/product/888-city-walk",experience_category:"city-tour"};
 assert.equal(engine.eligiblePartnerProducts([product,product,tours],"Dubai","","/activities","",now).length,1);
 assert.equal(engine.eligiblePartnerProducts([product,tours],"Dubai","city-tour","/tours","",now).length,1);
 assert.equal(engine.eligiblePartnerProducts([product,tours],"London","","/tours","",now).length,0);
 assert.equal(engine.eligiblePartnerProducts([],"Dubai","","/activities","",now).length,0);
});
test("approved PR134 search stays and Klook destination card preserves selected city",()=>{
 const market=readFileSync(new URL("../src/components/tours/TourAffiliateMarketplace.tsx",import.meta.url),"utf8");
 const landing=readFileSync(new URL("../src/components/tours/TourLanding.tsx",import.meta.url),"utf8");
 assert.match(market,/partnerSearchHref\(basePath==="\/tours"\?"tours":"activities",search.city\)/);
 assert.match(market,/Explore "\+search\.city\+" experiences/);
 assert.match(landing,/<SupplierTourCatalog/);
 assert.match(landing,/<ReviewedPartnerCatalog/);
 assert.match(landing,/<TourAffiliateMarketplace/);
});
