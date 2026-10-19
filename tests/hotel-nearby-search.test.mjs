import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {cityLabels,hotelBounds,hotelLocationFilter,isInHotelBounds} from "../src/lib/travel/hotel-geo-bounds.ts";
import {hotelProviderSearchUrl} from "../src/lib/travel/hotel-provider-search.ts";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("city samples unlock unlabelled nearby source records without writing city",()=>{
  const mumbai=[{latitude:19.06,longitude:72.84},{latitude:19.08,longitude:72.86},{latitude:19.10,longitude:72.85}];
  const bounds=hotelBounds("Mumbai",mumbai);
  assert.ok(bounds);
  assert.ok(isInHotelBounds(19.08,72.85,bounds));
  assert.ok(!isInHotelBounds(28.63,77.21,bounds));
  const filter=hotelLocationFilter("%Mumbai%",bounds);
  assert.match(filter,/city\.ilike\.%Mumbai%/);
  assert.match(filter,/and\(latitude\.gte\./);
  assert.match(filter,/longitude\.lte\./);
  assert.deepEqual(cityLabels("Bangalore"),["Bengaluru","Bangalore"]);
  assert.deepEqual(cityLabels("Delhi"),["New Delhi","Delhi"]);
});
test("Goa is a coordinate search area, not an invented property city",()=>{
  const b=hotelBounds("Goa",[]);
  assert.deepEqual(b,{minLat:14.8,maxLat:15.9,minLon:73.6,maxLon:74.5});
  assert.ok(isInHotelBounds(15.5,73.78,b));
  assert.equal(isInHotelBounds(19,72.8,b),false);
});
test("unknown or dispersed cities never gain guessed coordinates",()=>{
  assert.equal(hotelBounds("Paris",[]),null);
  assert.equal(hotelBounds("Paris",[{latitude:48.85,longitude:2.35},{latitude:33.66,longitude:-95.55},{latitude:48.86,longitude:2.36}]),null);
  assert.equal(hotelLocationFilter("%Paris%",null).includes("latitude"),false);
});
test("hotel booking search uses official external provider without invented affiliate tags",()=>{
  const url=new URL(hotelProviderSearchUrl("New Delhi"));
  assert.equal(url.hostname,"www.booking.com");
  assert.equal(url.pathname,"/searchresults.html");
  assert.equal(url.searchParams.get("ss"),"New Delhi");
  assert.equal(url.searchParams.has("aid"),false);
  assert.equal(hotelProviderSearchUrl(""),"https://www.booking.com/");
});
test("API stays anon-read-only and hotels use a detail-first booking flow",()=>{
  const api=read("src/app/api/hotels/route.ts");
  const page=read("src/app/hotels/page.tsx");
  const rail=read("src/app/hotels/results/HotelResults.tsx");
  assert.match(api,/hotelLocationFilter\(cityLike,nearCity\)/);
  assert.match(api,/isInHotelBounds/);
  assert.doesNotMatch(api,/SUPABASE_SERVICE_ROLE_KEY|\.update\(|\.insert\(/);
  assert.match(page,/View hotel details/);
  assert.match(rail,/View hotel & source/);
  assert.doesNotMatch(page,/hotelProviderSearchUrl/);
  assert.doesNotMatch(rail,/hotelProviderSearchUrl/);
});
test("server-side source validation remains strict and partial rejection counted",()=>{
  const importer=read("scripts/import_osm_hotels.py");
  const edge=read("supabase/functions/gth-hotel-ingest/index.ts");
  assert.match(importer,/written \+ invalid != len\(batch\)/);
  assert.match(importer,/remote_rejected \+= invalid/);
  assert.match(edge,/jwtVerify/);
  assert.match(edge,/rejected,source:"OpenStreetMap"/);
});
