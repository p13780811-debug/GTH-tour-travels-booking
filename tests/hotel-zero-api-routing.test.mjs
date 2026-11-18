import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const ts=require("typescript");
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
function load(path,imports={},environment={}) {
  const compiled=ts.transpileModule(read(path),{compilerOptions:{
    target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,
  }}).outputText;
  const mod={exports:{}};
  new Function("module","exports","require","process","URL","URLSearchParams","btoa","atob",compiled)(
    mod,mod.exports,id=>{
      if(!(id in imports))throw Error("Unexpected import "+id);
      return imports[id];
    },{env:environment},URL,URLSearchParams,btoa,atob
  );
  return mod.exports;
}
const booking=load("src/lib/travel/hotel-whitelabel.ts");
const router=load("src/lib/travel/hotel-routing.ts",{"./hotel-whitelabel":booking});
const fixed=new Date("2026-11-19T12:30:00Z");
const ymd=date=>[String(date.getFullYear()).padStart(4,"0"),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
const plus=offset=>ymd(new Date(fixed.getFullYear(),fixed.getMonth(),fixed.getDate()+offset));

test("hotel destination sanitization removes noise tokens, never accepts a hostile URL",()=>{
 for(const [input,expected] of [
  ["Goa Hotel","Goa"],["hotels in Goa","Goa"],["Hotels near Dubai","Dubai"],
  ["  STAY  IN  London  ","London"],["Mumbai resorts","Mumbai"],
 ])assert.equal(router.cleanHotelDestination(input),expected,input);
 for(const input of ["javascript:alert(1)","//evil.example","https://host.invalid/Goa",
  "<script>","hotels near me","hotel", "a".repeat(100)]){
  assert.equal(router.cleanHotelDestination(input),null,input);
 }
});

test("verified city gets exact provider Place ID, default dates and encoded room counts",()=>{
 const result=router.resolveHotelRoute({destination:"Mumbai Hotels",adults:3,rooms:2},fixed);
 assert.equal(result.status,"ready");assert.equal(result.kind,"city");
 const url=new URL(result.url);
 assert.equal(url.origin,"https://hotel.gthproglobal.com");
 assert.equal(url.pathname,"/hotels");
 assert.equal(url.searchParams.get("placeId"),"ChIJwe1EZjDG5zsRaYxkjY_tpF0");
 assert.equal(url.searchParams.get("checkin"),plus(1));
 assert.equal(url.searchParams.get("checkout"),plus(2));
 assert.equal(url.searchParams.get("adults"),"3");
 assert.equal(url.searchParams.get("rooms"),"2");
 assert.deepEqual(JSON.parse(atob(url.searchParams.get("occupancies"))),
  [{adults:2,children:[]},{adults:1,children:[]}]);
 assert.equal(result.datesDefaulted,true);
});

test("exact supplier hotel cards never become city results and preserve selected child ages",()=>{
 const result=router.resolveHotelRoute({
  hotelId:"lp33bad001",destination:"Goa",checkIn:plus(10),checkOut:plus(12),
  currency:"USD",occupancies:[{adults:2,children:[5]},{adults:1,children:[]}],
 },fixed);
 assert.equal(result.status,"ready");assert.equal(result.kind,"hotel");
 const url=new URL(result.url);
 assert.equal(url.pathname,"/hotels/lp33bad001");
 assert.equal(url.searchParams.get("placeId"),null);
 assert.equal(url.searchParams.get("checkin"),plus(10));
 assert.equal(url.searchParams.get("checkout"),plus(12));
 assert.equal(url.searchParams.get("currency"),"USD");
 assert.equal(url.searchParams.get("rooms"),"2");
 assert.deepEqual(JSON.parse(atob(url.searchParams.get("occupancies"))),
  [{adults:2,children:[5]},{adults:1,children:[]}]);
 assert.equal(result.datesDefaulted,false);
});

test("expired, reversed, malformed and partial dates consistently default to one future night",()=>{
 for(const [checkIn,checkOut] of [
  ["",""],["2026-02-30","2026-12-12"],["2026-11-19","2026-11-18"],
  [plus(9),""],["2026-11-01",plus(30)],["2036-11-19","2036-11-20"],
 ]){
  const result=router.resolveHotelRoute({hotelId:"lp111111",checkIn,checkOut},fixed);
  assert.equal(result.status,"ready");
  const url=new URL(result.url);
  assert.equal(url.searchParams.get("checkin"),plus(1));
  assert.equal(url.searchParams.get("checkout"),plus(2));
 }
});

test("unmapped travel cities always reach the White Label destination selector, never empty /hotels results",()=>{
 const cities=["Goa","Dubai","Delhi","Jaipur","Bengaluru","Kolkata",
  "Chennai","Hyderabad","Kochi","Singapore","Bangkok","Phuket","Bali",
  "Paris","New York","Tokyo","Palava"];
 for(const city of cities){
  const result=router.resolveHotelRoute({destination:city,adults:3,rooms:2},fixed);
  assert.equal(result.status,"unmapped",city);
  const url=new URL(result.url);
  assert.equal(url.origin,booking.HOTEL_BOOKING_ORIGIN);
  assert.equal(url.pathname,"/",city);
  assert.equal(url.searchParams.has("placeId"),false);
  assert.equal(url.searchParams.has("hotelId"),false);
  assert.equal(url.searchParams.get("checkin"),plus(1));
  assert.equal(url.searchParams.get("checkout"),plus(2));
  assert.equal(url.searchParams.get("adults"),"3");
  assert.equal(url.searchParams.get("rooms"),"2");
  assert.deepEqual(JSON.parse(atob(url.searchParams.get("occupancies"))),
   [{adults:2,children:[]},{adults:1,children:[]}]);
  const direct=new URL(router.unverifiedHotelDestinationHref(city));
  assert.equal(direct.origin,booking.HOTEL_BOOKING_ORIGIN);
  assert.equal(direct.pathname,"/");
 }
 const knownCities=router.CITY_SEARCH_FALLBACKS;
 assert.ok(knownCities.includes("goa")&&knownCities.includes("kolkata")&&knownCities.includes("tokyo"));
});

test("no invented place IDs, provider API calls, or dangerous redirect parameters",()=>{
 for(const intent of [
  {hotelId:"//evil.example"},{hotelId:"lp1234?redirect=https://evil.example"},
  {hotelId:"<script>"},{destination:"Mumbai",placeId:"../malicious"},
  {hotelId:"lp1234567",occupancies:[{adults:0,children:[]}]},
  {hotelId:"lp1234567",adults:2,rooms:3},
 ])assert.equal(router.resolveHotelRoute(intent,fixed).status,"invalid");
 const source=read("src/lib/travel/hotel-routing.ts");
 assert.doesNotMatch(source,/\bfetch\s*\(|\baxios\b|api\.liteapi|NUITEE_PRODUCTION_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
 assert.doesNotMatch(read("src/components/hotel/HotelBookingExperience.tsx"),/SearchBar\.create|HOTEL_WIDGET_SCRIPT|style=\{/);
});

test("public White Label override is HTTPS and constrained to approved hostnames",()=>{
 const fallback=load("src/lib/travel/hotel-whitelabel.ts",{},{
  NEXT_PUBLIC_NUITEE_WHITELABEL_URL:"https://evil.example/?x=1",
 });
 assert.equal(fallback.HOTEL_BOOKING_ORIGIN,"https://hotel.gthproglobal.com");
 const selected=load("src/lib/travel/hotel-whitelabel.ts",{},{
  NEXT_PUBLIC_NUITEE_WHITELABEL_URL:"https://gthproglobal.nuitee.link/",
 });
 assert.equal(selected.HOTEL_BOOKING_ORIGIN,"https://gthproglobal.nuitee.link");
});
