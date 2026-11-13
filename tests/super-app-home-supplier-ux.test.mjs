import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("GTH PRO Home reuses full approved design and keeps private research, installation and all services",()=>{
 const page=read("src/app/app/page.tsx");
 for(const expected of [
  "GTH PRO Home","EcosystemHeroCarousel embedded","EcosystemUnifiedSearch appHome",
  "EcosystemPillars appHome","EcosystemHub appHome","MobileSupplierShowcase",
  "AppResearchQuickAccess","AppInstall",'MobileAppDashboard mode="tools"',
  'href="/app/board"','href="/app/explore"',
 ])assert.ok(page.includes(expected),"Missing "+expected);
 assert.doesNotMatch(page,/loadMobileDiscovery\(\)|createClient\(|SERVICE_ROLE_KEY|NEXT_PUBLIC_.*SECRET/);
 assert.match(read("src/app/page.tsx"),/return <FlagshipHome \/>/);
 assert.match(read("src/components/MobileNav.tsx"),/href: "\/app", appHref: "\/app", name: "Home"/);
 assert.match(read("src/components/mobile/AppInstall.tsx"),/beforeinstallprompt/);
});
test("GTH PRO Home shows official Nuitee widget and honest photo-based city booking shortcuts",()=>{
 const source=read("src/components/mobile/MobileSupplierShowcase.tsx");
 const sdk=read("src/components/hotel/NuiteeHotelsListWidget.tsx");
 assert.match(source,/NuiteeHotelsListWidget/);
 assert.match(source,/placeId="ChIJwe1EZjDG5zsRaYxkjY_tpF0"/);
 assert.match(source,/view:"booking"/);
 assert.match(sdk,/sdk\.HotelsList\.create\(options\)/);
 assert.match(sdk,/HOTEL_BOOKING_ORIGIN/);
 assert.doesNotMatch(source,/NUITEE_PRODUCTION_API_KEY|fetch\(|createClient\(|\/api\/hotels|service_role|Math\.random/);
 for(const city of ["mumbai","kolkata","goa","london"])
  assert.ok(existsSync(new URL("../public/images/cities/"+city+".jpg",import.meta.url)),"Missing editorial asset "+city);
});
test("Homepage tour/activities reuse genuine WeGoTrip source product, original photo and supplier URL",()=>{
 const home=read("src/components/mobile/MobileSupplierShowcase.tsx");
 const source=read("src/lib/tours/supplier-catalog.ts");
 const card=read("src/components/tours/SupplierTourCard.tsx");
 assert.match(home,/getSupplierCatalog\(\{currency:"USD"\},"\/tours"\)/);
 assert.match(home,/getSupplierCatalog\(\{currency:"USD"\},"\/activities"\)/);
 assert.match(home,/uniqueSupplierProducts/);
 assert.match(home,/<SupplierTourCard product=\{item\}\/>/);
 assert.match(source,/normalizeSupplierProduct/);
 assert.match(card,/src=\{product\.image\}/);
 assert.match(card,/href=\{product\.href\}/);
 assert.match(card,/Supplier-listed price/);
 assert.doesNotMatch(home,/faker|available today|guaranteed booking|SUPABASE_SERVICE_ROLE_KEY/i);
});
test("Native horizontal rails preserve vertical gestures and image swipe uses dominant horizontal axis",()=>{
 for(const path of [
  "src/app/mega-aggregator/EcosystemHeroCarousel.tsx",
  "src/components/mobile/MobileDiscoveryRail.tsx",
  "src/components/mobile/MobileSupplierShowcase.tsx",
 ]){
  const source=read(path);
  assert.match(source,/touch-auto/);
  assert.doesNotMatch(source,/touch-pan-x|preventDefault\(/);
 }
 assert.match(read("src/app/mega-aggregator/EcosystemHeroCarousel.tsx"),/Math\.abs\(dx\)<=Math\.abs\(dy\)\*1\.25/);
});
test("Existing route engines and app/search entry preserved; supplier category blog not misrouted",()=>{
 const search=read("src/app/mega-aggregator/EcosystemUnifiedSearch.tsx");
 const hub=read("src/app/mega-aggregator/EcosystemHub.tsx");
 assert.match(search,/appHome\?"\/app\/search":"\/search"/);
 assert.match(search,/!appHome\|\|option\.value!=="blog"/);
 assert.match(hub,/mobileAppHref\(service\.href\)/);
 assert.match(read("src/app/app/search/page.tsx"),/resolveUniversalTarget/);
 assert.match(read("src/components/mobile/MobileAppDashboard.tsx"),/AppServiceGrid/);
});
