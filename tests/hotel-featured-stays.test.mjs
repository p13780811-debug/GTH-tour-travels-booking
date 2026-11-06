import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/hotels/page.tsx","utf8");
const cards=readFileSync("src/components/hotel/HotelFeaturedStays.tsx","utf8");
const api=readFileSync("src/app/api/hotels/featured/route.ts","utf8");
const config=JSON.parse(readFileSync("vercel.json","utf8"));
test("Booking mode displays original Nuitee search followed by actual India/world hotel cards",()=>{
 assert.match(page,/<HotelBookingExperience\s*\/>[\s\S]*<HotelFeaturedStays\s*\/>/);
 assert.match(cards,/Hotels across India/);
 assert.match(cards,/International hotels/);
 assert.match(cards,/HotelPropertyImage/);
});
test("Featured source respects exact affiliate verification and keeps provider keys out",()=>{
 assert.match(api,/safeVerifiedHotelAffiliateUrl\(row\)/);
 assert.match(api,/\.eq\("exact_property_verified",true\)/);
 assert.match(api,/\.eq\("program_approved",true\)/);
 assert.match(api,/hotelSourceImageUrl/);
 assert.doesNotMatch(api,/SUPABASE_SERVICE_ROLE_KEY|TRAVELPAYOUTS_API_TOKEN/);
 assert.doesNotMatch(cards,/tpo\.lv|tp\.media|partner_id=/);
});
test("Feature branch deploy disabled and route bounded/cached",()=>{
 assert.equal(config.git.deploymentEnabled["feat/hotels-global-source-cards-20261106"],false);
 assert.match(api,/s-maxage=900/);
 assert.match(api,/limit\(144\)/);
});
