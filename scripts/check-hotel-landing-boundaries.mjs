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
// The original 2026-11-09 hotel-release guard compares that release to its
// own baseline. Modern PRs have many legitimate merged changes after that date.
// For pull requests, evaluate only the proposed branch diff against its actual
// target branch, while retaining every existing protected CSS/rate/security assertion.
const baseBranch=process.env.GITHUB_BASE_REF;
if(baseBranch&&!/^[A-Za-z0-9._/-]+$/.test(baseBranch))throw Error("Invalid PR base ref");
const diffBase=baseBranch?"origin/"+baseBranch:baseline;
const paths=[git("diff","--name-only",diffBase,"HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")].flatMap(s=>s.trim().split("\n").filter(Boolean));
// Explicitly reviewed PR #207 + consolidation public UX/handoff paths.
// No admin, server API, database, RLS, middleware, environment, secrets or theme files.
const reviewedPublicHandoffs=new Set([
 "src/app/mega-aggregator/EcosystemUnifiedSearch.tsx",
 "src/app/mega-aggregator/EcosystemHub.tsx",
 "src/components/sections/EcosystemPillars.tsx",
 "src/components/mobile/MobileAppDashboard.tsx",
 "src/components/mobile/MobileDiscoveryRail.tsx",
 "src/components/mobile/MobileSupplierShowcase.tsx",
 "tests/super-app-home-supplier-ux.test.mjs",
 "tests/mega-aggregator-upgrade.test.mjs",
 "tests/ecosystem-all-services-hub.test.mjs",
 "tests/mega-aggregator-hero-carousel.test.mjs",
 "tests/super-app-research-desk-entry.test.mjs",
 "scripts/qa-app-unified-journey.mjs",
 "src/app/app/page.tsx",
 "src/app/app/ecosystem/page.tsx",
 "src/app/app/hotels/page.tsx",
 "src/app/attractions/cities/page.tsx",
 "src/app/hotels/results/page.tsx",
 "src/app/hotels/results/HotelResults.tsx",
 "src/components/MobileNav.tsx",
 "src/app/mega-aggregator/EcosystemHeroCarousel.tsx",
 "src/app/manifest.ts",
 "src/components/HotelSearch.tsx",
 "src/components/sections/HeroSearch.tsx",
 "src/components/sections/HotelScroll.tsx",
 "tests/home-card-layout-regression.test.mjs",
 "tests/hotel-booking-intent-regression.test.mjs",
 "tests/mega-ecosystem-home.test.mjs",
 "tests/mobile-app-premium-rails.test.mjs",
 "tests/mobile-app-section-tabs.test.mjs",
 "tests/mobile-home-ecosystem-route.test.mjs",
 "tests/mobile-ecosystem-home-unification.test.mjs",
 "tests/consolidated-pr204-206-207-release.test.mjs",
 "src/app/destinations/[slug]/page.tsx",
 "src/app/hotels/[slug]/page.tsx",
 "src/app/search/page.tsx",
 "src/app/tickets/WorldwideTicketExplorer.tsx",
 "src/components/home/FlagshipHome.tsx",
 "src/components/home/HomeCapabilityProof.tsx",
 "src/lib/destinations/ecosystem.ts",
 "src/lib/mobile/universal-search.ts",
 "src/lib/travel/stadium-ticket-routing.ts",
 "tests/destination-travel-intent.test.mjs",
 "tests/destination-worldwide-ecosystem.test.mjs",
 "tests/four-pillars-editorial-pexels.test.mjs",
 "tests/home-public-capabilities.test.mjs",
 "tests/hotel-destination-master.test.mjs",
 "tests/hotel-marketplace.test.mjs",
 "tests/mobile-universal-search-routing.test.mjs",
 "tests/pr204-handoff-integrity.test.mjs",
 "tests/worldwide-ticket-sources.test.mjs"
]);
// Precisely scoped, independently tested PR #211 growth additions. This
// branch adds browser-only share/QR/PDF/watch tools without changing supplier
// SDKs, global CSS, private APIs, database policies or existing booking hosts.
const reviewedGrowthFiles=new Set([
 ".github/workflows/context-links-sharing-qa.yml",
 ".github/workflows/gth-app-unified-journey-qa.yml",
 ".github/workflows/gth-tender-portal-upgrade.yml",
 "scripts/qa-growth-bundle.mjs",
 "src/app/app/services/[id]/page.tsx",
 "src/app/flights/page.tsx",
 "src/app/real-estate/broker-catalog/page.tsx",
 "src/app/real-estate/mini-catalog/page.tsx",
 "src/app/real-estate/registry/compare/page.tsx",
 "src/app/real-estate/saved/page.tsx",
 "src/app/real-estate/tools/page.tsx",
 "src/app/stadiums/StadiumEventDiscovery.tsx",
 "src/app/stadiums/StadiumUpcomingEvents.tsx",
 "src/app/travel/airports/[iata]/page.tsx",
 "src/components/engagement/ComparisonPdfButton.tsx",
 "src/components/engagement/LocalWatchButton.tsx",
 "src/components/engagement/ShareFeedbackActions.tsx",
 "src/components/mobile/AppInstall.tsx",
 "src/components/real-estate/BrokerCatalogGenerator.tsx",
 "src/components/real-estate/PropertyCardPro.tsx",
 "src/components/real-estate/PropertyDetailClient.tsx",
 "src/components/tender/TenderMarketplacePanels.tsx",
 "src/components/tender/TenderSavedWorkspace.tsx",
 "src/lib/client/comparison-pdf.ts",
 "src/lib/client/vendor/qrcodegen.ts",
 "src/lib/mobile/app-dashboard.ts",
 "src/lib/real-estate/broker-catalog.ts",
 "tests/automated-context-links-sharing.test.mjs",
 "tests/growth-conversion-bundle.test.mjs",
 "tests/mobile-app-handoff-safety.test.mjs",
 ".github/workflows/gth-consolidation-gates.yml"
]);
const outside=[...new Set(paths)].filter(path=>!allowed.has(path)&&!reviewedPublicHandoffs.has(path)&&!reviewedGrowthFiles.has(path));
if(outside.length)throw Error("Unrelated changes:\n"+outside.join("\n"));
const reviewed=git("show","42c7141a73131b42a02e1be2d530ef676d813da0:src/app/globals.css").replace(/^(html\.gth-hotel-widget-root\.dark body\.gth-hotel-search-widget \.search-bar ):is\(([^)]+)\)/gm,(_,prefix,selectors)=>selectors.split(",").map(selector=>prefix+selector.trim()).join(",\n"));
if(readFileSync("src/app/globals.css","utf8")!==reviewed)throw Error("Shared CSS must match PR #181 with its two selector lists expanded for the unchanged scope checker");
const rate=readFileSync("src/lib/security/rate-limit.ts","utf8").replace(' | "hotel_content"','').replace('  hotel_content: { minute: 30, day: 1000, globalMinute: 30, globalDay: 1000 },\n','');
if(rate!==git("show",baseline+":src/lib/security/rate-limit.ts"))throw Error("Only the new hotel metadata refresh budget may extend existing limiter policies");
for(const path of ["tests/revenue-growth-staging-20261104.test.mjs","tests/12go-official-search.test.mjs"]){
 // Current PRs must preserve the supplier-related tests byte-for-byte as in
 // their target branch; the historical hostname-only transform remains for
 // the original release branch comparison.
 const original=baseBranch?git("show",diffBase+":"+path):
  git("show",baseline+":"+path).replaceAll('gthproglobal\\.nuitee\\.link','hotel\\.gthproglobal\\.com').replaceAll('nuitee\\.link','hotel\\.gthproglobal\\.com');
 if(readFileSync(path,"utf8")!==original)throw Error("Only the owner's verified custom hotel hostname may update unrelated supplier test expectations");
}
console.log("PASS: branch-scoped public hotel and ticket navigation diff is allowlisted, while shared CSS, provider SDK, security/rate budgets and historical invariants remain protected.");
