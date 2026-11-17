import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
const base=new URL("../src/lib/intelligence/booking-paths.ts",import.meta.url);
const compiled=stripTypeScriptTypes(readFileSync(base,"utf8"),{mode:"strip"});
const {marketBookingHandoffs}=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));

test("six booking paths are independent of OSM and database records",()=>{
 const result=marketBookingHandoffs("Dubai","AE");
 assert.deepEqual(result.map(x=>x.id),["hotel","flight","tour","transfer","ticket","cruise"]);
 assert.equal(result[0].href,"/hotels?view=booking&city=Dubai&country=AE");
 for(const r of result){
  assert.match(r.href,/^\/(hotels|flights|tours|transfers|tickets|cruises)(?:[?#]|$)/);
  assert.doesNotMatch(r.href,/directory|osm:|hotel_catalog|supplierId/);
 }
});
test("malicious city and country do not inject foreign redirects",()=>{
 const result=marketBookingHandoffs("https://evil.test/?x=1","<script>");
 assert.equal(result[0].href,"/hotels?view=booking");
 assert.equal(result[1].href,"/flights");
 assert.ok(result.every(entry=>entry.href.startsWith("/")&&!entry.href.startsWith("//")));
});
test("name-specific booking search is not silently replaced with directory navigation",()=>{
 const search=readFileSync(new URL("../src/app/search/page.tsx",import.meta.url),"utf8");
 const index=search.indexOf("hotelMatches.map(item =>");
 assert.ok(index>0);
 assert.match(search.slice(index,index+430),/view:"booking"/);
 const page=readFileSync(new URL("../src/app/intelligence/[market]/page.tsx",import.meta.url),"utf8");
 assert.match(page,/view:"booking",city:h.city,name:h.name,country:market.countryCode/);
 assert.match(page,/MarketBookingHandoffs city=\{market.city\}/);
});
