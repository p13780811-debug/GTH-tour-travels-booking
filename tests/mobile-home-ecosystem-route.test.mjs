import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("mobile bottom Home opens the approved Ecosystem instead of old app dashboard",()=>{
 const nav=read("src/components/MobileNav.tsx");
 assert.match(nav,/href: "\/mega-aggregator", appHref: "\/app\/ecosystem", name: "Home"/);
 assert.doesNotMatch(nav,/href: "\/app", appHref: "\/app", name: "Home"/);
 for(const pair of [
  'href: "/flights", appHref: "/app/flights"',
  'href: "/hotels", appHref: "/app/hotels"',
  'href: "/real-estate", appHref: "/app/property"',
  'href: "/tender", appHref: "/app/tenders"',
 ])assert.ok(nav.includes(pair),pair);
 assert.match(nav,/const target = isApp \? appHref : href/);
 assert.match(nav,/pathname\.startsWith\(appHref \+ "\/"\)/);
 assert.match(nav,/env\(safe-area-inset-bottom/);
});

test("PWA Home stays inside /app scope, rendering same Ecosystem without a duplicate booking engine",()=>{
 const page=read("src/app/app/ecosystem/page.tsx");
 const approved=read("src/app/mega-aggregator/page.tsx");
 const manifest=read("src/app/manifest.ts");
 assert.match(page,/import MegaAggregator from "@\/app\/mega-aggregator\/page"/);
 assert.match(page,/return <MegaAggregator\/>/);
 assert.match(page,/robots:\{index:false,follow:false\}/);
 assert.match(manifest,/scope: "\/app"/);
 assert.match(manifest,/start_url: "\/app"/);
 assert.match(approved,/<EcosystemUnifiedSearch \/>/);
 assert.match(approved,/<EcosystemHub \/>/);
 assert.doesNotMatch(page,/fetch\(|createClient|API_KEY|SERVICE_ROLE|process\.env/);
 assert.equal(existsSync(new URL("../src/app/app/page.tsx",import.meta.url)),true);
});

test("website flagship homepage remains completely separate from mobile Home",()=>{
 const website=read("src/app/page.tsx");
 assert.match(website,/return <FlagshipHome \/>/);
 assert.match(website,/alternates: \{canonical: "\/"\}/);
 const nav=read("src/components/MobileNav.tsx");
 assert.doesNotMatch(nav,/name: "Home"[^\n]+matches: \[[^\]]*"\/"/);
 const wrapper=read("src/components/LayoutWrapper.tsx");
 assert.match(wrapper,/!isRealEstate && !isFlagship && <MobileNav \/>/);
});
