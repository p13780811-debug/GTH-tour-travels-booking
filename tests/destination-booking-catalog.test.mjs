import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

const partner = loadTenderTs("src/lib/travel/partner-search.ts");
const catalog = loadTenderTs("src/lib/tours/destination-partner-catalog.ts", {
  "server-only": {},
  "@supabase/supabase-js": {},
  "next/cache": {unstable_cache: fn=>fn},
  "@/lib/travel/partner-search": partner,
  "@/lib/travel/cruise-provider-search": {GETYOURGUIDE_PARTNER_ID:"fixture"},
});
const whitelist = loadTenderTs("src/lib/travel/hotel-whitelabel.ts", {}, {btoa,atob});
const hotel = loadTenderTs("src/lib/travel/hotel-routing.ts", {"./hotel-whitelabel":whitelist}, {btoa,atob});

test("exact experience cards preserve product tracking and do not cross the destination country", async ()=>{
  const goa = await catalog.destinationPartnerCatalog("Goa","India");
  assert.equal(goa.tours.length,3);
  assert.ok(new URL(goa.activities[0].href).searchParams.get("u").includes("/activity/117288-"));
  assert.equal((await catalog.destinationPartnerCatalog("Goa","Philippines")).tours.length,0);
  const london = await catalog.destinationPartnerCatalog("London","United Kingdom");
  const url = new URL(london.tours[0].href);
  assert.match(url.pathname, /-t617828\/$/);
  assert.equal(url.searchParams.get("partner_id"),"fixture");
  assert.equal(catalog.destinationProductLink("https://www.klook.com.evil.example/activity/12-tour/"),null);
  assert.equal(catalog.destinationProductLink("https://www.getyourguide.com/s/?q=London"),null);
  assert.equal(catalog.destinationProductLink("http://www.klook.com/activity/12-tour/"),null);
});

test("unmapped destinations use city and country in supplier search and display only real price fields", ()=>{
  const links = catalog.destinationExperienceLinks("Cambridge","Canada","activities");
  assert.equal(new URL(links.guide).searchParams.get("q"),"Cambridge Canada activities");
  assert.equal(new URL(new URL(links.klook).searchParams.get("u")).searchParams.get("query"),"Cambridge Canada activities");
  assert.match(catalog.supplierPrice(99,"INR"),/^From ₹99/);
  for (const price of [null,0,-1,Infinity]) assert.equal(catalog.supplierPrice(price,"INR"),null);
});

test("hotel checkout does not send London Canada to the London UK place ID", ()=>{
  const dates = {checkIn:"2026-12-02",checkOut:"2026-12-03"};
  const now = new Date("2026-11-23T05:00:00Z");
  assert.equal(hotel.resolveHotelRoute({...dates,destination:"London",countryCode:"GB"},now).status,"ready");
  const canada = hotel.resolveHotelRoute({...dates,destination:"London",countryCode:"CA"},now);
  assert.equal(canada.status,"unmapped");
  assert.equal(new URL(canada.url).searchParams.get("placeId"),null);
});
