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
]);
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
console.log("PASS: only connected Travel UI, validated context and verified hosted handoff changed. Existing supplier engines, paid API boundaries, home/mega, app, shared CSS, database/security and SEO are unchanged.");
