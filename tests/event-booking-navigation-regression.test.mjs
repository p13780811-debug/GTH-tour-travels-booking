import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
function load(path,imports={}){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,URL,URLSearchParams,Date,btoa,atob,require:name=>{if(name in imports)return imports[name];throw Error("Unexpected import "+name);}},{timeout:2000});return mod.exports;}
const wl=load("src/lib/travel/hotel-whitelabel.ts");
const routing=load("src/lib/travel/hotel-routing.ts",{"./hotel-whitelabel":wl});
const venue=load("src/lib/travel/stadium-concierge.ts",{"./hotel-routing":routing});
test("Melbourne event uses correct city and country, resolves documented listing route",()=>{const href=venue.safeHotelHandoff({city:"Melbourne",countryCode:"AU",slug:"melbourne-cricket-ground"});assert.equal(href,"/api/hotels/booking?city=Melbourne&country=AU");const result=routing.resolveHotelRoute({destination:"Melbourne",countryCode:"AU"},new Date("2026-11-27T12:00:00Z"));assert.equal(result.status,"ready");const u=new URL(result.url);assert.equal(u.origin,"https://hotel.gthproglobal.com");assert.equal(u.pathname,"/hotels");assert.equal(u.searchParams.get("placeId"),"ChIJ90260rVG1moRkM2MIXVWBAQ");assert.equal(u.searchParams.get("checkin"),"2026-11-28");assert.equal(u.searchParams.get("checkout"),"2026-11-29");});
test("unmapped city preserves destination; wrong country never becomes Melbourne results; injection stays local",()=>{for(const [city,country] of [["Melbourne","US"],["Kolkata","IN"],["javascript:alert(1)","AU"],[null,null]]){const href=routing.eventHotelBookingHref(city,country);assert.match(href,/^\/hotels\?/);const u=new URL(href,"https://www.gthproglobal.com");assert.equal(u.origin,"https://www.gthproglobal.com");assert.equal(u.searchParams.get("view"),"booking");if(city==="Melbourne"||city==="Kolkata")assert.equal(u.searchParams.get("city"),city);}});
test("retired white-label alias removed from all confirmed event handoff consumers",()=>{for(const p of ["src/lib/intelligence/eventShockwave.ts","src/lib/travel/stadium-concierge.ts","src/components/travel/MatchDayConcierge.tsx"])assert.doesNotMatch(read(p),/gthproglobal\.nuitee\.link/);assert.doesNotMatch(read("src/components/travel/MatchDayConcierge.tsx"),/data\?\.bookingUrl\|\|bookingUrl/);});
test("legacy placeholders replaced with real navigation",()=>{for(const p of ["src/components/layout/GTHShell.tsx","src/components/hotel/BikeRental.tsx","src/studio/main.html"])assert.doesNotMatch(read(p),/href=["']#["']/);});
