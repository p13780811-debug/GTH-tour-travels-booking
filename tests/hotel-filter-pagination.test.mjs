import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {hotelSearchParams} from "../src/lib/travel/hotel-search-params.ts";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base={destination:"",city:"",name:"",country:"IN",category:"guest_house"};
test("Every page retains selected real accommodation category and geographical scope",()=>{
 for(const page of [1,2,3,55,101,109,10000]){
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
 for(const page of [-1,0,10001,1.5,NaN])assert.throws(()=>hotelSearchParams(base,page),RangeError);
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
 assert.match(ui,/hotel\.image !== "\/placeholder\.jpg"/);
 assert.match(ui,/No licensed hotel photo/);
 assert.match(ui,/hotel\.category\|\|"hotel"/);
 assert.match(ui,/hotel\.affiliate_link \? "Partner booking available" : "GTH PRO directory"/);
 assert.match(ui,/href=\{"\/hotels\/stay\/"\+encodeURIComponent/);
 const api=read("src/app/api/hotels/route.ts");
 assert.match(api,/if \(category\) catalogCountQuery = catalogCountQuery\.eq\("category",category\)/);
 assert.match(api,/if \(category\) catalogQuery = catalogQuery\.eq\("category",category\)/);
 assert.match(api,/X-GTH-Total/);
});

test("All-stays catalog stays pageable past page 100 and honors exact country scope",()=>{
 for(const n of [100,101,109,10000]){
  const p=hotelSearchParams({...base,category:""},n);
  assert.equal(p.get("page"),String(n));
  assert.equal(p.get("country"),"IN");
 }
 const api=read("src/app/api/hotels/route.ts");
 assert.match(api,/Number\(rawPage\) > 10000/);
 assert.doesNotMatch(api,/x-vercel-ip-country/);
 assert.doesNotMatch(read("src/app/api/hotels/stats/route.ts"),/x-vercel-ip-country/);
 assert.match(read("src/app/hotels/page.tsx"),/setRequestedCountry\(selectedCountry\)/);
});

test("Category counters preserve destination, city, name and country search scope",()=>{
 const stats=read("src/app/api/hotels/stats/route.ts");
 const pulse=read("src/components/hotel/HotelCatalogPulse.tsx");
 const ui=read("src/app/hotels/page.tsx");
 assert.match(stats,/const destination=params.get\("destination"\)/);
 assert.match(stats,/if\(matchingCity\)q=q.or\("city.ilike."\+cityLike/);
 assert.match(stats,/if\(name\)q=q.ilike\("name",nameLike\)/);
 assert.match(pulse,/hotelSearchParams\(\{destination,city,name,country,category:""\},1\)/);
 assert.match(pulse,/\[country,city,destination,name\]/);
 assert.match(ui,/city=\{requestedCity\} destination=\{requestedDestination\} name=\{nameFilter\}/);
});
