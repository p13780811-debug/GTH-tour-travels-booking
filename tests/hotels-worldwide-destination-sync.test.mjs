import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("All destination hotel entry points share the same resolved supplier destination, not competing page-specific guesses",()=>{
 const route=read("src/lib/travel/klook-hotel-search.ts");
 const service=read("src/lib/destinations/ecosystem.ts");
 const explore=read("src/components/destination/DestinationExplorerResults.tsx");
 const cityRail=read("src/components/travel/MappedCityDiscovery.tsx");
 const guideRail=read("src/components/travel/GuideDiscoveryRails.tsx");
 const guideHandoff=read("src/components/travel/GuidePartnerHandoffs.tsx");
 const hotel=read("src/app/hotels/page.tsx");
 const showcase=read("src/components/hotel/HotelDiscoveryShowcase.tsx");
 for(const content of [service,explore,cityRail,guideRail,guideHandoff,hotel,showcase])
   assert.match(content,/destinationHotelHref\(/,"A destination CTA bypassed shared hotel router");
 assert.match(route,/VERIFIED_HOTEL_DESTINATIONS/);
 assert.match(route,/trackKlookDestination\(/);
 assert.match(route,/\/3-hotel\//);
 assert.doesNotMatch(route,/\/search\/result|Math\.random|process\.env|SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(route,/resolveHotelRoute\(\{destination:city\}\)/);
 assert.match(route,/route\.status==="ready"/);
 assert.match(route,/return "\/hotels\?"\+params\.toString\(\)/);
});

test("Tokyo or any unmapped city cannot expose a stale Goa Airport selection as a selected supplier destination",()=>{
 const src=read("src/components/hotel/HotelBookingExperience.tsx");
 assert.match(src,/needsExplicitDestination=Boolean\(unmappedCityHref&&!restored\)/);
 assert.match(src,/\(!needsExplicitDestination\|\|explicitDestinationPicker\)/);
 assert.match(src,/onClick=\{\(\)=>setExplicitDestinationPicker\(true\)\}/);
 assert.match(src,/key=\{\x60\$\{cityHint\}:\$\{attempt\}\x60\}/);
 assert.match(src,/LiteAPI\.SearchBar\.create/);
 assert.match(src,/hotelWidgetSearchParams\(payload, displayCurrency\)/);
 assert.match(src,/hotelWhiteLabelUrl\(stay\)/);
});

test("The original Nuitee search stays full-width in Travel Hotels tab; Flights and Experiences remain unchanged",()=>{
 const travel=read("src/components/travel/ConnectedTravelWorkspace.tsx");
 const css=read("src/components/travel/ConnectedTravelWorkspace.module.css");
 assert.match(travel,/data-gth-travel-hotel-supplier="direct"/);
 assert.match(travel,/<HotelBookingExperience currency=\{draft\.currency\} directHandoff\s*\/>/);
 assert.match(travel,/className=\{styles\.hotelBookingFull\}/);
 assert.match(css,/\.hotelBookingFull :global\(\.gth-hotel-booking\)\{width:100%;max-width:100%;margin:0\}/);
 assert.match(travel,/connectedTwelveGoFlightHref\(flightTrip\)/);
 assert.match(travel,/connectedFlightHref\(flightTrip\)/);
 assert.match(travel,/{item==="experiences"&&<>/);
 assert.doesNotMatch(travel,/LiteAPI\.SearchBar\.create/);
 const globalCss=read("src/app/globals.css");
 assert.match(globalCss,/\.gth-hotel-search-frame/);
});
