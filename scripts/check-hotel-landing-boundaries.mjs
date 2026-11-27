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
// The Cloudflare migration is a cumulative multi-feature PR, not a hotel-only PR.
// Its exact previously audited source tree is pinned; only these two guard
// implementations may differ. Any further application/config change fails closed.
const migrationScope=process.env.GITHUB_EVENT_NAME==="pull_request"&&
 process.env.GITHUB_BASE_REF==="main"&&process.env.GITHUB_HEAD_REF==="infra/cloudflare-preflight-20261125";
const migrationSnapshot="7a453ad281aeacda764f1b4fbf9ad161bfaca342";
if(migrationScope){
 git("merge-base","--is-ancestor",migrationSnapshot,"HEAD");
 const guardFiles=new Set(["scripts/check-hotel-landing-boundaries.mjs","scripts/check-connected-travel-boundaries.mjs"]);
 const drift=[git("diff","--name-only",migrationSnapshot,"HEAD"),git("diff","--name-only","HEAD"),git("ls-files","--others","--exclude-standard")]
  .flatMap(s=>s.trim().split("\n").filter(Boolean)).filter(path=>!guardFiles.has(path));
 if(drift.length)throw Error("Migration source differs from pinned release snapshot: "+drift.join(", "));
}
const diffBase=migrationScope?migrationSnapshot:baseBranch?"origin/"+baseBranch:baseline;
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
 "src/components/real-estate/BrokerProjectPicker.tsx",
 "src/components/real-estate/BrokerVoiceInput.tsx",
 "src/components/real-estate/ExplorerCard.tsx",
 "src/components/real-estate/RegistryDiscovery.tsx",
 "src/components/real-estate/SavePropertyButton.tsx",
 "src/lib/real-estate/saved.ts",
 "src/components/real-estate/PropertyCardPro.tsx",
 "src/components/real-estate/PropertyDetailClient.tsx",
 "src/components/tender/TenderMarketplacePanels.tsx",
 "src/components/tender/TenderSavedWorkspace.tsx",
 "src/lib/client/comparison-pdf.ts",
 "public/sw.js",
 "src/lib/client/vendor/qrcodegen.ts",
 "src/lib/mobile/app-dashboard.ts",
 "src/lib/real-estate/broker-catalog.ts",
 "tests/automated-context-links-sharing.test.mjs",
 "tests/growth-conversion-bundle.test.mjs",
 "src/lib/client/broker-poster.ts",
 "src/lib/tender/readiness-score.ts",
 "src/components/tender/BidReadinessReport.tsx",
 "src/components/engagement/ShareComparisonButton.tsx",
 "src/components/engagement/ShareTripPlanButton.tsx",
 "src/app/tender/page.tsx",
 "src/app/travel/page.tsx",
 "src/app/stadiums/[slug]/page.tsx",
 "tests/viral-growth-tools.test.mjs",
 "scripts/qa-viral-growth-tools.mjs",
 "scripts/check-connected-travel-boundaries.mjs",
 "scripts/qa-connected-travel.mjs",
 "tests/mobile-app-handoff-safety.test.mjs",
 ".github/workflows/gth-consolidation-gates.yml"
]);
// PR #221 source-reviewed white-label branding change set. Never allow arbitrary
// unrelated files merely because they are under src/. A filename is permitted
// only when its exact Git blob SHA is the one reviewed in this brand-only batch.
// If any implementation, URL, API, policy or CSS changes later, the blob check
// fails closed until that precise edit receives another review.
const reviewedBrandBlobs=new Map([
  ["tests/pr204-handoff-integrity.test.mjs","1f5db509d6c20d80ed68c3424b135fbd97fb9e62"],
  ["tests/live-public-ux-audit-fixes.test.mjs","4816c40615cc4f46f0cfbf7920c76016e12a85f8"],
  ["tests/cruises-indian-waters.test.mjs","4184e9c907e39fc440732d21b199ba10b365813c"],
  ["tests/consolidated-pr204-206-207-release.test.mjs","a3397a59e8e8997add7f77cfb03df6479e240f06"],
  ["tests/attraction-ticket-partner-discovery.test.mjs","c12aff705d198094994a17ad1f58d5b52a7763c0"],
  ["README.md","57d45a5d08cee9cd14c958e8347c44eb9c825400"],
  ["src/app/(mapped-places)/attractions/osm/[id]/page.tsx","1277f14ec0c50888950800e31ef3d8dbb3b7f4e6"],
  ["src/app/attractions/page.tsx","b3d43426a00bc370620dc2040e79e1f1afadd9e2"],
  ["src/app/cars/page.tsx","d624a86909d86aa1de7dda2be648add62deee352"],
  ["src/app/cruises/page.tsx","8f1736c36a02aa01147561c51e68a440e66ff49e"],
  ["src/app/flights/layout.tsx","fd53b03891d6d72e3ebd7aba27a266c19fc518a4"],
  ["src/app/gth-ecosystem-manifest/page.tsx","a008e886210b53a3a0565b778d8f1ff9eadf42e2"],
  ["src/app/hotels/stay/[id]/page.tsx","bbf29ff424960dcf77093ff2135814e2ac5ee229"],
  ["src/app/layout.tsx","f3aa85a7d36f920f21efa9f4dedd61769d169c16"],
  ["src/app/mega-aggregator/page.tsx","e3abfe67c9bf8ad85b17315cd5789d3080643217"],
  ["src/app/sitemap.ts","3de57f54e711d013d82580a65ea4dbb0503495db"],
  ["src/app/system/page.tsx","a98dd1968ee785b1893ebe2b6c0df95df5cf8b31"],
  ["src/app/transfers/page.tsx","bdd8d3d2f73293d2d83c7caa8f1f0624e7efe423"],
  ["src/app/travel/airports/page.tsx","9c1ea4c2db9b3e682bdda9b89770ff86691e45e8"],
  ["src/components/ecosystem/SmartSynergy.tsx","46df65bdc87ef1712364d6ffdb56c28685a9c665"],
  ["src/components/flights/AviasalesWhiteLabel.tsx","04bb8db6c21d7c108eb68b2e4633f69fea7d9bb7"],
  ["src/components/gth/TrustMatrix.tsx","13da6d7a06716691802e8bfb235e410eeff058a2"],
  ["src/components/hotel/HotelBookingLinkReview.tsx","7d665dc3a1f1bc2064904e2bed306045aee8f990"],
  ["src/components/sections/TrustMatrix.tsx","e785b095d9cc33e70a5f3611ff778ab7bd34d72f"],
  ["src/components/seo/EcosystemGuideResources.tsx","f7e7f64eb05518cea5a4c6afef99d7374b97147f"],
  ["src/components/seo/SiteIdentitySchema.tsx","8e704fd844f667cb0bfc36699d8abe38027b0bc3"],
  ["src/components/tours/ReviewedPartnerCard.tsx","254b438af33284fc5b6f0771b9a87271186ded19"],
  ["src/components/tours/ReviewedPartnerCatalog.tsx","45217db756eb3ced5de7171c088601dba26bef01"],
  ["src/components/tours/SupplierTourCard.tsx","e474a906e3cb16b19a5fdd2309de7394519a5e80"],
  ["src/components/tours/SupplierTourCatalog.tsx","fb055100fe64bedaf2ada2d5e4bda6edbe9efb71"],
  ["src/components/tours/TiqetsPartnerWidgets.tsx","90e5998b3d11c9f1f05c6b880348810d7c7423bc"],
  ["src/components/tours/TourAffiliateMarketplace.tsx","b3c16c94c068d3ed46bf9ed6bec02f20ca8ec13a"],
  ["src/components/tours/TourSearchHero.tsx","f753de1dda64c32bd6646dada877ebcb80e7a911"],
  ["src/components/travel/AirportDiscoveryTools.tsx","d439017b758c40cae2d057bfb2a492e806665744"],
  ["src/components/travel/AirportJourneyServices.tsx","e080222b60b8608dcdcdedd06c19a5a1e6080aee"],
  ["src/components/travel/DealsDiscovery.tsx","6ec5462af931593ffd978a6bbf5526bacf4765f1"],
  ["src/components/travel/GuidePartnerHandoffs.tsx","1b028f16113dc4ee8fb837a76f75df42d87bc7ea"],
  ["src/components/travel/IndianWaters.tsx","6a88b14df7ab7b9a414180c776b34208c6b65591"],
  ["src/components/travel/TransferProviderWidgets.tsx","d6f9945aa40aa37f56fbd313ebc4439fb4b8480d"],
  ["src/components/travel/TravelPartnerSearch.tsx","6dc4eb37ee2c4b04fc30a7d8a8b975aa53859b53"],
  ["src/components/travel/TravelpayoutsCarWidget.tsx","0fabacc142d0eb5a8935c7c4893bfcf06f2fafb7"],
  ["tests/enterprise-identity-manifest.test.mjs","417093552f2b86438747b5673e53e314c900cd98"],
  ["tests/pr221-brand-identity.test.mjs","849e9fd820863886bcb129c0c67e03633561c699"],
  ["tests/transfer-widgets.test.mjs","811996b218c764d0c60e9f84c75fc60c3f192833"],
]);
function isExactReviewedBrandBlob(path){
 const expected=reviewedBrandBlobs.get(path);
 return Boolean(expected&&git("hash-object","--",path).trim()===expected);
}
// Exact PR #227 mobile storefront scope. Do not broaden this allowlist to
// arbitrary src/, CSS, server routes or supplier SDK files.
for (const path of [
 "src/components/hotel/HotelDiscoveryShowcase.tsx",
 "tests/hotel-storefront-hopegoo-style.test.mjs",
 "tests/hotel-date-free-discovery.test.mjs",
 "tests/osm-attractions-contract.test.mjs",
 "vercel.json",
]) allowed.add(path);

