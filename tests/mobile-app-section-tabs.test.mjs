import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const f=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("App bottom tabs stay in app including internal details",()=>{
 const nav=f("src/components/MobileNav.tsx");
 for(const route of ["/app","/app/flights","/app/hotels","/app/property","/app/tenders"])
  assert.ok(nav.includes('appHref: "'+route+'"'),"Missing "+route);
 assert.match(nav,/const target = isApp \? appHref : href/);
 assert.match(nav,/pathname\.startsWith\(appHref \+ "\/"\)/);
});
test("Website routes remain unchanged outside app context",()=>{
 const nav=f("src/components/MobileNav.tsx");
 for(const route of ["/flights","/hotels","/real-estate","/tender"])
  assert.ok(nav.includes('href: "'+route+'"'),"Missing website "+route);
 assert.match(nav,/const isApp = pathname === "\/app" \|\| pathname\.startsWith\("\/app\/"\)/);
});
test("App-only routes hide website navbar and chatbot/footer, retain GTH theme",()=>{
 const wrapper=f("src/components/LayoutWrapper.tsx"),navbar=f("src/components/Navbar.tsx");
 assert.match(wrapper,/!isRealEstate && !isFlagship && !isAppHome/);
 assert.match(navbar,/pathname\?\.startsWith\("\/app\/"\)/);
 const style=f("src/app/globals.css");
 assert.match(style,/\.gth-btn-gold/);
});
test("All five app sections use real source-backed filters, horizontal cards and paging",()=>{
 const page=f("src/app/app/[section]/page.tsx");
 const details=f("src/app/app/[section]/[id]/page.tsx");
 assert.match(page,/listAppRecords\(section,q\)/);
 assert.match(page,/MobileDiscoveryRail appLinks/);
 assert.match(page,/appQueryHref\(section,q/);
 assert.match(page,/MobileFlightSearch/);
 assert.match(page,/robots:\{index:false,follow:false\}/);
 assert.match(details,/loadAppDetail\(section,id\)/);
 assert.match(details,/MobileAppHeader/);
 assert.doesNotMatch(page,/service_role|SUPABASE_SERVICE_ROLE_KEY|Math\.random/);
});
test("GTH brand is visible in both home and detail mastheads",()=>{
 const header=f("src/components/mobile/MobileAppHeader.tsx");
 assert.match(f("src/app/app/page.tsx"),/MobileAppHeader/);
 assert.match(header,/\/gth-app-brand\.svg/);
 assert.match(header,/href="\/app"/);
});
