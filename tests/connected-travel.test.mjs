import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const hotel=loadTenderTs("src/lib/travel/hotel-whitelabel.ts",{}, {btoa,atob});
const currency=loadTenderTs("src/lib/travel/hotel-currency.ts");
const fare=loadTenderTs("src/lib/flights/fare-search.ts");
const trip=loadTenderTs("src/lib/travel/connected-trip.ts",{"./hotel-whitelabel":hotel,"./hotel-currency":currency,"../flights/fare-search":fare},{btoa});
const now=new Date("2026-11-09T00:00:00Z"),countries=["IN","GB","AE"];
const raw={tripCountry:"IN",tripCity:"Mumbai",tripStart:"2026-12-10",tripEnd:"2026-12-14",tripAdults:"2",tripRooms:"2",tripChildren:"4, 9",tripCurrency:"USD",tripFrom:"LHR",tripTo:"BOM"};
const parse=value=>trip.parseConnectedTrip(value,countries,now);
test("connected trip survives mode changes and keeps explicit geography and hotel preferences",()=>{
 const parsed=parse(raw);assert.equal(parsed.ok,true);
 for(const mode of trip.TRAVEL_MODES){const href=new URL(trip.connectedTripHref(parsed.trip,mode),"https://www.gthproglobal.com");assert.equal(href.pathname,"/travel");assert.equal(href.searchParams.get("travelMode"),mode);assert.equal(JSON.stringify(parse(Object.fromEntries(href.searchParams)).trip),JSON.stringify(parsed.trip));}
});
test("shared trip rejects duplicated fields, unsafe cities, invalid country/dates and oversized room parties",()=>{
 for(const change of [{tripCountry:["IN","GB"]},{tripCity:"Mumbai),or(x"},{tripCity:"<script>"},{tripCountry:"ZZ"},{tripStart:"2026-02-30"},{tripStart:"2026-11-08"},{tripEnd:"2026-12-09"},{tripEnd:"2029-12-14"},{tripChildren:"18"},{tripChildren:"1,2,3,4,5,6,7,8,9"},{tripAdults:"20",tripRooms:"8"},{tripFrom:"BOM",tripTo:"BOM"},{tripFrom:"https://evil"},{tripCurrency:"BTC"}])assert.equal(parse({...raw,...change}).ok,false,JSON.stringify(change));
 assert.equal(parse({tripCity:"São Paulo"}).ok,true);assert.equal(parse({tripCity:"東京"}).ok,true);assert.equal(parse({}).ok,true);
});
test("selected real hotel receives valid shared dates, rooms, child ages and currency without fake place IDs",()=>{
 const parsed=parse(raw);const query=new URLSearchParams(trip.connectedHotelStay(parsed.trip));assert.equal(query.has("placeId"),false);assert.equal(query.has("hotelId"),false);
 query.set("hotelId","lpfixture12345");const restored=hotel.parseHotelBookingSearch(query,now);assert.ok(restored);
 const link=new URL(hotel.hotelWhiteLabelUrl(restored));assert.equal(link.hostname,"hotel.gthproglobal.com");assert.match(link.pathname,/lpfixture12345/);assert.equal(link.searchParams.get("checkin"),raw.tripStart);assert.equal(link.searchParams.get("checkout"),raw.tripEnd);assert.equal(link.searchParams.get("currency"),"USD");
 const rooms=JSON.parse(atob(link.searchParams.get("occupancies")));assert.equal(rooms.length,2);assert.equal(rooms[0].adults,2);assert.deepEqual(rooms[0].children,[4,9]);
 assert.equal(trip.connectedHotelStay({...parsed.trip,end:parsed.trip.start}),"");assert.equal(trip.connectedHotelStay({...parsed.trip,end:"2027-06-01"}),"");
});
test("flight handoff reuses public Aviasales route/dates and never sends hotel party as flight passengers",()=>{
 const parsed=parse(raw),url=new URL(trip.connectedFlightHref(parsed.trip));assert.equal(url.hostname,"www.aviasales.com");assert.equal(url.searchParams.get("origin"),"LHR");assert.equal(url.searchParams.get("destination"),"BOM");assert.equal(url.searchParams.get("depart_date"),raw.tripStart);assert.equal(url.searchParams.get("return_date"),raw.tripEnd);assert.equal(url.searchParams.has("adults"),false);assert.equal(url.searchParams.has("currency"),false);assert.equal(trip.connectedFlightHref(trip.EMPTY_CONNECTED_TRIP),null);
});
test("new connected surface uses existing providers without paid API, fabricated experience routes or homepage changes",()=>{
 const read=p=>readFileSync(p,"utf8"),client=read("src/components/travel/ConnectedTravelWorkspace.tsx"),cta=read("src/components/travel/NuiteeFlightHandoff.tsx");
 assert.match(client,/Open Aviasales search/);assert.match(client,/<NearbyHotelDiscovery/);assert.match(client,/role="tablist"/);assert.match(client,/ArrowLeft/);assert.match(client,/aria-selected/);
 assert.match(cta,/href=\{HOTEL_BOOKING_ORIGIN\}/);assert.match(cta,/select its Flights tab/);
 for(const path of ["src/lib/travel/connected-trip.ts","src/components/travel/ConnectedTravelWorkspace.tsx","src/components/travel/NuiteeFlightHandoff.tsx","src/app/travel/page.tsx"]){assert.doesNotMatch(read(path),/process\.env|api\.liteapi\.travel|\/api\/flights\/search|\/flights\/bookings|\/tours\/bookings|price-index|\/data\/places|supabase/i);}
 assert.doesNotMatch(client+cta,/hotel\.gthproglobal\.com\/(flights|experiences)|NUITEE_.*KEY/);
});