// A narrowly reviewed recovery PR may touch booking UI, bounded directory
// error handling and QA, but never the working supplier SDK, 12Go or theme.
const hotelRecoveryBranch=process.env.GITHUB_HEAD_REF==="fix/hotel-goa-dubai-booking-and-directory-20261119";
const directHotelBranch=process.env.GITHUB_HEAD_REF==="fix/travel-hotels-nuitee-direct-20261119";
if(directHotelBranch){
 for(const path of [
  "src/components/travel/ConnectedTravelWorkspace.tsx",
  "src/components/hotel/HotelDiscoveryShowcase.tsx",
  "src/app/hotels/explore/[slug]/page.tsx",
  "src/lib/travel/klook-hotel-search.ts",
  "tests/hotel-booking-fallback-cities.test.mjs",
    "tests/hotel-storefront-hopegoo-style.test.mjs",
    "tests/nuitee-hotel-discovery-seo.test.mjs",
    "tests/pr204-handoff-integrity.test.mjs",
  "tests/travel-hotels-direct-handoff.test.mjs",
  "scripts/qa-connected-travel.mjs",
  "scripts/check-connected-travel-boundaries.mjs",
  "scripts/check-hotel-landing-boundaries.mjs"
 ])allowed.add(path);
 for(const path of [
  "src/app/globals.css","src/lib/travel/hotel-whitelabel.ts",
  "src/lib/travel/hotel-routing.ts","src/lib/travel/partner-search.ts",
  "src/lib/travel/connected-trip.ts","src/components/mobile/MobileSupplierShowcase.tsx",
  "src/app/flights/page.tsx"
 ])if(paths.includes(path))throw Error("PR240 must not modify working supplier/security/theme: "+path);
}

