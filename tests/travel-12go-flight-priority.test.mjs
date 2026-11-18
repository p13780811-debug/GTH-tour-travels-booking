import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

/** Pure offline contract test: no supplier calls or paid APIs. */
const airports={airportIndex:[
 {code:"LHR",city:"London"},{code:"BOM",city:"Mumbai"},
 {code:"CCU",city:"Kolkata"},{code:"DXB",city:"Dubai"},
 {code:"LGW",city:"London"},{code:"BKK",city:"Bangkok"},
]};
const {connected12GoFlightHref}=loadTenderTs(
 "src/components/travel/connected-flight-routing.ts",
 {"@/lib/travel/nuiteeAirportIndex":airports}
);
const now=new Date("2026-11-19T00:00:00Z");
const base={origin:"LHR",destination:"BOM",start:"2026-12-10",end:"2026-12-14"};

test("Travel Flights uses reviewed city names in the existing 12Go flight gateway, not airport codes",()=>{
 const target=connected12GoFlightHref(base,now);
 assert.ok(target?.startsWith("/go/transport/search?"));
 const url=new URL(target,"https://www.gthproglobal.com");
 assert.equal(url.pathname,"/go/transport/search");
 assert.equal(url.searchParams.get("mode"),"flight");
 assert.equal(url.searchParams.get("from"),"London");
 assert.equal(url.searchParams.get("to"),"Mumbai");
 assert.equal(url.searchParams.get("date"),base.start);
 assert.equal(url.searchParams.get("people"),"1");
 assert.equal(url.searchParams.has("return_date"),false);
 assert.equal(url.searchParams.has("adults"),false);
 assert.equal(url.searchParams.has("z"),false,"affiliate ID belongs only in existing server gateway");
 const kolkata=connected12GoFlightHref({...base,origin:"CCU",destination:"DXB"},now);
 const city=new URL(kolkata,"https://www.gthproglobal.com");
 assert.equal(city.searchParams.get("from"),"Kolkata");
 assert.equal(city.searchParams.get("to"),"Dubai");
});

test("12Go handoff remains the original validated redirect and preserves public tracking",async()=>{
 const {GET}=loadTenderTs("src/app/go/transport/search/route.ts",{
  "next/server":{NextResponse:{redirect:(target,status)=>
    new Response(null,{status,headers:{"location":String(target)}})}}
 });
 const requestUrl=new URL(connected12GoFlightHref(base,now),"https://www.gthproglobal.com");
 // The route validates against real current time; date stays in the future
 // for November 2026 CI and is checked again by the gateway.
 const response=await GET({nextUrl:requestUrl,url:requestUrl.toString()});
 assert.equal(response.status,303);
 const supplier=new URL(response.headers.get("location"));
 assert.equal(supplier.origin,"https://12go.asia");
 assert.equal(supplier.pathname,"/en/flights/london/mumbai");
 assert.equal(supplier.searchParams.get("date"),base.start);
 assert.equal(supplier.searchParams.get("people"),"1");
 assert.equal(supplier.searchParams.get("z"),"17380992");
 assert.match(response.headers.get("cache-control"),/no-store/);
});

test("unmapped, same-city and out-of-window flights do not hit an invalid 12Go URL",()=>{
 for(const trip of [
  {...base,origin:"ZZZ"},
  {...base,destination:"QQQ"},
  {...base,origin:"LHR",destination:"LGW"},
  {...base,destination:"LHR"},
  {...base,start:"2026-02-30"},
  {...base,start:"2028-12-10"},
  {...base,start:"2026-11-01"},
 ]){
  assert.equal(connected12GoFlightHref(trip,now),null,JSON.stringify(trip));
 }
});

test("only Travel Flights CTA changes; original Aviasales flow remains a selectable fallback",()=>{
 const client=readFileSync("src/components/travel/ConnectedTravelWorkspace.tsx","utf8");
 const helper=readFileSync("src/components/travel/connected-flight-routing.ts","utf8");
 const flights=readFileSync("src/app/flights/page.tsx","utf8");
 const appFlights=readFileSync("src/app/app/flights/page.tsx","utf8");
 const transport=readFileSync("src/app/go/transport/search/route.ts","utf8");
 assert.match(client,/connected12GoFlightHref\(flightTrip\)/);
 assert.match(client,/primaryFlight\|\|alternativeFlight/);
 assert.match(client,/readyAlternative&&<a href=\{readyAlternative\}/);
 assert.match(client,/No flights on the first search\?/);
 assert.match(client,/connectedFlightHref\(flightTrip\)/);
 assert.match(helper,/airportIndex\.find/);
 assert.doesNotMatch(helper,/\bfetch\s*\(|process\.env|api\.liteapi|https:\/\/12go\.asia/);
 assert.match(flights,/<AviasalesWhiteLabel isResultsView=\{isResultsView\}/);
 assert.match(appFlights,/<AviasalesWhiteLabel isResultsView=\{isResultsView\}/);
 assert.match(transport,/mode === "flight" \? "flights" : mode/);
});
