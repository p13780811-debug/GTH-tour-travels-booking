import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=read("src/app/mega-aggregator/page.tsx");
const hub=read("src/app/mega-aggregator/EcosystemHub.tsx");
const search=read("src/app/mega-aggregator/EcosystemUnifiedSearch.tsx");
const siteSearch=read("src/app/search/page.tsx");
const config=JSON.parse(read("vercel.json"));

test("Only the ecosystem page gains a working universal search, preserving original hero",()=>{
 assert.match(page,/<HeroSlider \/>/);
 assert.match(page,/<EcosystemUnifiedSearch \/>/);
 assert.match(page,/<EcosystemPillars \/>/);
 assert.match(page,/<EcosystemHub \/>/);
 assert.match(page,/gth-master-hero-shell>div:last-child/);
 assert.match(page,/className="w-full transition-colors duration-300"/);
 assert.doesNotMatch(page,/className="gth-master-home/);
 assert.match(page,/GTHNetwork partners=\{partners\} discoveryOnly/);
});

test("All pillar searches submit to the existing first-party search engine",()=>{
 assert.match(search,/action=\{appHome\?"\/app\/search":"\/search"\} method="get"/);
 assert.match(read("src/app/app/page.tsx"),/<EcosystemUnifiedSearch appHome\/>/);
 assert.match(page,/<EcosystemUnifiedSearch \/>/);
 assert.match(search,/name="q"/);
 assert.match(search,/name="category"/);
 for(const value of ["all","hotel","flight","tour","property","tender","ticket"])assert.ok(search.includes('value:"'+value+'"'));
 assert.match(siteSearch,/redirect\(targetFor\(intent, query\)\)/);
 assert.doesNotMatch(search,/fetch\(|localStorage|API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});

test("No unauthorized provider or invented hotel inventory",()=>{
 assert.doesNotMatch(page,/trip\.com|Trip\.com|HotelQuadSection|goaData|parisData|Digha Elite|Verified Inventory/i);
 assert.doesNotMatch(page,/₹[\d,]+|€\d+|Private Beach Access|Priority Concierge/i);
 assert.match(page,/partner_id=DF3NBKA/);
 assert.match(page,/klook\.tpo\.lv\/IKb6eSUe/);
 assert.doesNotMatch(page,/id="travel-services"|aria-label="Additional travel services"/);
 const hero=read("src/app/mega-aggregator/EcosystemHeroCarousel.tsx");
 assert.match(page,/<EcosystemHeroCarousel \/>/);
 assert.match(hero,/Your world\. One connected gateway\./);
 assert.match(hero,/aspect-\[2\/1\]/);
 assert.match(hero,/onTouchEnd/);
 for(const asset of ["hotels.jpg","flights.jpg","tours.jpg","real-estate.jpg","tender.jpg"])
   assert.ok(hero.includes(asset),"Hero image missing: "+asset);
 assert.match(page,/-mt-10/);
 assert.doesNotMatch(page,/gth-master-intro/);
 assert.doesNotMatch(page,/bg-black|from-black|via-black|bg-gradient|bg-slate/);
 assert.match(page,/id="insights"/);
 assert.match(page,/id="providers"/);
});

test("Service search covers all real pillars without dead routes",()=>{
 assert.match(hub,/value=\{serviceQuery\}/);
 assert.match(hub,/setServiceQuery\(event\.target\.value\)/);
 assert.match(hub,/key: "business"/);
 const chunk=hub.split("const services = [")[1].split("] as const;")[0];
 const routes=[...chunk.matchAll(/href: "(\/[^"]+)"/g)].map(x=>x[1]);
 assert.ok(routes.length>=30);
 assert.equal(new Set(routes).size,routes.length,"No duplicate service routes");
 for(const route of routes){
  const direct=existsSync(new URL("../src/app"+route+"/page.tsx",import.meta.url));
  const category=route.startsWith("/tickets/")&&
   ["sports","concerts","theatre","comedy","festivals","attractions","museums","theme-parks","cinema"].includes(route.slice("/tickets/".length))&&
   existsSync(new URL("../src/app/tickets/[category]/page.tsx",import.meta.url));
  assert.ok(direct||category,route);
 }
});

test("Feature branch is not automatically deployed or merged to live",()=>{
 assert.equal(config.git.deploymentEnabled["feat/mega-aggregator-worldclass-20261107"],false);
});
