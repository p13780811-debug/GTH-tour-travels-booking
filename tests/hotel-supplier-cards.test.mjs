import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/hotels/page.tsx","utf8");
const widget=readFileSync("src/components/hotel/NuiteeHotelOffers.tsx","utf8");
const config=JSON.parse(readFileSync("vercel.json","utf8"));
test("Source-backed hotel cards follow the existing connected supplier search",()=>{
  assert.match(page,/<HotelBookingExperience\s*\/>[\s\S]*<NuiteeHotelOffers\s*\/>/);
  assert.doesNotMatch(page,/HotelFeaturedStays/);
  assert.match(widget,/LiteAPI\.HotelsList\.create/);
  assert.match(widget,/HOTEL_WIDGET_SCRIPT/);
});
test("Mumbai and London use grounded real place IDs, Nuitee exact property navigation",()=>{
  assert.match(widget,/ChIJwe1EZjDG5zsRaYxkjY_tpF0/);
  assert.match(widget,/ChIJdd4hrwug2EcRmSrV3Vo6llI/);
  assert.match(widget,/hotelWhiteLabelUrl\(parsed\)/);
  assert.match(widget,/new URL\("\/hotels\/"\+encodeURIComponent\(id\),HOTEL_BOOKING_ORIGIN\)/);
  assert.match(widget,/hotel\.id\?\?event\?\.hotel\?\.hotelId/);
});
test("No fabricated hotel catalogue, direct payment or CSS overrides",()=>{
  assert.doesNotMatch(widget,/hotel_catalog|hotel_booking_links|tp\.media|tpo\.lv/);
  assert.doesNotMatch(widget,/SUPABASE_SERVICE_ROLE_KEY|LITEAPI_KEY|STRIPE_SECRET_KEY/);
  assert.match(widget,/sheet\.cloneNode\(true\)/);
  assert.equal(config.git.deploymentEnabled["feat/hotels-global-source-cards-20261106"],false);
});
