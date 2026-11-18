import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

const supplier=loadTenderTs("src/lib/travel/hotel-whitelabel.ts",{}, {atob,btoa});
const routing=loadTenderTs("src/lib/travel/hotel-routing.ts",
  {"./hotel-whitelabel":supplier},{atob,btoa});
const now=new Date("2026-11-19T12:00:00Z");
const supplierHost=new URL(supplier.HOTEL_BOOKING_ORIGIN).host;

test("all researched city text is sanitized without any geocoding or provider API calls",()=>{
 for(const [raw,expected] of [
  ["Goa Hotel","Goa"],["Hotels in Kolkata","Kolkata"],
  ["Resorts near Dubai","Dubai"],["Search hotels in Paris","Paris"],
  ["Singapore stay","Singapore"],["New York hotels","New York"],
  ["Delhi Hotel","Delhi"],["Bangkok hotel","Bangkok"]
 ])assert.equal(routing.cleanHotelDestination(raw),expected,raw);
 for(const attack of ["javascript:alert(1)","https://evil.example",
  "../hotel","//evil.example","<img onerror=x>","hotel"])assert.equal(routing.cleanHotelDestination(attack),null,attack);
});

test("previously reviewed Place ID opens exact city listings with default stay and encoded occupancy",()=>{
 for(const city of ["Mumbai","London"]){
  const result=routing.resolveHotelRoute({destination:city},now);
  assert.equal(result.status,"ready");
  const url=new URL(result.url);
  assert.equal(url.host,supplierHost);
  assert.equal(url.pathname,"/hotels");
  assert.match(url.searchParams.get("placeId"),/^ChIJ[A-Za-z0-9_-]+$/);
  assert.equal(url.searchParams.get("checkin"),"2026-11-20");
  assert.equal(url.searchParams.get("checkout"),"2026-11-21");
  assert.equal(url.searchParams.get("adults"),"2");
  assert.equal(url.searchParams.get("rooms"),"1");
  assert.deepEqual(JSON.parse(atob(url.searchParams.get("occupancies"))),[{adults:2,children:[]}]);
 }
});

test("every unmapped city opens the supplier's own location picker without a guessed Place ID",()=>{
 for(const city of [
  "Goa","Delhi","Jaipur","Bengaluru","Kolkata","Chennai","Hyderabad","Kochi",
  "Dubai","Singapore","Bangkok","Phuket","Bali","Paris","New York","Tokyo",
  "Ahmedabad","Pune","Berlin","Palava",
 ]){
  const result=routing.resolveHotelRoute({destination:city,currency:"USD"},now);
  assert.equal(result.status,"unmapped",city);
  assert.equal(result.destination,city);
  const url=new URL(result.url);
  assert.equal(url.hostname,supplierHost);
  assert.equal(url.pathname,"/",city);
  assert.equal(url.searchParams.get("language"),"en");
  assert.equal(url.searchParams.get("currency"),"USD");
  assert.equal(url.searchParams.get("checkin"),"2026-11-20");
  assert.equal(url.searchParams.get("checkout"),"2026-11-21");
  assert.equal(url.searchParams.get("adults"),"2");
  assert.equal(url.searchParams.get("rooms"),"1");
  assert.deepEqual(JSON.parse(atob(url.searchParams.get("occupancies"))),[{adults:2,children:[]}]);
  for(const invalid of ["placeId","city","hotelId","name","redirect","xData"]){
   assert.equal(url.searchParams.has(invalid),false,invalid);
  }
  const alternate=new URL(routing.unverifiedHotelDestinationHref(city,"USD"));
  assert.equal(alternate.host,supplierHost);
  assert.equal(alternate.pathname,"/");
 }
});

test("exact supplier property click uses hotelId and valid future guest stay, never a city page",()=>{
 const result=routing.resolveHotelRoute({hotelId:"lp4aa75",destination:"Kolkata",
  checkIn:"2026-11-25",checkOut:"2026-11-28",adults:4,rooms:2,currency:"GBP"},now);
 assert.equal(result.status,"ready");
 const url=new URL(result.url);
 assert.equal(url.pathname,"/hotels/lp4aa75");
 assert.equal(url.searchParams.has("placeId"),false);
 assert.equal(url.searchParams.get("checkin"),"2026-11-25");
 assert.equal(url.searchParams.get("checkout"),"2026-11-28");
 assert.equal(url.searchParams.get("rooms"),"2");
 assert.deepEqual(JSON.parse(atob(url.searchParams.get("occupancies"))),[
  {adults:2,children:[]},{adults:2,children:[]}
 ]);
 const fallback=routing.resolveHotelRoute({hotelId:"lp4aa75",checkIn:"2026-11-31",checkOut:"2026-12-01"},now);
 assert.equal(fallback.status,"ready");
 assert.equal(new URL(fallback.url).searchParams.get("checkin"),"2026-11-20");
 for(const bad of ["//evil.example","../foo","lp33?redirect=https://evil.example","<script>","osm:node-123"])
  assert.equal(routing.resolveHotelRoute({hotelId:bad},now).status,"invalid");
});

test("missing Place ID never fetches Nuitee from GTH and does not alter supplier hotel showcases",()=>{
 const ui=readFileSync("src/components/hotel/HotelBookingExperience.tsx","utf8");
 const showcase=readFileSync("src/components/hotel/HotelDiscoveryShowcase.tsx","utf8");
 const local=readFileSync("src/lib/travel/hotel-routing.ts","utf8");
 const supplierCards=readFileSync("src/components/hotel/NuiteeHotelsListWidget.tsx","utf8");
 assert.doesNotMatch(ui,/LiteAPI\.SearchBar\.create|HOTEL_WIDGET_SCRIPT/);
 assert.doesNotMatch(local,/fetch\(|get_data_places|api\.liteapi\.travel/);
 assert.match(ui,/result\.status!=="invalid"\) window\.location\.replace\(result\.url\)/);
 assert.match(showcase,/result\.status!=="invalid"\) window\.location\.assign\(result\.url\)/);
 assert.match(supplierCards,/HotelsList\.create\(options\)/);
 assert.match(supplierCards,/hasSearchBar:false/);
});