if(hotelRecoveryBranch){
 for(const path of [
  "src/app/api/hotels/route.ts","src/components/travel/ConnectedTravelWorkspace.tsx",
  "src/lib/travel/connected-hotel-handoff.ts","src/lib/travel/klook-hotel-search.ts",
  "tests/hotel-booking-fallback-cities.test.mjs","tests/hotel-integrated-handoff.test.mjs",
  "tests/hotel-filter-pagination.test.mjs",
  "tests/travel-hotels-direct-handoff.test.mjs","scripts/qa-connected-travel.mjs",
  "scripts/check-connected-travel-boundaries.mjs"
 ])allowed.add(path);
 for(const protectedPath of [
  "src/lib/travel/hotel-whitelabel.ts","src/lib/travel/hotel-routing.ts",
  "src/lib/travel/partner-search.ts","src/lib/travel/connected-trip.ts",
  "src/components/mobile/MobileSupplierShowcase.tsx","src/app/globals.css"
 ])if(paths.includes(protectedPath))throw Error("Hotel recovery cannot alter working supplier/theme: "+protectedPath);
}
// A Vercel configuration edit is permitted ONLY to disable previews for this
// unverified draft branch. The rest of the project configuration must be byte-
// equivalent at the parsed JSON level to its merge base.
if (paths.includes("vercel.json")) {
 const current=JSON.parse(readFileSync("vercel.json","utf8"));
 const original=JSON.parse(git("show",diffBase+":vercel.json"));
 const previewBranch=hotelRecoveryBranch?"fix/hotel-goa-dubai-booking-and-directory-20261119":"feat/hotel-date-free-discovery-20261118";
 if(current.git?.deploymentEnabled?.[previewBranch]!==false)
   throw Error("Hotel storefront draft branch must not auto-deploy on Vercel");
 delete current.git.deploymentEnabled[previewBranch];
 if(JSON.stringify(current)!==JSON.stringify(original))
   throw Error("Unexpected Vercel changes beyond disabled storefront preview");
}
if (paths.includes("tests/osm-attractions-contract.test.mjs")) {
 const sync=readFileSync(".github/workflows/gth-osm-attractions-sync.yml","utf8");
 if(!/if: \$\{\{ false \}\}/.test(sync) || /^  schedule:|^  push:/m.test(sync))
   throw Error("Do not re-enable the paused attraction importer to satisfy legacy tests");
}

