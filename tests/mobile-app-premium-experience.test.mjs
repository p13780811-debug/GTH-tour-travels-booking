import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const file=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=file("src/components/mobile/MobileAppDashboard.tsx");
const journeys=file("src/components/mobile/AppJourneyCards.tsx");
const quick=file("src/components/mobile/AppResearchQuickAccess.tsx");
const explorer=file("src/app/app/explore/page.tsx");
const grid=file("src/components/mobile/AppServiceGrid.tsx");
const catalog=file("src/lib/mobile/app-dashboard.ts");

test("premium app home replaces duplicated giant search/category hero with real journeys",()=>{
 assert.match(home,/One world\. Your next move\./);
 assert.equal((home.match(/form action="\/app\/search"/g)||[]).length,1);
 assert.match(home,/AppJourneyCards/);
 assert.match(home,/AppResearchQuickAccess/);
 assert.match(home,/href="\/app\/search\?q=Goa\+hotel"/);
 assert.match(home,/href="\/app\/search\?q=Mumbai\+property"/);
 assert.match(home,/href="\/app\/search\?q=construction\+tender"/);
 assert.match(home,/MobileDiscoveryRail kind="hotel"/);
 assert.match(home,/MobileDiscoveryRail kind="property"/);
 assert.match(home,/MobileDiscoveryRail kind="tender"/);
 assert.match(home,/MobileDiscoveryRail kind="destination"/);
 assert.match(home,/pillar!=="all"&&<AppPromoCarousel/);
 assert.doesNotMatch(home,/Discover global opportunities across travel, properties and tenders — then keep your research together/);
});

test("editorial images and navigation come from already existing app assets and verified specialist flows",()=>{
 const cards=[
  ["/images/mega/welcome.jpg","/app/flights"],
  ["/images/real-estate.jpg","/app/property"],
  ["/images/tender.jpg","/app/tenders"],
 ];
 for(const [src,href] of cards){
  assert.ok(journeys.includes(src));
  assert.ok(journeys.includes(href));
  assert.doesNotThrow(()=>readFileSync(new URL("../public"+src,import.meta.url)));
 }
 assert.match(journeys,/alt=""/);
 assert.match(journeys,/snap-x snap-mandatory/);
 assert.match(journeys,/motion-reduce:transform-none/);
 assert.doesNotMatch(journeys,/Math\.random|faker|live fare|guaranteed|NEXT_PUBLIC_.*SECRET/);
 const serviceCount=(catalog.match(/\{id:"/g)||[]).length;
 assert.ok(serviceCount>=14);
});

test("personal continuation uses only local saved records and never claims account sync",()=>{
 assert.match(quick,/useAppResearch/);
 assert.match(quick,/items\.slice\(0,3\)/);
 assert.match(quick,/on this device/);
 assert.match(quick,/href="\/app\/board"/);
 assert.doesNotMatch(quick,/fetch\(|supabase|localStorage\.setItem|NEXT_PUBLIC_.*SECRET/);
});
test("Explore screen is mobile-first, no huge two-column category tiles",()=>{
 assert.match(explorer,/Find the next opportunity\. Anywhere\./);
 assert.match(explorer,/action="\/app\/search"/);
 assert.match(explorer,/snap-x snap-mandatory/);
 assert.match(explorer,/min-h-14 min-w-\[118px\]/);
 assert.match(explorer,/focus-within:outline/);
 assert.doesNotMatch(explorer,/grid grid-cols-2 gap-2 sm:grid-cols-4/);
 assert.match(explorer,/id="search-results"/);
});
test("global design remains centralized and app service cards stay functional",()=>{
 assert.match(home,/bg-\[var\(--card\)\]/);
 assert.match(journeys,/bg-\[var\(--card\)\]/);
 assert.match(grid,/mobileServiceHref\(service\)/);
 assert.match(grid,/gth-glass/);
 assert.match(grid,/focus-visible/);
 assert.doesNotMatch(home,/style=\{\{/);
 assert.doesNotMatch(journeys,/linear-gradient|radial-gradient|#(?:[0-9a-fA-F]{3}){1,2}\b/);
});
