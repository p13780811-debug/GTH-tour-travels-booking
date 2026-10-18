import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hotelSourceImageUrl} from "../src/lib/travel/hotel-source-image.ts";
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
test("Cards and detail use the same safe property-media URL policy",()=>{
 const api=read("src/app/api/hotels/route.ts");
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 const policy=read("src/lib/travel/hotel-source-image.ts");
 assert.match(api,/import \{hotelSourceImageUrl\}/);
 assert.match(detail,/import \{hotelSourceImageUrl\}/);
 assert.match(api,/const candidates=catalogRows\.filter\(item=>!hotelSourceImageUrl\(item\.image_url\)\)/);
 assert.match(api,/const original=hotelSourceImageUrl\(hotel\.image_url\)/);
 assert.match(detail,/return hotelSourceImageUrl\(value\)/);
 assert.match(policy,/jpe\?g\|png\|webp\|avif/);
 assert.match(policy,/url\.username/);
 assert.match(policy,/url\.pathname/);
 const exact="https://upload.wikimedia.org/wikipedia/commons/a/a1/hotel.jpg?width=640";
 assert.equal(hotelSourceImageUrl(exact),exact);
 assert.equal(hotelSourceImageUrl("/images/hotels/verified.webp"),"/images/hotels/verified.webp");
 for(const bad of [
  null,"","/placeholder.jpg","https://example.org/hotel-search",
  "http://upload.wikimedia.org/wikipedia/commons/a/a1/hotel.jpg",
  "https://user:password@example.org/hotel.jpg",
  "https://127.0.0.1/hotel.jpg","https://cdn.example.org/hotel.svg",
  "https://cdn.example.org/hotel.jpg#fragment"
 ])assert.equal(hotelSourceImageUrl(bad),null,String(bad));
});
