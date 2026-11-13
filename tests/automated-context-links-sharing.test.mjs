import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("sharing is user-triggered, URL-encoded and restricted to the site's own records",()=>{
  const source=read("src/components/engagement/ShareFeedbackActions.tsx");
  assert.match(source,/"use client"/);
  assert.match(source,/function share\(\)/);
  assert.match(source,/onClick=\{share\}/);
  assert.match(source,/path\.startsWith\("\/"\)/);
  assert.match(source,/path\.startsWith\("\/\/"\)/);
  assert.match(source,/destination\.origin!==window\.location\.origin/);
  assert.match(source,/encodeURIComponent\(text\)/);
  assert.match(source,/https:\/\/wa\.me\/\?text=/);
  assert.match(source,/noopener,noreferrer/);
  assert.match(source,/href="\/contact"/);
  assert.match(source,/Nothing is sent automatically/);
  assert.doesNotMatch(source,/fetch\(|supabase|service_role|NEXT_PUBLIC_.*KEY/i);
});

test("property, tender and both stadium event card types have same share/feedback control",()=>{
  const cases=[
    ["src/components/real-estate/PropertyCardPro.tsx",/ShareFeedbackActions title=.* path=\{detailUrl\}/],
    ["src/components/tender/TenderMarketplacePanels.tsx",/ShareFeedbackActions title=\{tender\.title\} path=/],
    ["src/app/stadiums/StadiumEventDiscovery.tsx",/ShareFeedbackActions title=\{e\.title\} path=/],
    ["src/app/stadiums/StadiumUpcomingEvents.tsx",/ShareFeedbackActions title=\{event\.label\} path=/],
  ];
  for(const [path,pattern] of cases){
    const source=read(path);
    assert.match(source,/import ShareFeedbackActions from "@\/components\/engagement\/ShareFeedbackActions"/,path);
    assert.match(source,pattern,path);
  }
});

test("airport city routes use existing supplier/discovery pages and never fabricate availability",()=>{
  const source=read("src/app/travel/airports/[iata]/page.tsx");
  assert.match(source,/new URLSearchParams\(\{view:"booking",city:airport\.city,country:airport\.countryCode\}\)/);
  assert.match(source,/new URLSearchParams\(\{city:airport\.city\}\)/);
  assert.match(source,/new URLSearchParams\(\{q:airport\.city\}\)/);
  assert.match(source,/href: hotelHref/);
  assert.match(source,/href: tourHref/);
  assert.match(source,/href: ticketsHref/);
  assert.match(source,/not guaranteed live events or seats/);
  const hotels="/hotels?"+new URLSearchParams({view:"booking",city:"London",country:"GB"});
  assert.equal(hotels,"/hotels?view=booking&city=London&country=GB");
  assert.equal("/tours?"+new URLSearchParams({city:"Kolkata"}),"/tours?city=Kolkata");
  assert.equal("/tickets?"+new URLSearchParams({q:"London"}),"/tickets?q=London");
  const tourFilters=read("src/lib/tours/discovery.ts");
  const ticketPage=read("src/app/tickets/page.tsx");
  const hotelsPage=read("src/app/hotels/page.tsx");
  assert.match(tourFilters,/const keys = \["city", "category"/);
  assert.match(ticketPage,/params\.q/);
  assert.match(hotelsPage,/params\.get\("city"\)/);
  assert.match(hotelsPage,/params\.get\("view"\) === "directory"/);
});

test("the original property EMI, coordinate-gated commute and live-source protections remain",()=>{
  const detail=read("src/components/real-estate/PropertyDetailClient.tsx");
  assert.match(detail,/<HomeLoanCalculator \/>/);
  assert.match(detail,/hasCoordinates \? <>/);
  assert.match(detail,/<CommutePlanner/);
  const app=read("src/components/mobile/AppInstall.tsx");
  assert.match(app,/beforeinstallprompt/);
  assert.match(app,/appinstalled/);
  assert.match(app,/Safe install guide/);
  assert.match(app,/Play Protect/);
  assert.match(app,/no APK download/);
  assert.doesNotMatch(app,/https?:\/\/.*\.apk/i);
  assert.match(read("src/components/home/FlagshipHome.tsx"),/href="\/app".*gth-btn-gold/);
});

test("legacy tender release guard remains active only for its own fixed-baseline branch; all new PRs still run full checks",()=>{
  const workflow=read(".github/workflows/gth-tender-portal-upgrade.yml");
  assert.match(workflow,/github\.event_name == 'push' \|\| github\.head_ref == 'feat\/tender-decision-revenue-global-20261109'/);
  assert.match(workflow,/run: node scripts\/check-tender-upgrade-boundaries\.mjs/);
  assert.match(workflow,/npm run test:security/);
  assert.match(workflow,/npx tsc --noEmit/);
  assert.match(workflow,/npm run build/);
  assert.match(workflow,/node scripts\/qa-tender-portal\.mjs/);
});
