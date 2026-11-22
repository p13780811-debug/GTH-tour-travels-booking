import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const path="src/lib/seo/vertical-structured-data.ts";
const compiledModule={exports:{}};
const javascript=ts.transpileModule(read(path),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
vm.runInNewContext(javascript,{module:compiledModule,exports:compiledModule.exports},{timeout:2000});
const {hotelIdentitySchema,tenderNoticeSchema,tourDiscoverySchema}=compiledModule.exports;

test("Hotel schema uses only reviewed directory identity, not invented reviews or live room offers",()=>{
 const schema=JSON.parse(JSON.stringify(hotelIdentitySchema({
  name:"Example Guest House",category:"hotel",address:"12 Example Road",
  city:"Mumbai",country:"IN",description:"Source-backed accommodation directory record",
 },"https://www.gthproglobal.com/hotels/stay/example")));
 assert.equal(schema["@type"],"Hotel");
 assert.equal(schema.address.addressLocality,"Mumbai");
 assert.equal(schema.address.addressCountry,"IN");
 assert.ok(!("aggregateRating" in schema)&&!("offers" in schema)&&!("starRating" in schema));
});

test("Tender schema never pretends procurement opportunities are jobs or government services",()=>{
 const schema=JSON.parse(JSON.stringify(tenderNoticeSchema({
  title:"Public road maintenance tender",summary:"Review the primary notice before preparing a bid.",
  source_name:"Official procurement portal",source_reference:"RFP-001",
  buyer:"Public agency",
 },"https://www.gthproglobal.com/tender/example","https://gov.example/notice")));
 assert.equal(schema["@type"],"CreativeWork");
 assert.equal(schema.isBasedOn,"https://gov.example/notice");
 assert.ok(!JSON.stringify(schema).includes("JobPosting"));
 assert.ok(!JSON.stringify(schema).includes("GovernmentService"));
});

test("Approved tour schema has a factual destination without fabricated dates or prices",()=>{
 const schema=JSON.parse(JSON.stringify(tourDiscoverySchema({
  title:"Mumbai walking experience",city:"Mumbai",country:"India",
 },"https://www.gthproglobal.com/tours/example")));
 assert.equal(schema["@type"],"TouristTrip");
 assert.equal(schema.touristDestination.name,"Mumbai");
 assert.ok(!("offers" in schema)&&!("startDate" in schema)&&!("aggregateRating" in schema));
});

test("Vertical markup stays behind existing public launch and quality gates",()=>{
 const hotel=read("src/app/hotels/stay/[id]/page.tsx");
 const tender=read("src/app/tender/[id]/page.tsx");
 const tour=read("src/app/tours/[slug]/page.tsx");
 assert.ok(hotel.includes("isPublicLaunch()&&isIndexableHotel(hotel)"));
 assert.ok(tender.includes("isPublicLaunch()&&isIndexableTender(tender)"));
 assert.ok(tour.includes("isPublicLaunch()&&isIndexableTour(tour)"));
 for(const page of [hotel,tender,tour])assert.ok(page.includes("vertical-structured-data"));
});
