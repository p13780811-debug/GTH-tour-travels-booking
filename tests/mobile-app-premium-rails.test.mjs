import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const f=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Mobile home is source-backed and hero is compact, without 3 giant vertical pillars",()=>{
 const page=f("src/app/app/page.tsx");
 assert.match(page,/loadMobileDiscovery\(\)/);
 assert.match(page,/MobileDiscoveryRail kind="destination"/);
 assert.match(page,/MobileDiscoveryRail kind="hotel"/);
 assert.match(page,/MobileDiscoveryRail kind="property"/);
 assert.match(page,/MobileDiscoveryRail kind="tender"/);
 assert.match(page,/MobileAppHeader/);
 assert.match(readFileSync(new URL("../src/components/mobile/MobileAppHeader.tsx",import.meta.url),"utf8"),/\/images\/gth-logo\.png/);
 assert.match(page,/Discover more\. Scroll less\./);
 assert.doesNotMatch(page,/One app\. Three worlds\./);
 assert.doesNotMatch(page,/h-44 overflow-hidden sm:h-52/);
});
test("All app card categories use same compact size and functional horizontal navigation",()=>{
 const rail=f("src/components/mobile/MobileDiscoveryRail.tsx");
 assert.match(rail,/w-\[44vw\]/);
 assert.match(rail,/h-\[112px\]/);
 assert.match(rail,/snap-x snap-mandatory/);
 assert.match(rail,/overflow-x-auto/);
 assert.match(rail,/touch/);
 assert.match(rail,/View all/);
 assert.match(rail,/scrollBy/);
 assert.match(rail,/aria-label/);
 assert.match(rail,/No licensed photo/);
});
test("Mobile PWA icon derives from actual GTH PRO shield, not platform placeholder",()=>{
 const manifest=f("src/app/manifest.ts");
 const svg=f("public/gth-app-brand.svg");
 assert.match(manifest,/\/gth-app-brand\.svg/);
 assert.match(manifest,/start_url: "\/app"/);
 assert.match(svg,/M50 10 L85 30 V70 L50 90 L15 70 V30 Z/);
 assert.match(svg,/>GTH<\/text>/);
 assert.match(svg,/>PRO<\/text>/);
});
test("No fake hotels, real estate images or tender images get filled with stock photography",()=>{
 const source=f("src/lib/mobile/discovery.ts");
 assert.match(source,/\.from\("hotel_catalog"\)/);
 assert.match(source,/\.from\("properties"\)/);
 assert.match(source,/\.from\("tenders"\)/);
 assert.match(source,/\.eq\("source_verified",true\)/);
 assert.match(source,/\.eq\("is_public",true\)/);
 assert.match(source,/sourceId\.replace\("\/","-"\)/);
 assert.match(source,/image:null/);
 assert.doesNotMatch(source,/service_role|SUPABASE_SERVICE_ROLE_KEY|faker|Math\.random/);
});
test("Destination list is a mobile horizontal rail while preserving its desktop responsive grid",()=>{
 const page=f("src/app/destinations/page.tsx");
 assert.match(page,/snap-x snap-mandatory/);
 assert.match(page,/w-\[44vw\]/);
 assert.match(page,/md:grid md:grid-cols-2/);
 assert.match(page,/md:overflow-visible/);
 assert.match(page,/h-\[112px\].*md:h-\[230px\]/);
 assert.match(page,/hidden h-\[250px\] grid-cols-2/);
});
test("App navigation still provides direct real product flows and safe-area bottom inset",()=>{
 const nav=f("src/components/MobileNav.tsx");
 for(const link of ["/app","/flights","/hotels","/real-estate","/tender"])assert.ok(nav.includes('href: "'+link+'"'));
 assert.match(nav,/env\(safe-area-inset-bottom/);
 const home=f("src/app/app/page.tsx");
 assert.match(home,/env\(safe-area-inset-bottom\)/);
});
