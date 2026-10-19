import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeLiteApiHotel,normalizeLiteApiList,providerHotelDetail,safeLiteApiImage} from "../src/lib/travel/liteapi-view-model.ts";
const read = p => readFileSync(new URL("../"+p,import.meta.url),"utf8");
const row = { id:"lp002", name:"Exact Hotel Two",city:"Dubai",country:"ae",starRating:4,
  hotelDescription:"Source-backed listing",hotelFacilities:["Wi-Fi","Pool","Wi-Fi"],
  hotelImages:[{url:"https://cdn.example.com/hotel-two-a.jpg",defaultImage:true},{url:"https://cdn.example.com/hotel-two-b.jpg"}] };
test("Provider responses normalize strictly without fabricated properties",()=>{
 const items=normalizeLiteApiList({data:[row,row,{id:"",name:"Bad"},{id:"lp003",name:"Another",starRating:7}]});
 assert.equal(items.length,2);
 assert.equal(items[0].id,"lp002");
 assert.equal(items[0].image,"https://cdn.example.com/hotel-two-a.jpg");
 assert.deepEqual(items[0].amenities,["Wi-Fi","Pool"]);
 assert.equal(items[0].country,"AE");
 assert.equal(items[1].stars,null);
 assert.equal(items[1].image,null);
 assert.equal(items[1].description,null);
 assert.equal(items[1].amenities.length,0);
 assert.equal(providerHotelDetail({data:row}),row);
});
test("Supports nested provider list response and original property identity",()=>{
 const hotels=normalizeLiteApiList({data:{hotels:[row]}});
 assert.equal(hotels[0].image,normalizeLiteApiHotel(row).image);
 assert.equal(hotels[0].id,normalizeLiteApiHotel(row).id);
});
test("Rejects private, insecure and credential-bearing photo URLs",()=>{
 for(const url of ["http://example.org/photo.jpg","https://localhost/a.jpg","https://127.0.0.1/a.jpg",
   "https://user:pass@cdn.example.com/a.jpg","javascript:alert(1)","https://cdn.example.org/a.jpg#frag"])
   assert.equal(safeLiteApiImage(url),null);
 assert.equal(safeLiteApiImage("https://cdn.example.org/photo?id=123"),"https://cdn.example.org/photo?id=123");
});
test("Provider API never writes inventory and is protected by shared rate limits",()=>{
 const route=read("src/app/api/hotels/live/route.ts");
 const proof=read("src/lib/travel/liteapi-photo-proof.ts");
 const detail=read("src/app/hotels/live/[id]/page.tsx");
 assert.match(route,/enforceRateLimit\(request, "flights"\)/);
 assert.match(route,/searchLiteApiHotels/);
 assert.doesNotMatch(route,/supabase|\.upsert\(|\.insert\(|\.delete\(/);
 assert.match(proof,/timingSafeEqual/);
 assert.match(detail,/verifiedLiteApiCardPhoto/);
 assert.match(detail,/hotelProviderSearchUrl/);
 assert.match(detail,/index:false/);
});
test("Existing worldwide search links to authenticated provider directory",()=>{
 assert.match(read("src/app/hotels/page.tsx"),/href="\/hotels\/live"/);
 assert.match(read("src/app/hotels/live/page.tsx"),/Provider hotel discovery/);
 assert.match(read("src/app/hotels/live\/[id]\/page.tsx"),/Provider-supplied photographs/);
});
