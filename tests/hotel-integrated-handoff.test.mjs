import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(path, imports={}) {
  const testModule={exports:{}};
  vm.runInNewContext(ts.transpileModule(read(path),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText,{
    module:testModule,exports:testModule.exports,URL,URLSearchParams,Date,atob,btoa,
    require:name=>{if(name in imports)return imports[name];throw Error("Unexpected import "+name);}
  },{timeout:3000});
  return testModule.exports;
}
const wl=load("src/lib/travel/hotel-whitelabel.ts");
const routing=load("src/lib/travel/hotel-routing.ts",{"./hotel-whitelabel":wl});
const today=new Date("2026-11-19T12:00:00Z");

test("verified Mumbai city yields exact official White Label destination with guest occupancy",()=>{
  const r=routing.resolveHotelRoute({destination:"Mumbai",adults:"3",rooms:"2",currency:"INR"},today);
  assert.equal(r.status,"ready");
  const u=new URL(r.url);
  assert.equal(u.origin,"https://hotel.gthproglobal.com");
  assert.equal(u.pathname,"/hotels");
  assert.equal(u.searchParams.get("placeId"),"ChIJwe1EZjDG5zsRaYxkjY_tpF0");
  assert.equal(u.searchParams.get("adults"),"3");
  assert.equal(u.searchParams.get("rooms"),"2");
  const rooms=JSON.parse(atob(u.searchParams.get("occupancies")));
  assert.deepEqual(Array.from(rooms,x=>x.adults),[2,1]);
});

test("unmapped Kolkata/Paris preserve intent and fail over ONLY to supplier destination picker",()=>{
  for(const city of ["Kolkata","Paris","Goa"]){
    const r=routing.resolveHotelRoute({destination:city,currency:"USD"},today);
    assert.equal(r.status,"unmapped");
    assert.equal(r.destination,city);
    const u=new URL(r.url);
    assert.equal(u.origin,"https://hotel.gthproglobal.com");
    assert.equal(u.pathname,"/");
    assert.equal(u.searchParams.has("placeId"),false);
    assert.equal(u.searchParams.get("currency"),"USD");
  }
});

test("Tokyo uses documented Google Place ID and preserves exact stay dates and guests",()=>{
  const r=routing.resolveHotelRoute({destination:"Tokyo",countryCode:"JP",checkIn:"2026-12-20",checkOut:"2026-12-23",adults:3,currency:"JPY"},today);
  assert.equal(r.status,"ready");
  const u=new URL(r.url);
  assert.equal(u.origin,"https://hotel.gthproglobal.com");
  assert.equal(u.pathname,"/hotels");
  assert.equal(u.searchParams.get("placeId"),"ChIJ51cu8IcbXWARiRtXIothAS4");
  assert.equal(u.searchParams.get("checkin"),"2026-12-20");
  assert.equal(u.searchParams.get("checkout"),"2026-12-23");
  assert.equal(u.searchParams.get("currency"),"JPY");
  assert.equal(JSON.parse(atob(u.searchParams.get("occupancies")))[0].adults,3);
  assert.equal(routing.resolveHotelRoute({destination:"Tokyo",countryCode:"US"},today).status,"unmapped");
});
test("unsafe or unverified IDs, dates and parties cannot synthesize supplier inventory",()=>{
  assert.equal(routing.resolveHotelRoute({destination:"javascript:alert(1)"},today).status,"invalid");
  assert.equal(routing.resolveHotelRoute({hotelId:"arbitrary-record"},today).status,"invalid");
  assert.equal(routing.resolveHotelRoute({destination:"Mumbai",placeId:"UNREVIEWED-PLACE"},today).status,"invalid");
  assert.equal(routing.resolveHotelRoute({destination:"Mumbai",rooms:"3",adults:"1"},today).status,"invalid");
  assert.equal(routing.resolveHotelRoute({destination:"Mumbai",adults:"99"},today).status,"invalid");
  assert.equal(routing.resolveHotelRoute({destination:"Mumbai",rooms:"0"},today).status,"invalid");
  assert.equal(routing.resolveHotelRoute({destination:"Mumbai",checkIn:"2026-12-20"},today).status,"invalid");
  assert.equal(routing.resolveHotelRoute({destination:"Mumbai",checkIn:"2026-10-01",checkOut:"2026-10-02"},today).status,"invalid");
});

test("all hotel gateways retain existing genuine supplier widget and fixed-origin redirect",()=>{
  const booking=read("src/components/hotel/HotelBookingExperience.tsx");
  const route=read("src/app/api/hotels/booking/route.ts");
  const supplierCards=read("src/components/mobile/MobileSupplierShowcase.tsx");
  assert.match(booking,/cityBookingHref/);
  assert.match(booking,/cityResolution\?\.status==="ready"/);
  assert.match(booking,/unmappedCityHref/);
  assert.match(booking,/Choose the destination in the genuine worldwide hotel search below/);
  assert.match(booking,/cityAlternativeHref/);
  assert.match(booking,/min-w-0 w-full space-y-3/);
  assert.match(booking,/window.location.replace\(cityBookingHref\)/);
  assert.match(booking,/LiteAPI.SearchBar.create/);
  assert.match(booking,/hotelWidgetSearchParams\(payload, displayCurrency\)/);
  assert.match(route,/resolveHotelRoute/);
  assert.match(route,/parseHotelBookingSearch/);
  assert.doesNotMatch(route,/SUPABASE_SERVICE_ROLE_KEY|NUITEE_API_KEY|fetch\(/);
  assert.match(supplierCards,/NuiteeHotelsListWidget/);
});
