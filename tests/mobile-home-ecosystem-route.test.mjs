import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("mobile website Home and PWA Home point to their own canonical landing pages",()=>{
 const nav=read("src/components/MobileNav.tsx");
 assert.match(nav,/href: "\/", appHref: "\/app", name: "Home"/);
 for(const pair of [
  'href: "/flights", appHref: "/app/flights"',
  'href: "/hotels", appHref: "/app/hotels"',
  'href: "/real-estate", appHref: "/app/property"',
  'href: "/tender", appHref: "/app/tenders"',
 ])assert.ok(nav.includes(pair),pair);
 assert.match(nav,/const target = isApp \? appHref : href/);
 assert.match(nav,/prefetch=\{name==="Home"\?false:undefined\}/);
 assert.match(nav,/pathname\.startsWith\(appHref \+ "\/"\)/);
 assert.match(nav,/env\(safe-area-inset-bottom/);
});

test("PWA launches the ecosystem-and-dashboard unified Home without provider duplication",()=>{
 const page=read("src/app/app/page.tsx");
 const alias=read("src/app/app/ecosystem/page.tsx");
 const approved=read("src/app/mega-aggregator/page.tsx");
 const manifest=read("src/app/manifest.ts");
 assert.match(page,/<EcosystemHeroCarousel embedded\/>/);
 assert.match(page,/<MobileAppDashboard data=\{data\}\/>/);
 assert.match(alias,/redirect\("\/app"\)/);
 assert.match(alias,/robots:\{index:false,follow:false\}/);
 assert.match(manifest,/scope: "\/app"/);
 assert.match(manifest,/start_url: "\/app"/);
 assert.match(approved,/<EcosystemUnifiedSearch \/>/);
 assert.match(approved,/<EcosystemHub \/>/);
 assert.doesNotMatch(alias,/fetch\(|createClient|API_KEY|SERVICE_ROLE|process\.env/);
 assert.doesNotMatch(page,/createClient|SUPABASE_SERVICE_ROLE_KEY/);
 assert.equal(existsSync(new URL("../src/app/app/page.tsx",import.meta.url)),true);
});

test("website flagship keeps its own canonical page and separate Ecosystem link",()=>{
 const website=read("src/app/page.tsx");
 assert.match(website,/return <FlagshipHome \/>/);
 assert.match(website,/alternates:\s*\{\s*canonical:\s*"\/"\s*\}/);
 assert.match(read("src/components/home/FlagshipHome.tsx"),/href="\/mega-aggregator"/);
 const nav=read("src/components/MobileNav.tsx");
 assert.match(nav,/href: "\/", appHref: "\/app", name: "Home"/);
 const wrapper=read("src/components/LayoutWrapper.tsx");
 assert.match(wrapper,/!isRealEstate && !isFlagship && <MobileNav \/>/);
});
