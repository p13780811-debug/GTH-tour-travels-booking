import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(path,imports={}){
  const mod={exports:{}};
  vm.runInNewContext(ts.transpileModule(read(path),{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
  }}).outputText,{
    module:mod,exports:mod.exports,Date,URL,URLSearchParams,btoa,atob,
    require:name=>{if(name in imports)return imports[name];throw Error("Unreviewed dependency "+name);}
  },{timeout:3000});
  return mod.exports;
}
const whiteLabel=load("src/lib/travel/hotel-whitelabel.ts");
const routing=load("src/lib/travel/hotel-routing.ts",{"./hotel-whitelabel":whiteLabel});
const partner=load("src/lib/travel/partner-search.ts");
const klook=load("src/lib/travel/klook-hotel-search.ts",{"./partner-search":partner});
const booking=load("src/lib/travel/connected-hotel-handoff.ts",{
 "./hotel-whitelabel":whiteLabel,"./hotel-routing":routing,"./klook-hotel-search":klook,
});
const dayOffset=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const base={country:"IN",city:"Mumbai",start:dayOffset(10),end:dayOffset(13),adults:2,rooms:1,children:[],currency:"INR"};

test("Travel Find stays uses exact Nuitee White Label URL for reviewed city, dates and guests",()=>{
 const target=new URL(booking.connectedHotelBookingHref(base));
 assert.equal(target.origin,"https://hotel.gthproglobal.com");
 assert.equal(target.pathname,"/hotels");
 assert.equal(target.searchParams.get("placeId"),"ChIJwe1EZjDG5zsRaYxkjY_tpF0");
 assert.equal(target.searchParams.get("checkin"),base.start);
 assert.equal(target.searchParams.get("checkout"),base.end);
 assert.equal(target.searchParams.get("currency"),"INR");
 assert.equal(JSON.parse(atob(target.searchParams.get("occupancies")))[0].adults,2);
 assert.equal(target.searchParams.has("city"),false,"never send unsupported city strings as supplier place IDs");
});

test("Goa and Dubai Travel handoff opens hotel-only affiliate category, not second GTH page",()=>{
 for(const [city,country] of [["Goa","IN"],["Dubai","AE"]]){
   const url=new URL(booking.connectedHotelBookingHref({...base,city,country}));
   assert.equal(url.origin,"https://tp.media");
   const supplier=new URL(url.searchParams.get("u"));
   assert.equal(supplier.origin,"https://www.klook.com");
   assert.match(supplier.pathname,/\/3-hotel\/$/);
   assert.equal(supplier.searchParams.size,0);
 }
});

test("Unknown city goes straight to genuine Nuitee destination picker preserving valid dates, never fake inventory",()=>{
 const target=new URL(booking.connectedHotelBookingHref({...base,city:"Kolkata"}));
 assert.equal(target.origin,"https://hotel.gthproglobal.com");
 assert.equal(target.pathname,"/");
 assert.equal(target.searchParams.get("checkin"),base.start);
 assert.equal(target.searchParams.get("checkout"),base.end);
 assert.equal(target.searchParams.has("placeId"),false);
});

test("Missing dates allow genuine provider discovery; invalid, partial and stale dates never redirect",()=>{
 assert.equal(new URL(booking.connectedHotelBookingHref({...base,start:"",end:""})).origin,"https://hotel.gthproglobal.com");
 assert.equal(booking.connectedHotelBookingHref({...base,start:"",end:base.end}),null);
 assert.equal(booking.connectedHotelBookingHref({...base,start:dayOffset(-2),end:dayOffset(2)}),null);
 assert.equal(booking.connectedHotelBookingHref({...base,adults:0}),null);
 assert.equal(booking.connectedHotelBookingHref({...base,city:"https://evil.test"}),null);
});

test("Travel hotel form opens supplier directly, while flights 12Go route remains intact",()=>{
 const src=read("src/components/travel/ConnectedTravelWorkspace.tsx");
 assert.match(src,/connectedHotelBookingHref\(parsed\.trip\)/);
 assert.match(src,/window\.location\.assign\(directHotelHref\)/);
 assert.match(src,/mode==="flights"/);
 assert.match(src,/connectedTwelveGoFlightHref/);
 assert.doesNotMatch(src,/process\.env|api\.liteapi\.travel|SUPABASE_SERVICE_ROLE_KEY/);
});
