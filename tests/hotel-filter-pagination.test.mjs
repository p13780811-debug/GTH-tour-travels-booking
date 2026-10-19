import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hotelSearchParams} from "../src/lib/travel/hotel-search-params.ts";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base={destination:"",city:"",name:"",country:"IN",category:"guest_house"};
test("Every page retains selected real accommodation category and geographical scope",()=>{
 for(const page of [1,2,3,55]){
  const p=hotelSearchParams(base,page);
  assert.equal(p.get("country"),"IN");
  assert.equal(p.get("category"),"guest_house");
  assert.equal(p.get("page"),String(page));
  assert.equal(p.has("city"),false);
 }
 assert.equal(hotelSearchParams({...base,category:"motel"},2).get("category"),"motel");
 assert.equal(hotelSearchParams({...base,category:"hostel"},4).get("category"),"hostel");
});
test("Destination, hotel name and page remain identical across initial and more requests",()=>{
 const scope={destination:"new-york",city:"New York",name:"Park",country:"US",category:"hotel"};
 for(const page of [1,2,3]){
  const p=hotelSearchParams(scope,page);
  assert.equal(p.get("destination"),"new-york");
  assert.equal(p.has("city"),false);
  assert.equal(p.get("name"),"Park");
  assert.equal(p.get("country"),"US");
  assert.equal(p.get("category"),"hotel");
 }
});
test("Page ranges are bounded and no other query changes",()=>{
 for(const page of [-1,0,101,1.5,NaN])assert.throws(()=>hotelSearchParams(base,page),RangeError);
 assert.deepEqual([...hotelSearchParams({destination:"",city:"Mumbai",name:"",country:"",category:""},1)],[
  ["page","1"],["city","Mumbai"]
 ]);
});
test("Main page shows API total matching records instead of calling 24 the entire catalog",()=>{
 const ui=read("src/app/hotels/page.tsx");
 assert.match(ui,/setTotal\(Number\.isSafeInteger\(apiTotal\)/);
 assert.match(ui,/const hotelParams = hotelParamsFor\(nextPage\)/);
 assert.match(ui,/activeQueryRef\.current !== startedFor/);
 assert.match(ui,/total\.toLocaleString\(\)\+"\ "\+selectedType/);
 assert.match(ui,/Showing \{hotels\.length\.toLocaleString\(\)\} of \{total\.toLocaleString\(\)\}/);
 assert.doesNotMatch(ui,/filteredHotels\.length\.toLocaleString\(\)\} Hotel/);
});
test("No repeated stock property image and no generic partner label on unbookable records",()=>{
 const ui=read("src/app/hotels/page.tsx");
 const image=read("src/components/hotel/HotelPropertyImage.tsx");
 assert.match(ui,/HotelPropertyImage/);
 assert.match(image,/src!=="\/placeholder\.jpg"/);
 assert.match(image,/Original property photo not available/);
 assert.match(image,/onError=/);
 assert.match(ui,/hotel\.category\|\|"hotel"/);
 assert.match(ui,/hotel\.booking_ready \? "Exact hotel booking on details" : "Directory listing"/);
 assert.match(ui,/href=\{"\/hotels\/stay\/"\+encodeURIComponent/);
 const api=read("src/app/api/hotels/route.ts");
 assert.match(api,/if \(category\) catalogCountQuery = catalogCountQuery\.eq\("category",category\)/);
 assert.match(api,/if \(category\) catalogQuery = catalogQuery\.eq\("category",category\)/);
 assert.match(api,/X-GTH-Total/);
});
