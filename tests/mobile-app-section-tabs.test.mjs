import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const f=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Each installed app bottom tab routes to a compact internal rail page",()=>{
 const nav=f("src/components/MobileNav.tsx");
 for(const tab of ["/app","/app/flights","/app/hotels","/app/property","/app/tenders"]){
  assert.ok(nav.includes('appHref: "'+tab+'"'),"Missing app tab "+tab);
 }
 assert.match(nav,/const target = isApp \? appHref : href/);
 assert.match(nav,/href=\{target\}/);
 assert.match(nav,/isApp \? pathname === appHref/);
});
test("Standard site tab links are not replaced when outside /app",()=>{
 const nav=f("src/components/MobileNav.tsx");
 for(const route of ["/flights","/hotels","/real-estate","/tender"])
  assert.ok(nav.includes('href: "'+route+'"'),"Missing original site route "+route);
 assert.match(nav,/const isApp = pathname === "\/app" \|\| pathname.startsWith\("\/app\/"\)/);
});
test("Internal tabs skip duplicate large website navbar, chatbot, and footer",()=>{
 const wrapper=f("src/components/LayoutWrapper.tsx");
 const navbar=f("src/components/Navbar.tsx");
 assert.match(wrapper,/isAppHome = pathname === "\/app" \|\| Boolean\(pathname\?\.startsWith\("\/app\/"\)\)/);
 assert.match(wrapper,/!isRealEstate && !isFlagship && !isAppHome/);
 assert.match(navbar,/pathname\?\.startsWith\("\/app\/"\)/);
 assert.match(navbar,/<EstateHeader \/>/);
});
test("Every app section offers short hero, source-backed rail and full marketplace handoff",()=>{
 const tabs=f("src/app/app/[section]/page.tsx");
 assert.match(tabs,/loadMobileDiscovery\(\)/);
 assert.match(tabs,/MobileDiscoveryRail heading=\{current.railTitle\}/);
 assert.match(tabs,/href=\{current.full\}/);
 assert.match(tabs,/MobileAppHeader/);
 assert.match(tabs,/robots:\{index:false,follow:false\}/);
 for(const target of ["/flights","/hotels","/real-estate","/tender"]) assert.ok(tabs.includes('full:"'+target+'"'));
 assert.doesNotMatch(tabs,/service_role|SUPABASE_SERVICE_ROLE_KEY|Math\.random/);
});
test("Both main hub and compact tabs share official GTH PRO branded header",()=>{
 const app=f("src/app/app/page.tsx");
 const header=f("src/components/mobile/MobileAppHeader.tsx");
 assert.match(app,/MobileAppHeader/);
 assert.match(header,/\/images\/gth-logo\.png/);
 assert.match(header,/href="\/app"/);
});
