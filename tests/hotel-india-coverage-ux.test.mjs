import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hotelSearchParams} from "../src/lib/travel/hotel-search-params.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("India hotel discovery retains source, location and alphabetical sort across pages",()=>{
 const scope={destination:"",city:"Candolim",name:"Beach",country:"",category:"resort",sort:"name_desc",source:"directory"};
 for(const page of [1,2,10]){
  const params=hotelSearchParams(scope,page);
  assert.equal(params.get("city"),"Candolim");
  assert.equal(params.get("name"),"Beach");
  assert.equal(params.get("category"),"resort");
  assert.equal(params.get("source"),"directory");
  assert.equal(params.get("sort"),"name_desc");
  assert.equal(params.get("page"),String(page));
 }
});

test("Server validates source/sort and keeps names/address/region attributable",()=>{
 const api=read("src/app/api/hotels/route.ts");
 const geo=read("src/lib/travel/hotel-geo-bounds.ts");
 assert.match(api, /\["all","partner","directory"\]\.includes\(source\)/);
 assert.match(api, /\["name_asc","name_desc"\]\.includes\(sort\)/);
 assert.match(geo, /address\.ilike/);
 assert.match(geo, /name\.ilike/);
 assert.match(api, /sort !== "name_desc"/);
 assert.match(api, /source === "partner"/);
 assert.match(api, /source === "directory"/);
 assert.doesNotMatch(api, /Math\.random|generateHotels/);
});

test("India cloud import rotates six official zone extracts and preserves node and area identity",()=>{
 const flow=read(".github/workflows/gth-osm-bulk-hotels.yml");
 const importer=read("scripts/import_osm_hotels.py");
 for(const zone of ["western","northern","eastern","southern","central","north-eastern"]){
  assert.match(flow,new RegExp("asia/india/"+zone+"-zone"));
 }
 assert.match(flow,/geometry-types=point,polygon/);
 assert.match(flow,/id-token: write/);
 assert.match(flow,/GTH_HOTEL_OIDC_TOKEN/);
 assert.match(importer,/area_id % 2 == 0/);
 assert.match(importer,/source_license": "ODbL-1\.0"/);
 assert.doesNotMatch(flow,/secrets\.SUPABASE_SERVICE_ROLE_KEY/);
});

test("Hotels UI reuses global CSS, never invents room inventory or prices",()=>{
 const page=read("src/app/hotels/page.tsx");
 assert.match(page,/Explore India hotels/);
 assert.match(page,/Sort hotel listings/);
 assert.match(page,/Hotel name \(optional\)/);
 assert.match(page,/sourceFilter/);
 assert.match(page,/Price not independently verified/);
 assert.match(page,/gth-btn-gold/);
 assert.match(page,/bg-\[var\(--card\)\]/);
 assert.doesNotMatch(page,/Math\.random|generateHotels\(/);
});
