import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("the public flagship remains independent of mobile app Home",()=>{
 const web=read("src/app/page.tsx");
 assert.match(web,/return <FlagshipHome \/>/);
 assert.match(web,/canonical: "\/"/);
 const root=read("src/app/layout.tsx");
 assert.match(root,/SiteIdentitySchema/);
});
test("mobile Home, app logo and PWA launch resolve to one preserved dashboard",()=>{
 const page=read("src/app/app/page.tsx");
 const nav=read("src/components/MobileNav.tsx");
 const logo=read("src/components/mobile/MobileAppHeader.tsx");
 const manifest=read("src/app/manifest.ts");
 const legacy=read("src/app/app/ecosystem/page.tsx");
 assert.match(page,/<EcosystemHeroCarousel embedded\/>/);
 assert.match(page,/<MobileAppDashboard data=\{data\}\/>/);
 assert.match(nav,/href: "\/", appHref: "\/app", name: "Home"/);
 assert.match(logo,/href="\/app" aria-label="GTH PRO Home"/);
 assert.match(manifest,/start_url: "\/app"/);
 assert.match(legacy,/redirect\("\/app"\)/);
 // Website Home stays \"/\" and the PWA Home stays \"/app\"; ecosystem remains a separate website destination.
 assert.match(read("src/components/home/FlagshipHome.tsx"),/href="\/mega-aggregator"/);
 assert.doesNotMatch(legacy,/MegaAggregator|loadMobileDiscovery|fetch\(/);
});
test("the mobile UI reuses the approved photography without new APIs or CSS themes",()=>{
 const hero=read("src/app/mega-aggregator/EcosystemHeroCarousel.tsx");
 const app=read("src/app/app/page.tsx");
 const dashboard=read("src/components/mobile/MobileAppDashboard.tsx");
 assert.match(hero,/embedded=false/);
 assert.match(hero,/Featured ecosystem journeys/);
 assert.match(hero,/\/images\/mega\/hotels\.jpg/);
 assert.match(dashboard,/<AppJourneyCards \/>/);
 assert.match(dashboard,/<AppResearchQuickAccess \/>/);
 assert.match(dashboard,/<AppInstall \/>/);
 assert.match(dashboard,/tickets/);
 for(const source of [hero,app])assert.doesNotMatch(source,/SERVICE_ROLE_KEY|fetch\(|createClient\(|NEXT_PUBLIC_.*SECRET/);
});
