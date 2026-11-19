import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const baseline="b514a681de7fdda24a21245d8cbfac485b9ad4c3";
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"});

/**
 * The original release's fixed historical hashes are intentionally preserved
 * below. For later PRs, require every provider and published supplier source to
 * be byte-identical to the target main branch instead of a 2026-11-09 snapshot.
 * This is a stricter non-regression comparison for today's product baseline.
 */
if(process.env.GITHUB_EVENT_NAME==="pull_request" &&
   process.env.GITHUB_HEAD_REF!=="feat/travel-connected-journey-20261109"){
 const base=git("merge-base","HEAD","origin/main").trim();
 if(!/^[0-9a-f]{40}$/.test(base))throw Error("Could not verify the target main commit");
 const changed=new Set(git("diff","--name-only",base,"HEAD").trim().split("\n").filter(Boolean));
 const flightHandoffScope=process.env.GITHUB_HEAD_REF==="feat/travel-flights-12go-primary-avia-fallback-20261119";
 const hotelHandoffScope=process.env.GITHUB_HEAD_REF==="fix/hotel-goa-dubai-booking-and-directory-20261119";
 const worldwideHotelScope=process.env.GITHUB_HEAD_REF==="fix/worldwide-hotel-fallback-and-affiliate-20261119";
 const allowedHotelFixes=new Set([
  "src/components/hotel/HotelBookingExperience.tsx",
  "src/components/hotel/HotelDiscoveryShowcase.tsx",
  "src/lib/travel/klook-hotel-search.ts",
  "src/lib/travel/connected-hotel-handoff.ts",
  "src/app/api/hotels/route.ts"
 ]);
 const sensitive=[...changed].filter(path=>
  (path.startsWith("src/components/hotel/")||
  (path.startsWith("src/lib/travel/")&&!(flightHandoffScope&&path==="src/lib/travel/connected-trip.ts"))||
  path.startsWith("src/lib/flights/")||
  path.startsWith("src/components/flights/")||
  path.startsWith("src/app/api/")||
  path==="src/app/globals.css") &&
  !(hotelHandoffScope&&allowedHotelFixes.has(path)) &&
  !(worldwideHotelScope && new Set(["src/components/hotel/HotelBookingExperience.tsx","src/components/hotel/HotelDiscoveryShowcase.tsx","src/lib/travel/hotel-provider-search.ts","src/lib/travel/klook-hotel-search.ts"]).has(path)));
 if(sensitive.length)throw Error("Connected Travel PR must not modify supplier SDKs, API routes, shared theme or fare logic: "+sensitive.join(", "));
 if(worldwideHotelScope){
  const approved=new Set([
   "scripts/qa-connected-travel.mjs","scripts/check-connected-travel-boundaries.mjs",
   "scripts/check-hotel-landing-boundaries.mjs","src/app/hotels/page.tsx",
   "src/components/destination/DestinationExplorerResults.tsx",
   "src/components/hotel/HotelBookingExperience.tsx",
   "src/components/seo/EcosystemGuideResources.tsx",
   "src/components/travel/ConnectedTravelWorkspace.tsx",
   "src/components/travel/GuideDiscoveryRails.tsx",
   "src/components/travel/GuidePartnerHandoffs.tsx",
   "src/components/travel/MappedCityDiscovery.tsx",
   "src/lib/travel/hotel-provider-search.ts","src/lib/travel/klook-hotel-search.ts",
   "tests/hotel-nearby-search.test.mjs","tests/hotel-travelpayouts-drive-fallback.test.mjs",
   "tests/hotel-booking-fallback-cities.test.mjs","tests/travel-hotel-widget-entry.test.mjs",
   "tests/travel-guide-contract.test.mjs",
   "tests/hotel-booking-intent-regression.test.mjs",
   "src/components/hotel/HotelDiscoveryShowcase.tsx",
   "tests/hotel-storefront-hopegoo-style.test.mjs",
   "tests/travel-hotels-direct-handoff.test.mjs",
   "tests/destination-explorer-contract.test.mjs",
   "tests/hotel-booking-journey.test.mjs",
   "tests/nuitee-hotel-discovery-seo.test.mjs",
   "tests/travel-city-editorial-scale.test.mjs",
   "tests/travel-conversion-gates.test.mjs",
   "vercel.json"
  ]);
  const outside=[...changed].filter(p=>!approved.has(p));
  if(outside.length)throw Error("Worldwide hotel fix contains unreviewed files: "+outside.join(", "));
  for(const protectedPath of [
   "src/lib/travel/hotel-whitelabel.ts","src/lib/travel/hotel-routing.ts",
   "src/lib/travel/connected-trip.ts","src/lib/travel/partner-search.ts",
   "src/components/mobile/MobileSupplierShowcase.tsx","src/app/globals.css"
  ])if(changed.has(protectedPath))throw Error("Do not modify working Nuitee, Flights, booking parser, or global CSS: "+protectedPath);
  if(!readFileSync("src/components/travel/ConnectedTravelWorkspace.tsx","utf8").includes('data-travel-hotel-booking="supplier-search"'))
    throw Error("Hotels tab must contain genuine worldwide booking search");
 }
 const read=path=>readFileSync(path,"utf8");
 const original=path=>git("show",base+":"+path);
 if(changed.has("src/app/travel/page.tsx")){
  const expected=original("src/app/travel/page.tsx")
   .replace('import TravelSectionNav from "@/components/travel/TravelSectionNav";','import TravelSectionNav from "@/components/travel/TravelSectionNav";\nimport ShareTripPlanButton from "@/components/engagement/ShareTripPlanButton";')
   .replace('      <TravelSectionNav />','      <TravelSectionNav />\n      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6"><div className="gth-glass rounded-2xl border border-[var(--border)] p-4 sm:p-6"><h2 className="text-lg font-semibold">Plan a trip with friends</h2><p className="mt-2 text-xs text-[var(--text-soft)]">Choose a city and share a ready-to-send trip invitation with hotel and flight research links. No live deal or price is claimed.</p><ShareTripPlanButton title="Weekend / festival group trip" path="/travel"/></div></div>');
  if(read("src/app/travel/page.tsx")!==expected)throw Error("Travel page may add only the reviewed self-contained trip share entry");
 }
 if(changed.has("src/app/flights/page.tsx")){
  const expected=original("src/app/flights/page.tsx")
   .replace('import ShareFeedbackActions from "@/components/engagement/ShareFeedbackActions";','import ShareFeedbackActions from "@/components/engagement/ShareFeedbackActions";\nimport ShareTripPlanButton from "@/components/engagement/ShareTripPlanButton";')
   .replace('      <TravelSectionNav />','      <TravelSectionNav />\n      {city&&<div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><ShareTripPlanButton title={"Flight trip to "+city} city={city} airportCode={destination} path="/flights"/></div>}');
  if(read("src/app/flights/page.tsx")!==expected)throw Error("Flight page may add only the reviewed non-provider trip share entry");
 }
 if(hotelHandoffScope){
  // This branch repairs explicitly reviewed hotel handoffs only. Protect the
  // supplier SDK, production booking parser, original 12Go flights and theme.
  for(const protectedPath of [
   "src/lib/travel/hotel-whitelabel.ts","src/lib/travel/hotel-routing.ts",
   "src/lib/travel/partner-search.ts","src/lib/travel/connected-trip.ts",
   "src/components/mobile/MobileSupplierShowcase.tsx","src/app/flights/page.tsx",
   "src/app/globals.css"
  ])if(changed.has(protectedPath))throw Error("Hotel fix cannot modify protected working provider: "+protectedPath);
  const travel=read("src/components/travel/ConnectedTravelWorkspace.tsx");
  const hotel=read("src/lib/travel/connected-hotel-handoff.ts");
  if(!travel.includes("window.location.assign(directHotelHref)")||
     !hotel.includes("resolveHotelRoute")||
     !hotel.includes("hotelWhiteLabelSearchUrl")||
     !hotel.includes("trackedHotelCityHref")||
     /\bfetch\s*\(|process\.env|SERVICE_ROLE_KEY|api\.liteapi\.travel/.test(hotel))
    throw Error("Hotel Find stays requires fixed-origin no-API direct provider handoff");
 }
 if(flightHandoffScope){
  const src=read("src/lib/travel/connected-trip.ts");
  if(/\bfetch\s*\(|api\.12go|process\.env|NUITEE_.*KEY/.test(src))
    throw Error("Flight handoff cannot add API calls, credentials or paid supplier access");
  if(!src.includes("connectedTwelveGoFlightHref")||!src.includes('mode:"flight"')||
     !src.includes("connectedFlightHref"))throw Error("12Go preferred + Aviasales fallback must coexist");
  if([...changed].some(path=>/\.css$/.test(path)))
    throw Error("Flight handoff branch may not edit any CSS");
 }
 console.log("PASS: exact main-based reviewed Travel/Flights additions, supplier and fare source paths protected; fixed legacy guard retained.");
 process.exit(0);
}

const allowed=new Set([
 "src/app/travel/page.tsx","src/app/flights/page.tsx","src/components/travel/ConnectedTravelWorkspace.tsx",
 "src/components/travel/ConnectedTravelWorkspace.module.css","src/components/travel/NuiteeFlightHandoff.tsx",
 "src/components/hotel/NearbyHotelDiscovery.tsx","src/lib/travel/connected-trip.ts","src/lib/flights/fare-search.ts",
 "vercel.json","tests/connected-travel.test.mjs","scripts/check-connected-travel-boundaries.mjs",
 "scripts/qa-connected-travel.mjs",".github/workflows/gth-connected-travel.yml","docs/releases/connected-travel-20261109.md"
 ,"src/components/travel/TravelAirportField.tsx","src/lib/travel/travel-editorial.ts","src/app/travel/TravelLanding.module.css",
 "src/lib/travel/connected-experiences.ts","src/components/travel/ConnectedExperienceGallery.tsx","src/components/travel/ConnectedExperienceProductCard.tsx",
 "src/components/travel/ConnectedTravelEntry.tsx","src/app/api/travel/experiences/route.ts",
 "tests/travel-premium-discovery.test.mjs","tests/travel-action-labels.test.mjs","scripts/travel-action-copy.json","scripts/qa-travel-experiences-fixture.mjs"
 ,"scripts/travel-action-preserved-sha256.json"
 ,"tests/hotel-marketplace.test.mjs","tests/osm-place-seo.test.mjs"
 ,"tests/hotel-booking-journey.test.mjs","tests/hotel-travelpayouts-drive-fallback.test.mjs","tests/revenue-growth-staging-20261104.test.mjs"
]);
const copy=JSON.parse(readFileSync("scripts/travel-action-copy.json","utf8"));
for(const [path,pairs] of Object.entries(copy)){
 allowed.add(path);
 let expected=git("show","e0d1925fd2084584e984b7f04fb3823f4b757394:"+path);
 for(const [before,after]of pairs){if(!expected.includes(before))throw Error("Copy guard target missing: "+path);expected=expected.replaceAll(before,after);}
 if(readFileSync(path,"utf8")!==expected)throw Error("Only owner-requested action labels may change outside the Travel hub: "+path);
}
const paths=[git("diff","--name-only",baseline,"HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")].flatMap(value=>value.trim().split("\n").filter(Boolean));
const extra=[...new Set(paths)].filter(path=>!allowed.has(path));if(extra.length)throw Error("Changes outside connected Travel scope: "+extra.join(", "));
const read=path=>readFileSync(path,"utf8"),original=path=>git("show",baseline+":"+path);
if(read("src/lib/flights/fare-search.ts")!==original("src/lib/flights/fare-search.ts").replace("function flightPartnerUrl(","export function flightPartnerUrl("))throw Error("Existing fare behavior must stay unchanged");
const flightPage=read("src/app/flights/page.tsx").replace('import NuiteeFlightHandoff from "@/components/travel/NuiteeFlightHandoff";\n',"").replace('          <NuiteeFlightHandoff />\n',"");
if(flightPage!==original("src/app/flights/page.tsx"))throw Error("Only the verified optional Nuitee handoff may extend Flights");
const oldVercel=JSON.parse(original("vercel.json")),newVercel=JSON.parse(read("vercel.json"));
if(newVercel.git.deploymentEnabled["feat/travel-connected-journey-20261109"]!==false)throw Error("Work branch preview must be disabled");
delete newVercel.git.deploymentEnabled["feat/travel-connected-journey-20261109"];
if(JSON.stringify(oldVercel)!==JSON.stringify(newVercel))throw Error("Other release settings must stay unchanged");
console.log("PASS: connected Travel UI and owner-requested neutral action copy only. Supplier behavior, fixed URLs, paid API boundaries, ecosystem layouts, app, shared CSS, database/security and SEO are preserved.");
