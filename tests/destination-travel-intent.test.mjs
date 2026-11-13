import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const ts=require("typescript");
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(path,imports={}){
 const js=ts.transpileModule(source(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}} ).outputText;
 const holder={exports:{}};
 new Function("module","exports","require",js)(holder,holder.exports,id=>{
  if(!(id in imports))throw Error("Unexpected import "+id);
  return imports[id];
 });
 return holder.exports;
}
const flights=load("src/data/flight/destinations.ts");
const venues=load("src/lib/travel/stadiums.ts");
const links=load("src/lib/destinations/ecosystem.ts",{"@/data/flight/destinations":flights,"@/lib/travel/stadiums":venues});

test("destination links are real, local search pages and are not dead anchors",()=>{
 for(const name of ["Goa","Mumbai","New York","Paris","Kuala Lumpur"]){
  const place={slug:name.toLowerCase().replaceAll(" ","-"),name,country:"India"};
  const services=links.destinationServices(place);
  const byKey=key=>services.find(x=>x.key===key);
  const hotel=new URL(byKey("hotels").href,"https://www.gthproglobal.com");
  assert.equal(hotel.pathname,"/hotels");
  assert.equal(hotel.searchParams.get("view"),"booking");
  assert.equal(hotel.searchParams.get("city"),name);
  assert.equal(hotel.searchParams.get("country"),"IN");
  assert.equal(hotel.searchParams.has("destination"),false);
  const tours=new URL(byKey("tours").href,"https://www.gthproglobal.com");
  assert.equal(tours.pathname,"/tours");
  assert.equal(tours.searchParams.get("city"),name);
  assert.equal(tours.hash,"#discover");
  const activities=new URL(byKey("activities").href,"https://www.gthproglobal.com");
  assert.equal(activities.pathname,"/activities");
  assert.equal(activities.searchParams.get("city"),name);
  assert.equal(activities.hash,"#discover");
  const destination=new URL(byKey("flights").href,"https://www.gthproglobal.com");
  assert.equal(destination.pathname,"/flights");
  assert.equal(destination.searchParams.get("destinationCity"),name);
  assert.equal(destination.hash,"#flight-search");
  assert.equal(byKey("flights").scope,"destination");
 }
});
test("Kolkata stadium CTA resolves to Eden Gardens, not an overseas supplier tour",()=>{
 const services=links.destinationServices({slug:"kolkata",name:"Kolkata",country:"India"});
 const venue=services.find(item=>item.key==="stadiums");
 assert.equal(venue.href,"/stadiums/eden-gardens");
 assert.equal(venue.scope,"destination");
 const tickets=services.find(item=>item.key==="tickets");
 assert.equal(new URL(tickets.href,"https://www.gthproglobal.com").searchParams.get("q"),"Kolkata");
});
test("only provider-independent, curated IATA mappings are passed to flight search",()=>{
 const known=new URL(links.destinationFlightHref("Dubai"),"https://www.gthproglobal.com");
 assert.equal(known.searchParams.get("destination"),"DXB");
 assert.equal(known.searchParams.get("destinationCity"),"Dubai");
 const unknown=new URL(links.destinationFlightHref("New York"),"https://www.gthproglobal.com");
 assert.equal(unknown.searchParams.has("destination"),false);
 assert.equal(unknown.searchParams.get("destinationCity"),"New York");
});
test("destination hero and directory link to scoped pages without inventing bookings",()=>{
 const detail=source("src/app/destinations/[slug]/page.tsx");
 const cards=source("src/components/destination/DestinationExplorerResults.tsx");
 const flight=source("src/app/flights/page.tsx");
 assert.match(detail,/href=\{hotelsHref\}/);
 assert.match(detail,/href=\{toursHref\}/);
 assert.match(detail,/href=\{flightsHref\}/);
 assert.match(cards,/destinationFlightHref\(item\.title\)/);
 assert.match(cards,/encodeURIComponent\(item\.title\)/);
 assert.match(flight,/destinationCity/);
 assert.match(flight,/supplier search form/);
 assert.doesNotMatch(cards,/href="\/flights"/);
});
