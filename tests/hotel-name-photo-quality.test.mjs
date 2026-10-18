import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isDescriptiveHotelName,NON_PROPERTY_NAME_PATTERN} from "../src/lib/travel/hotel-name-quality.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("No numeric or generic OSM campus blocks are displayed as accommodation brands",()=>{
 for(const bad of ["14th Block","18th Block","60 Block","70 block","Block 27","Block - A","B-Block","A Block","BA Block","1","10","#28","151 - 152"])
  assert.equal(isDescriptiveHotelName(bad),false,bad);
 for(const good of ["10 Calangute A Boutique Hotel","The Block Hotel","Taj Mahal Palace Hotel","A-Block Mens Hostel","(LEDeG) Ecology Hostel"])
  assert.equal(isDescriptiveHotelName(good),true,good);
 assert.match(NON_PROPERTY_NAME_PATTERN,/blocks?/);
});
test("Counts, results and category stats use same server-side source-name filter",()=>{
 const api=read("src/app/api/hotels/route.ts");
 const stats=read("src/app/api/hotels/stats/route.ts");
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 assert.match(api,/catalogCountQuery = supabase\.from\("hotel_catalog"\)[^\n]*\.not\("name","imatch",NON_PROPERTY_NAME_PATTERN\)/);
 assert.match(api,/catalogQuery = supabase\.from\("hotel_catalog"\)[^\n]*\.not\("name","imatch",NON_PROPERTY_NAME_PATTERN\)/);
 assert.match(api,/isDescriptiveHotelName\(hotel\.name\)/);
 assert.match(api,/hotelPageWindow\(page, supplierVisible, catalogCount, PAGE_SIZE\)/);
 assert.match(stats,/\.not\("name","imatch",NON_PROPERTY_NAME_PATTERN\)/);
 assert.match(detail,/if\(hotel&&!isDescriptiveHotelName\(hotel\.name\)\)return null/);
 assert.doesNotMatch(api,/\.delete\(|\.update\(|\.upsert\(/);
});
test("Source image links must be direct HTTPS images, not image search pages",()=>{
 const api=read("src/app/api/hotels/route.ts");
 assert.match(api,/jpe\?g\|png\|webp\|avif/);
 assert.match(api,/url\.username/);
 assert.match(api,/url\.pathname/);
});
