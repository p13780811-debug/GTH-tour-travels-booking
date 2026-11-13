import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("city/hotel URLs default to Nuitee booking, local directory only explicitly selected",()=>{
 const hotel=read("src/app/hotels/page.tsx");
 const app=read("src/app/app/hotels/page.tsx");
 assert.match(hotel,/const directoryRequested = params\.get\("view"\) === "directory";/);
 assert.doesNotMatch(hotel,/params\.get\("view"\) !== "booking"/);
 assert.match(hotel,/hotelMode === "booking" &&/);
 assert.match(hotel,/<HotelBookingExperience key=\{currency\}/);
 assert.match(hotel,/supplier.*Place ID/i);
 assert.match(app,/const directory=query\.directory==="1";/);
 assert.doesNotMatch(app,/\["q","category","country","destination","page"\]/);
 assert.match(app,/HotelBookingExperience searchPath="\/app\/hotels"/);
 assert.match(app,/supplier.*city suggestion/);
 assert.match(app,/\/app\/hotels\?directory=1/);
});
test("global and mobile search never confuse public OSM listings with live Nuitee room rates",()=>{
 const glob=read("src/app/search/page.tsx");
 const mobile=read("src/lib/mobile/universal-search.ts");
 assert.match(glob,/if \(category === "hotel"\)/);
 assert.match(glob,/new URLSearchParams\(\{view:"booking"/);
 assert.match(glob,/view:"directory", name: item\.name/);
 assert.match(mobile,/category==="hotel"\)return \{category,href:hotelTarget\(query\)\}/);
 assert.match(mobile,/view:"booking",city:city\.name/);
 assert.match(mobile,/view:"booking",city:place/);
 assert.doesNotMatch(mobile,/directory:"1"/);
 assert.doesNotMatch(mobile,/\/hotels\/results\?/);
});
test("Nuitee SDK alone creates authoritative placeId and supplier results handoff",()=>{
 const builder=read("src/lib/travel/hotel-whitelabel.ts");
 const ui=read("src/components/hotel/HotelBookingExperience.tsx");
 const provider=read("src/lib/travel/hotel-provider-search.ts");
 assert.match(builder,/HOTEL_BOOKING_ORIGIN = "https:\/\/hotel\.gthproglobal\.com"/);
 assert.match(builder,/place\.place_id/);
 assert.match(builder,/parseHotelBookingSearch\(params\)/);
 assert.match(ui,/hotelWidgetSearchParams\(payload, displayCurrency\)/);
 assert.match(ui,/window\.location\.assign\(hotelWhiteLabelUrl\(stay\)\)/);
 assert.match(ui,/LiteAPI\.SearchBar\.create/);
 assert.match(ui,/if \(!params\)/);
 assert.match(provider,/void destination;/);
 for(const src of [globSafe(read("src/app/app/hotels/page.tsx")),read("src/lib/mobile/universal-search.ts")]){
  assert.doesNotMatch(src,/NUITEE_API_KEY|SUPABASE_SERVICE_ROLE_KEY|fetch\(["']https:\/\/api\.liteapi/);
 }
});
function globSafe(text){return text;}
test("travel city booking links preserve city without inventing supplier place IDs",()=>{
 for(const file of [
  "src/components/travel/MappedCityDiscovery.tsx",
  "src/components/travel/GuideDiscoveryRails.tsx",
  "src/components/travel/GuidePartnerHandoffs.tsx",
  "src/components/travel/GuideDetail.tsx",
  "src/components/destination/DestinationExplorerResults.tsx",
  "src/data/blogExpansion.ts",
 ]){
  const c=read(file);
  assert.ok(c.includes("/hotels?view=booking&city="),file);
  assert.ok(!c.includes("/hotels/results?city="),file);
 }
});