const storefrontPath="src/components/hotel/HotelDiscoveryShowcase.tsx";
if(paths.includes(storefrontPath)){
 const storefront=readFileSync(storefrontPath,"utf8");
 if(/SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_.*SECRET|ODDS_API_KEY|api\.the-odds-api|hopegoo\.com|booking\.com\/hotel/i.test(storefront))
   throw Error("Storefront may not expose keys, paid supplier calls or untracked direct booking URLs");
}

// The original hotel-only allowlist should not reject the separately tested
// multi-sector PR. Its additional files must match an exact pinned snapshot;
// future unreviewed changes fail closed, and the CSS/rate guards below still run.
const integrationSnapshot="b372ca076189e1d84d46cc04acb0996947cdde82";
function matchesPinnedIntegrationSnapshot(path){
 if(process.env.GITHUB_BASE_REF!=="main"||process.env.GITHUB_HEAD_REF!=="feat/gth-decision-platform-integrated-20261117")return false;
 try{
  const expected=git("rev-parse",integrationSnapshot+":"+path).trim();
  return /^[0-9a-f]{40}$/.test(expected)&&git("hash-object","--",path).trim()===expected;
 }catch{return false;}
}
// PR #248 combines reviewed SEO/brand metadata with a gated hotel detail
// schema. Its hotel file legitimately triggers this workflow, so do not skip
// hotel booking/layout tests. ONLY the exact reviewed blob versions from the
// immutable prior PR head may pass. Any new or modified SEO file fails closed.
// The historical CSS, rate-limit, provider and supplier-test checks below
// remain unchanged and still execute for every PR.
const pinnedSeoHead="51f998404b95f58854b4f273ddf3601243294258";
const pinnedSeoPaths=new Set([
 "src/app/hotels/stay/[id]/page.tsx",
 "src/app/page.tsx",
 "src/app/sitemap-index.xml/route.ts",
 "src/app/tender/[id]/page.tsx",
 "src/app/tours/[slug]/page.tsx",
 "src/components/home/FlagshipHome.module.css",
 "src/components/home/FlagshipHome.tsx",
 "src/components/seo/SiteIdentitySchema.tsx",
 "src/lib/seo/large-sitemaps.ts",
 "src/lib/seo/vertical-structured-data.ts",
 "tests/flagship-home.test.mjs",
 "tests/home-public-capabilities.test.mjs",
 "tests/large-scale-seo-sitemaps.test.mjs",
 "tests/official-site-identity-search.test.mjs",
 "tests/seo-master-index-resilience.test.mjs",
 "tests/seo-vertical-structured-data.test.mjs"
]);
// PR #249's independently verified attraction-discovery change set was
// consolidated into PR #248. Its exact reviewed Git blobs are accepted only
// on the PR #248 branch. Other versions, paths or branches fail closed.
const pinnedSeoDiscoveryBlobs=new Map([
 ["src/app/destinations/[slug]/page.tsx","2637e24f2e1d2928afb973c25ee27475f5562d59"],
 ["src/lib/destinations/ecosystem.ts","745f5f479516d47f3117dcb95e34fbcac32343c3"],
 ["tests/destination-travel-intent.test.mjs","273b7cd5c769a7c1edd6de24114dd75834b41c04"],
 ["tests/destination-ssr-metadata-cache.test.mjs","7581422f9c855b686a43e20b1017f3570d14dd27"],
 ["backend/ai_engine.py","bd17b003a6a476ed412e04d91d158b6cb9247732"],
 ["backend/engine.py","97c92c9de1273df030dc3332171dcbdfe69be4b0"],
 ["backend/supabase_db.py","5ef0b3ea2768212943787eb32c3d6515d1f6a668"],
 ["tests/test_city_seo_engine.py","5f278a9eef8ba894f75dc287868210e8650bf4c1"],
 [".github/workflows/gth-city-seo-batch.yml","cd13374a07b15070e03fa236873a426a14ac8dbe"],
 ["requirements.txt","28e2763271798d1a6c501e30c68ddfcc7ab21a22"],
 [".github/workflows/gth-city-seo-engine-qa.yml","ad20334e62f9a333916d8f3f078c3964d89ac4b5"]
]);
const seoScope=process.env.GITHUB_BASE_REF==="main"&&
  process.env.GITHUB_HEAD_REF==="fix/flagship-visible-pro-heading-20261122";
