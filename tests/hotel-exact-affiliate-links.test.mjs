import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {safeVerifiedHotelAffiliateUrl,validHotelBookingMapping,providerDisplayName} from "../src/lib/travel/hotel-booking-links.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base={provider:"klook",provider_property_id:"123456",hotel_name_at_provider:"Hotel Riviera",
 provider_property_url:"https://www.klook.com/hotels/detail/123456-hotel-riviera",
 affiliate_url:"https://klook.tpo.lv/IKb6eSUe/property-code"};
test("Hotel property-specific travel links pass strict partner hostname checks",()=>{
 assert.ok(safeVerifiedHotelAffiliateUrl(base));
 assert.equal(providerDisplayName("klook"),"Klook");
 for(const bad of [
  {...base,affiliate_url:"https://evil-klook.com/123"},
  {...base,affiliate_url:"https://klook.tpo.lv.evil.com/123"},
  {...base,affiliate_url:"http://klook.tpo.lv/123"},
  {...base,affiliate_url:"https://klook.tpo.lv/search?u=https://hotellook.com/hotel/1"},
  {...base,provider_property_url:"https://www.klook.com/hotels/search?city=Paris"},
  {...base,provider_property_id:""},
  {...base,provider:"unknown"}
 ])assert.equal(validHotelBookingMapping(bad),false);
});
test("Published OSM affiliate overlays are read-only with fail-closed verification gate",()=>{
 const sql=read("supabase/migrations/20261019061000_hotel_exact_affiliate_links.sql");
 assert.match(sql,/references public\.hotel_catalog\(source,source_id\)/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.hotel_booking_links/);
 assert.match(sql,/exact_property_verified is true and program_approved is true/);
 assert.match(sql,/180 days/);
 assert.doesNotMatch(sql,/grant insert|grant update|grant delete/i);
});
