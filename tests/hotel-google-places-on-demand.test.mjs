import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isExactHotelPlace,normalizedHotelName,distanceMeters} from "../src/lib/travel/google-hotel-match.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const anchor={name:"Jai’s Retreat",lat:11.405,lon:76.695};
const good={displayName:{text:"Jai's Retreat"},location:{latitude:11.4051,longitude:76.6951},types:["lodging"],photos:[{name:"places/test/photos/test"}]};

test("Name and location are both required before attaching Google photos",()=>{
 assert.equal(normalizedHotelName("Jai’s Retreat"),normalizedHotelName("Jai's Retreat"));
 assert.equal(isExactHotelPlace(anchor,good),true);
 assert.equal(isExactHotelPlace(anchor,{...good,displayName:{text:"Other Hotel"}}),false);
 assert.equal(isExactHotelPlace(anchor,{...good,location:{latitude:11.450,longitude:76.695}}),false);
 assert.equal(isExactHotelPlace(anchor,{...good,types:["restaurant"]}),false);
 assert.ok(distanceMeters(anchor,{lat:11.450,lon:76.695})>450);
});

test("Google hotel photo enrichment stays disabled by default and never bulk-imports Google data",()=>{
 const route=read("src/app/api/hotels/google-photo/route.ts");
 assert.match(route,/GTH_GOOGLE_PLACES_ON_DEMAND_ENABLED/);
 assert.match(route,/GOOGLE_PLACES_API_KEY/);
 assert.match(route,/UPSTASH_REDIS_REST_URL/);
 assert.match(route,/UPSTASH_REDIS_REST_TOKEN/);
 assert.match(route,/await chargeBudget\(request\)/);
 assert.match(route,/private, no-store/);
 assert.match(route,/X-Robots-Tag/);
 assert.match(route,/x-forwarded-for/);
 assert.match(route,/\.eq\("source","osm"\)\.eq\("source_id",sourceId\)/);
 assert.match(route,/isExactHotelPlace/);
 assert.match(route,/photos,places.googleMapsUri/);
 assert.match(route,/places\.googleapis\.com/);
 assert.doesNotMatch(route,/SERVICE_ROLE_KEY|supabase\.from\("hotel_catalog"\)\.upsert|insert\(/);
});

test("Google Maps photo data displayed only after click with required provenance",()=>{
 const page=read("src/app/hotels/stay/[id]/page.tsx");
 const ui=read("src/components/hotel/GoogleHotelPhoto.tsx");
 assert.match(page,/hotel\.source==="OpenStreetMap"/);
 assert.match(page,/!!process\.env\.GOOGLE_PLACES_API_KEY/);
 assert.match(page,/<GoogleHotelPhoto hotelId=\{id\}/);
 assert.match(ui,/onClick=\{\(\)=>void load\(\)\}/);
 assert.match(ui,/Google Maps/);
 assert.match(ui,/photo\.placeUrl/);
 assert.match(ui,/author\.name/);
 assert.match(ui,/cache:"no-store"/);
 assert.match(ui,/No confidently matched Google Maps photo available/);
});

test("No edits to global CSS or existing OSM data importer from this Google on-demand feature",()=>{
 const route=read("src/app/api/hotels/google-photo/route.ts");
 assert.doesNotMatch(route,/NEXT_PUBLIC_GOOGLE|google\.com\/maps\/search|scrape|bulk.*google/i);
});
