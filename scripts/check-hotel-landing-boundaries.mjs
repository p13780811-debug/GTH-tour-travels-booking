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
]);
const paths=[git("diff","--name-only",baseline,"HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")].flatMap(s=>s.trim().split("\n").filter(Boolean));
const outside=[...new Set(paths)].filter(path=>!allowed.has(path));
if(outside.length)throw Error("Unrelated changes:\n"+outside.join("\n"));
if(readFileSync("src/app/globals.css","utf8")!==git("show","42c7141a73131b42a02e1be2d530ef676d813da0:src/app/globals.css"))throw Error("Shared CSS must match the reviewed PR #181 hotel-only contrast repair exactly");
console.log("PASS: homepage, shared CSS/navigation, supplier SDK/search validation, hotel APIs/results/detail, Flights, Real Estate, app, SEO inventory, SQL/RLS and secrets preserved.");
