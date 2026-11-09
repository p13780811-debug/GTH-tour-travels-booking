import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const baseline="b514a681de7fdda24a21245d8cbfac485b9ad4c3";
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"});
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