// The destination PR also has a fixed, reviewed tree. While it is stacked
// here, permit only byte-identical paths from that reviewed diff.
const reviewedDestinationHead = "01f6dbae341f9d6bce7bff46664f64822c9977f5";
const destinationDiffBase = "51b789f2d125693a0a73919efb5dc25060f4037f";
const reviewedDestinationPaths = seoScope
  ? new Set(git("diff", "--name-only", destinationDiffBase + "..." + reviewedDestinationHead).trim().split("\n"))
  : new Set();
function matchesPinnedSeoBlob(path){
 if(!seoScope)return false;
 try{
  const discoveryBlob=pinnedSeoDiscoveryBlobs.get(path);
  if(discoveryBlob)return git("hash-object","--",path).trim()===discoveryBlob;
  const pinnedHead = pinnedSeoPaths.has(path) ? pinnedSeoHead
    : reviewedDestinationPaths.has(path) ? reviewedDestinationHead : null;
  if (!pinnedHead) return false;
  const expected=git("rev-parse",pinnedHead+":"+path).trim();
  return /^[a-f0-9]{40}$/.test(expected)&&git("hash-object","--",path).trim()===expected;
 }catch{return false;}
}
if(seoScope){
 // Also cover paths allowed by older review sets: require exact snapshot
 // for the whole PR diff, except this scoped guard implementation itself.
 const drift=[...new Set(paths)].filter(path=>
  path!=="scripts/check-hotel-landing-boundaries.mjs"&&!matchesPinnedSeoBlob(path));
 if(drift.length)throw Error("PR #248 contains an unreviewed or changed blob:\n"+drift.join("\n"));
}
const outside=[...new Set(paths)].filter(path=>!allowed.has(path)&&!reviewedPublicHandoffs.has(path)&&!reviewedGrowthFiles.has(path)&&!isExactReviewedBrandBlob(path)&&!matchesPinnedIntegrationSnapshot(path)&&!matchesPinnedSeoBlob(path));
if(outside.length)throw Error("Unreviewed integration changes or unrelated paths:\n"+outside.join("\n"));
const reviewed=git("show","42c7141a73131b42a02e1be2d530ef676d813da0:src/app/globals.css").replace(/^(html\.gth-hotel-widget-root\.dark body\.gth-hotel-search-widget \.search-bar ):is\(([^)]+)\)/gm,(_,prefix,selectors)=>selectors.split(",").map(selector=>prefix+selector.trim()).join(",\n"));
if(readFileSync("src/app/globals.css","utf8")!==reviewed)throw Error("Shared CSS must match PR #181 with its two selector lists expanded for the unchanged scope checker");
const rate=readFileSync("src/lib/security/rate-limit.ts","utf8").replace(' | "hotel_content"','').replace('  hotel_content: { minute: 30, day: 1000, globalMinute: 30, globalDay: 1000 },\n','');
if(migrationScope){
 // Cloudflare ingress identity is the sole reviewed migration limiter delta;
 // policy limits, Redis script and fail-closed behavior are unchanged.
 const current=readFileSync("src/lib/security/rate-limit.ts","utf8");
 if(current!==git("show",migrationSnapshot+":src/lib/security/rate-limit.ts"))
  throw Error("Migration limiter differs from pinned ingress implementation");
 const mainRate=git("show","origin/main:src/lib/security/rate-limit.ts");
 const policies=s=>s.slice(s.indexOf("const POLICIES:"),s.indexOf("export const LIMIT_SCRIPT"));
 if(!policies(mainRate)||policies(current)!==policies(mainRate))
  throw Error("Migration cannot change existing rate limit policies");
}else if(rate!==git("show",baseline+":src/lib/security/rate-limit.ts"))throw Error("Only the new hotel metadata refresh budget may extend existing limiter policies");
for(const path of ["tests/revenue-growth-staging-20261104.test.mjs","tests/12go-official-search.test.mjs"]){
 // Current PRs must preserve the supplier-related tests byte-for-byte as in
 // their target branch; the historical hostname-only transform remains for
 // the original release branch comparison.
 const original=baseBranch?git("show",diffBase+":"+path):
  git("show",baseline+":"+path).replaceAll('gthproglobal\\.nuitee\\.link','hotel\\.gthproglobal\\.com').replaceAll('nuitee\\.link','hotel\\.gthproglobal\\.com');
 if(readFileSync(path,"utf8")!==original)throw Error("Only the owner's verified custom hotel hostname may update unrelated supplier test expectations");
}
console.log("PASS: branch-scoped public hotel and ticket navigation diff is allowlisted, while shared CSS, provider SDK, security/rate budgets and historical invariants remain protected.");
