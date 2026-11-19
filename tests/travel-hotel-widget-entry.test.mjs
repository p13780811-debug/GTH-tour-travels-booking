import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Hotels tab exposes the genuine worldwide supplier search without another GTH step",()=>{
  const workspace=read("src/components/travel/ConnectedTravelWorkspace.tsx");
  const hotel=workspace.slice(workspace.indexOf('{item==="hotels"&&<>'),workspace.indexOf('{item==="flights"&&<>'));
  assert.match(workspace,/className=\{mode==="hotels"\?"hidden":styles\.plan\} hidden=\{mode==="hotels"\}/);
  assert.match(hotel,/data-travel-hotel-booking="supplier-search"/);
  assert.match(hotel,/mode==="hotels"&&<HotelBookingExperience currency=\{trip\.currency\}\/>/);
  assert.match(hotel,/Optional: explore local hotel suggestions/);
  assert.ok(hotel.indexOf("<HotelBookingExperience") < hotel.indexOf("<NearbyHotelDiscovery"));
  assert.doesNotMatch(hotel,/Find stays|klook\.com|12go\.asia/);
  const supplier=read("src/components/hotel/HotelBookingExperience.tsx");
  assert.match(supplier,/LiteAPI\.SearchBar\.create/);
  assert.match(supplier,/hotelWidgetSearchParams\(payload, displayCurrency\)/);
  assert.match(supplier,/window\.location\.assign\(hotelWhiteLabelUrl\(stay\)\)/);
  assert.doesNotMatch(supplier,/SUPABASE_SERVICE_ROLE_KEY/);
});
test("Existing 12Go Flights and Experiences are preserved and hotels are not limited to hardcoded cities",()=>{
 const workspace=read("src/components/travel/ConnectedTravelWorkspace.tsx");
 assert.match(workspace,/connectedTwelveGoFlightHref\(flightTrip\)/);
 assert.match(workspace,/connectedFlightHref\(flightTrip\)/);
 assert.match(workspace,/{item==="flights"&&<>/);
 assert.match(workspace,/{item==="experiences"&&<>/);
 assert.match(workspace,/experienceSearch=/);
 assert.doesNotMatch(workspace,/NUITEE_PRODUCTION_API_KEY|12GO_API_KEY|process\.env/);
 const hotel=workspace.slice(workspace.indexOf('{item==="hotels"&&<>'),workspace.indexOf('{item==="flights"&&<>'));
 for(const city of ["Mumbai","Goa","Dubai","Tokyo","Singapore","Kolkata","Paris"])assert.equal(hotel.includes('city==="'+city+'"'),false);
});
