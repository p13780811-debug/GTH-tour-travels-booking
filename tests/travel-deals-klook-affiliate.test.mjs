import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const read=path=>fs.readFileSync(path,"utf8");
const dealSource=read("src/lib/travel/approved-klook-promos.ts");
const transpiled=ts.transpileModule(dealSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const sandbox={exports:{},URL,Date,Number};vm.runInNewContext(transpiled,sandbox,{timeout:1200});
const lib=sandbox.exports;

test("tracked Klook deal link uses exact known campaign and verified fixed official deals destination",()=>{
 const destination=new URL(lib.buildTrackedKlookDealsHref());
 assert.equal(destination.origin,"https://tp.media");
 for(const [key,value] of Object.entries({campaign_id:"137",marker:"417668",p:"4110",trs:"504342",sub_id:"gth_klook_deals"}))
  assert.equal(destination.searchParams.get(key),value);
 const supplier=new URL(destination.searchParams.get("u"));
 assert.equal(supplier.origin,"https://www.klook.com");
 assert.equal(supplier.pathname,"/deals/");
 assert.equal(supplier.search,"");
});
test("no fabricated or unauthorised promo codes and expired records cannot publish",()=>{
 assert.deepEqual(Array.from(lib.activeApprovedKlookPromos()),[]);
 assert.ok(dealSource.includes('issuedThrough === "travelpayouts"'));
 assert.ok(dealSource.includes('Date.parse(promo.expiresAtUtc) > now'));
 assert.ok(dealSource.includes('readonly ApprovedKlookPromo[] = []'));
});
test("provider handoff is a fixed-route no-open-redirect with tracking response hygiene",()=>{
 const route=read("src/app/api/travel/klook-deals/route.ts");
 assert.ok(route.includes("buildTrackedKlookDealsHref()"));
 assert.ok(route.includes('if(url.search || url.hash)'));
 assert.ok(route.includes('Cache-Control","no-store'));
 assert.ok(route.includes('noindex, nofollow'));
 assert.ok(!route.includes("searchParams.get"));
});
test("customer navigation and mobile promos can reach deals without new third-party scripts",()=>{
 const nav=read("src/components/travel/TravelSectionNav.tsx");
 const travel=read("src/app/travel/page.tsx");
 const mobile=read("src/lib/mobile/app-dashboard.ts");
 const tours=read("src/components/tours/TourLanding.tsx");
 const screen=read("src/components/travel/DealsDiscovery.tsx");
 assert.ok(nav.includes('href:"/travel/deals"'));
 assert.ok(travel.includes('href: "/travel/deals"'));
 assert.ok(mobile.includes('href:"/travel/deals"'));
 assert.ok(tours.includes('href="/travel/deals"'));
 assert.ok(screen.includes('partnerSearchHref(item.kind,item.city,item.category)'));
 assert.ok(screen.includes('aria-pressed={region===item.code}'));
 assert.ok(screen.includes('rel="sponsored nofollow noopener noreferrer"'));
 assert.ok(!screen.includes("<Script"));
 assert.ok(!screen.includes("dangerouslySetInnerHTML"));
 assert.ok(!screen.includes("5% off"));
});
