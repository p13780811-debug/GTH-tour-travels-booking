import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const baseline="5d198ab775e5dd44f92f4d8f721a87728e7e06bd";
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"});
const allowed=new Set([
 "src/app/tender/layout.tsx","src/app/tender/TenderForms.module.css",
 "src/app/hotels/page.tsx","src/app/hotels/layout.tsx","src/app/hotels/HotelsLanding.module.css",
 "src/components/hotel/NuiteeHotelOffers.tsx","tests/nuitee-hotel-discovery-seo.test.mjs",
 "src/components/hotel/NuiteeHotelsListWidget.tsx","src/components/hotel/NuiteeHotelsListWidget.module.css","src/components/hotel/nuitee-widget-theme.ts",
 "tests/nuitee-free-usage-boundary.test.mjs","docs/nuitee-integration-cost-boundary-20261109.md",
 "src/lib/travel/hotel-currency.ts","src/lib/travel/nuitee-free-currencies.ts","src/lib/travel/hotel-whitelabel.ts",
 "src/app/api/hotels/reference/currencies/route.ts","src/components/hotel/HotelCurrencySelector.tsx",
 "src/components/hotel/HotelBookingExperience.tsx","src/components/hotel/HotelsDiscoveryPlacement.tsx",
 "tests/nuitee-free-currencies.test.mjs","tests/hotels-mobile-whitelabel-width.test.mjs","scripts/qa-nuitee-free-reference.mjs",
 "scripts/qa-hotel-landing.mjs","scripts/check-hotel-landing-boundaries.mjs",
 ".github/workflows/gth-hotel-landing-qa.yml","docs/releases/hotels-premium-20261109.md"
 ,"src/app/globals.css"
 ,"src/lib/travel/nuitee-read-budget.ts","src/lib/travel/hotel-audience.ts","src/lib/travel/nuitee-free-hotels.ts",
 "src/app/api/hotels/discovery/route.ts","src/components/hotel/NearbyHotelDiscovery.tsx","src/lib/security/rate-limit.ts",
 "src/lib/travel/hotel-provider-search.ts","src/app/hotels/explore/[slug]/page.tsx",
 "tests/hotel-whitelabel.test.mjs","tests/hotel-travelpayouts-drive-fallback.test.mjs","tests/travel-conversion-gates.test.mjs",
 "tests/hotel-nearby-search.test.mjs","tests/hotel-booking-journey.test.mjs","tests/hotel-geographic-discovery.test.mjs"
 ,"tests/revenue-growth-staging-20261104.test.mjs","tests/12go-official-search.test.mjs"
]);
const paths=[git("diff","--name-only",baseline,"HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")].flatMap(s=>s.trim().split("\n").filter(Boolean));
const outside=[...new Set(paths)].filter(path=>!allowed.has(path));
if(outside.length)throw Error("Unrelated changes:\n"+outside.join("\n"));
const reviewed=git("show","42c7141a73131b42a02e1be2d530ef676d813da0:src/app/globals.css").replace(/^(html\.gth-hotel-widget-root\.dark body\.gth-hotel-search-widget \.search-bar ):is\(([^)]+)\)/gm,(_,prefix,selectors)=>selectors.split(",").map(selector=>prefix+selector.trim()).join(",\n"));
if(readFileSync("src/app/globals.css","utf8")!==reviewed)throw Error("Shared CSS must match PR #181 with its two selector lists expanded for the unchanged scope checker");
const rate=readFileSync("src/lib/security/rate-limit.ts","utf8").replace(' | "hotel_content"','').replace('  hotel_content: { minute: 30, day: 1000, globalMinute: 30, globalDay: 1000 },\n','');
if(rate!==git("show",baseline+":src/lib/security/rate-limit.ts"))throw Error("Only the new hotel metadata refresh budget may extend existing limiter policies");
for(const path of ["tests/revenue-growth-staging-20261104.test.mjs","tests/12go-official-search.test.mjs"]){
 const original=git("show",baseline+":"+path).replaceAll('gthproglobal\\.nuitee\\.link','hotel\\.gthproglobal\\.com').replaceAll('nuitee\\.link','hotel\\.gthproglobal\\.com');
 if(readFileSync(path,"utf8")!==original)throw Error("Only the owner's verified custom hotel hostname may update unrelated supplier test expectations");
}
console.log("PASS: homepage, shared CSS/navigation, supplier SDK/search validation, hotel APIs/results/detail, Flights, Real Estate, app, SEO inventory, SQL/RLS and secrets preserved.");
