import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const root=new URL("../",import.meta.url);
const load=p=>readFileSync(new URL(p,root),"utf8");
const mega=load("src/app/mega-aggregator/page.tsx");
const homepage=load("src/app/page.tsx");
const hero=load("src/components/HeroSlider.tsx");
const nav=load("src/components/Navbar.tsx");
const mobile=load("src/components/MobileNav.tsx");
const pillars=load("src/components/sections/EcosystemPillars.tsx");
const footer=load("src/components/sections/EcosystemFooter.tsx");
const tender=load("src/app/tender/page.tsx");

test("ecosystem homepage retains the exact hero slider component and introduces 3 pillars",()=>{
  assert.match(mega, /<HeroSlider \/>/);
  assert.match(mega, /<EcosystemPillars \/>/);
  assert.doesNotMatch(mega, /<EcosystemFooter \/>/);
  assert.match(mega, /canonical: "\/"/);
  for(const name of ["Tours & Travels","Real Estate","Tenders"])assert.ok(pillars.includes(name));
  assert.doesNotMatch(mega, /href="\/(partners|studios|about|careers|cookies|security)"/);
  assert.doesNotMatch(mega, /Exclusive Mega Deals/);
});

test("all internal three-pillar entry points lead to existing routes",()=>{
 const sources=[mega,hero,nav,mobile,pillars,footer,tender];
 const links=[];
 for(const s of sources){
   for(const m of s.matchAll(/(?:href:|href=)\s*["'](\/[^"'?#]*)/g)){
     links.push(m[1]);
   }
 }
 for(const href of new Set(links)){
   const page="src/app"+(href==="/"?"/page.tsx":href+"/page.tsx");
   const parts=href.split("/").filter(Boolean);
   const dynamicRoute="src/app/"+parts.map((part,i)=>i===parts.length-1?"[slug]":part).join("/")+"/page.tsx";
   assert.equal(existsSync(new URL(page,root)) || existsSync(new URL(dynamicRoute,root)),true,href+" must point to a real route");
 }
 assert.match(footer,/heading: "Tenders & Intelligence"/);
 assert.match(nav,/href: "\/"/);
 assert.match(hero,/href: "\/train"/);
 assert.match(hero,/href: "\/ai-trip"/);
 assert.doesNotMatch(hero,/href: "\/rail"/);
 assert.doesNotMatch(hero,/href: "\/ai-trips"/);
});

test("approved Real Estate route and slider design remain independent",()=>{
 const source=load("src/components/LayoutWrapper.tsx");
 assert.match(source,/<EcosystemFooter \/>/);
 assert.doesNotMatch(source, /pathname !== "\/mega-aggregator"/);
 assert.match(source,/const isRealEstate = pathname\?\.startsWith\("\/real-estate"\)/);
 assert.match(nav,/EstateHeader/);
 assert.match(tender,/searchPublicTenders/);
 assert.match(tender,/No published tenders match your search/);
 assert.match(tender,/Official procurement source|official procurement source/i);
});

test("root renders approved mega-aggregator instead of retired V13 homepage",()=>{
  assert.match(homepage,/import MegaAggregator, \\{ metadata as megaMetadata \\} from "\\.\\/mega-aggregator\\/page"/);
  assert.match(homepage,/return <MegaAggregator \\/>/);
  assert.match(homepage,/canonical: "\\/"/);
  assert.doesNotMatch(homepage,/GTHHomeV13/);
  assert.match(mobile,/href="\\/"/);
  assert.match(footer,/href="\\/"/);
});
