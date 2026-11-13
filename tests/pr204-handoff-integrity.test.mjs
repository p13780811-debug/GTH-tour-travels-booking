import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const ts=require("typescript");
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(path,imports={}){
 const js=ts.transpileModule(read(path),{compilerOptions:{
  target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS
 }}).outputText;
 const module={exports:{}};
 new Function("module","exports","require",js)(module,module.exports,id=>{
  if(!(id in imports))throw Error("Unexpected import "+id+" in "+path);
  return imports[id];
 });
 return module.exports;
}
const stadiums=load("src/lib/travel/stadiums.ts");
const venueRouter=load("src/lib/travel/stadium-ticket-routing.ts",{"./stadiums":stadiums});
const flights=load("src/data/flight/destinations.ts");
const destinations=load("src/data/destinations.ts");
const cityRoutes=load("src/lib/destinations/ecosystem.ts",{
 "@/data/flight/destinations":flights,
 "@/lib/travel/stadiums":stadiums,
});
const mobile=load("src/lib/mobile/universal-search.ts",{
 "@/data/destinations":destinations,
 "@/lib/travel/stadium-ticket-routing":venueRouter,
});

test("the original four-pillar navigation links and PR204 ticket additions point to existing pages",()=>{
 const routes=[
  "/","/search","/mega-aggregator","/tickets","/stadiums",
  "/travel","/hotels","/flights","/tours","/activities","/destinations",
  "/real-estate","/real-estate/tools","/real-estate/post-property",
  "/tender","/tender/assistant","/partners","/blog","/about",
  "/verification","/app","/app/ecosystem","/app/search","/app/explore",
  "/app/hotels","/app/property","/app/tenders",
 ];
 for(const route of routes){
  const path="src/app"+(route==="/"?"/page.tsx":route+"/page.tsx");
  assert.ok(existsSync(new URL("../"+path,import.meta.url)),"Missing internal route "+route);
 }
 assert.ok(existsSync(new URL("../src/app/tickets/[category]/page.tsx",import.meta.url)));
 assert.ok(existsSync(new URL("../src/app/stadiums/[slug]/page.tsx",import.meta.url)));
});

test("Kolkata hotels and stadium cards never switch to OSM booking or overseas Eden tours",()=>{
 const links=cityRoutes.destinationServices({slug:"kolkata",name:"Kolkata",country:"India"});
 const hotel=new URL(links.find(row=>row.key==="hotels").href,"https://www.gthproglobal.com");
 assert.equal(hotel.pathname,"/hotels");
 assert.equal(hotel.searchParams.get("view"),"booking");
 assert.equal(hotel.searchParams.get("city"),"Kolkata");
 assert.equal(hotel.searchParams.get("country"),"IN");
 assert.equal(hotel.searchParams.has("destination"),false);
 assert.equal(links.find(row=>row.key==="stadiums").href,"/stadiums/eden-gardens");
 assert.equal(new URL(links.find(row=>row.key==="tickets").href,"https://www.gthproglobal.com").searchParams.get("q"),"Kolkata");
});

test("only complete, uniquely reviewed stadium names navigate directly",()=>{
 for(const input of ["Eden Gardens","Eden Gardens tickets","Kolkata Eden Gardens cricket tickets"]){
  assert.equal(venueRouter.knownStadiumTicketHref(input),"/stadiums/eden-gardens",input);
  assert.equal(mobile.resolveUniversalTarget(input,"ticket").href,"/stadiums/eden-gardens");
 }
 assert.equal(venueRouter.knownStadiumTicketHref("Wankhede Stadium match tickets"),"/stadiums/wankhede-stadium");
 for(const vague of ["Eden","Sweden","Sydney Eden Australia","Kolkata","concerts London"]){
  assert.equal(venueRouter.knownStadiumTicketHref(vague),null,"Do not guess venue: "+vague);
 }
 assert.equal(mobile.resolveUniversalTarget("Eden","ticket").href,"/tickets?q=Eden");
 assert.equal(mobile.resolveUniversalTarget("Kolkata hotel").href,"/app/hotels?view=booking&city=Kolkata");
});

test("ticket explorer must show only matching reviewed sources or an honest no-result state",()=>{
 const explorer=read("src/app/tickets/WorldwideTicketExplorer.tsx");
 assert.match(explorer,/terms\.every\(term=>tokens\.has\(term\)\)/);
 assert.match(explorer,/mode:!selected\.length\?"not-found":terms\.length===0\?"browse":"matching"/);
 assert.doesNotMatch(explorer,/const partial=exact\.length\?exact/);
 assert.doesNotMatch(explorer,/const selected=partial\.length\?partial:scored/);
 assert.match(explorer,/No verified matching venue or ticket-source listing/);
 assert.equal(stadiums.findStadium("eden-gardens").city,"Kolkata");
 assert.equal(stadiums.findStadium("eden-gardens").country,"India");
});

test("city hotel CTAs lead to the Nuitee widget with explicit city, never OSM as bookable inventory",()=>{
 const landing=read("src/app/hotels/page.tsx");
 const detail=read("src/app/destinations/[slug]/page.tsx");
 const market=read("src/app/hotels/explore/[slug]/page.tsx");
 const offers=read("src/components/hotel/NuiteeHotelOffers.tsx");
 const booking=read("src/components/hotel/HotelBookingExperience.tsx");
 for(const value of [landing,market,offers])assert.match(value,/view:"booking"/);
 assert.match(detail,/Public hotel directory in/);
 assert.match(detail,/Book stays in/);
 assert.match(landing,/Choose \{initialCity\} from the Nuitee destination suggestions/);
 assert.match(booking,/hotelWidgetSearchParams\(payload, displayCurrency\)/);
 assert.match(booking,/window\.location\.assign\(hotelWhiteLabelUrl\(stay\)\)/);
 assert.doesNotMatch(venueRouter.knownStadiumTicketHref.toString(),/api\.liteapi\.travel|fetch\(/);
});
