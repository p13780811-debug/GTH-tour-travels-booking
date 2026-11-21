import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=p=>readFileSync(resolve(root,p),"utf8");
const cache=new Map();
function load(relative) {
  const filename=resolve(root,relative.startsWith("src/")?relative:"src/"+relative);
  if(!filename.startsWith(root+"/src/"))throw Error("Unexpected source path");
  if(cache.has(filename))return cache.get(filename).exports;
  const output=ts.transpileModule(readFileSync(filename,"utf8"),{
    fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
    reportDiagnostics:true,
  });
  assert.equal((output.diagnostics||[]).filter(d=>d.category===1).length,0);
  const unitModule={exports:{}};cache.set(filename,unitModule);
  const localRequire=specifier=>{
    if(specifier==="server-only")return {};
    if(specifier==="react")return {cache:fn=>fn};
    if(specifier==="@supabase/supabase-js")return {createClient:()=>{throw Error("Network not permitted in tests");}};
    const path=specifier.startsWith("@/")?resolve(root,"src",specifier.slice(2)):
      specifier.startsWith(".")?resolve(dirname(filename),specifier):null;
    if(!path||!path.startsWith(root+"/src/"))throw Error("Unexpected module "+specifier);
    return load(path.slice(root.length+1)+(path.endsWith(".ts")?"":".ts"));
  };
  vm.runInNewContext(output.outputText,{
    module:unitModule,exports:unitModule.exports,require:localRequire,
    URL,URLSearchParams,Date,AbortSignal,process,btoa,atob,Intl,TextEncoder,TextDecoder,
  },{filename,timeout:5000});
  return unitModule.exports;
}

const {VERIFIED_MALDIVES_HOTELS}=load("lib/maldives/verified-hotels.ts");
const {hotelWhiteLabelUrl}=load("lib/travel/hotel-whitelabel.ts");
const {maldivesHotelHandoff}=load("lib/maldives/elite-handoff.ts");
const now=new Date("2026-11-20T00:00:00Z");
const stay={destination:"Maldives",checkin:"2026-12-20",checkout:"2026-12-26",
  adults:"2",children:"5,8",currency:"USD"};
const params=new URLSearchParams(stay);

test("canonical Maldives route and both legacy Google sitelinks remain, preserving query",()=>{
  const page=source("src/app/maldives-elite-escape/page.tsx");
  assert.match(page,/Maldives Elite Escape — Overwater Resorts, Island Stays & Booking \| GTH PRO/);
  assert.match(page,/alternates:\{canonical\}/);
  assert.match(page,/"@type":"TouristDestination"/);
  for(const path of ["src/app/maldives/route.ts","src/app/destinations/maldives/route.ts"]){
    const sourceText=source(path);
    assert.match(sourceText,/\/maldives-elite-escape"\+request\.nextUrl\.search/);
    assert.match(sourceText,/301/);
  }
});

test("simple hero has one wide Maldives image and ORIGINAL booking portal, no new form",()=>{
  const page=source("src/app/maldives-elite-escape/page.tsx");
  const hero=source("src/components/maldives/MaldivesBookingHero.tsx");
  assert.match(page,/<MaldivesBookingHero photo=\{photo\}\/>/);
  assert.match(hero,/src=\{HOTEL_BOOKING_ORIGIN\}/);
  assert.match(hero,/Hotels and Flights tabs/);
  assert.match(hero,/href=\{HOTEL_BOOKING_ORIGIN\}/);
  assert.match(hero,/Open Hotels &amp; Flights booking/);
  assert.match(hero,/src=\{photo\}/);
  assert.match(hero,/sm:h-\[350px\] lg:h-\[440px\]/);
  assert.match(hero,/min-h-11/);
  assert.doesNotMatch(page,/<MaldivesHero|MaldivesExperiences|MaldivesConnectivity|maldives-essentials/);
  assert.doesNotMatch(hero,/<form|input type=|formAction|SearchBar\.create/);
  assert.doesNotMatch(hero,/style=\{|NEXT_PUBLIC_.*KEY|SERVICE_ROLE_KEY/);
});

test("Pexels API uses existing server-only key, Maldives fallback and no duplicate header tabs",()=>{
  const page=source("src/app/maldives-elite-escape/page.tsx");
  const hero=source("src/components/maldives/MaldivesBookingHero.tsx");
  const images=source("src/lib/maldives/pexels-hero.ts");
  assert.match(page,/maldivesPexelsHero\(\)/);
  assert.match(page,/const image=MALDIVES_PEXELS_FALLBACK/);
  assert.match(images,/import "server-only"/);
  assert.match(images,/process\.env\.PEXELS_API_KEY/);
  assert.match(images,/https:\/\/api\.pexels\.com\/v1\/search/);
  assert.match(images,/approvedPexelsIllustrations/);
  assert.match(images,/next:\{revalidate:/);
  assert.match(images,/images\.pexels\.com\/photos\/28843928/);
  assert.doesNotMatch(images,/NEXT_PUBLIC_PEXELS|NEXT_PUBLIC_.*API_KEY/);
  assert.doesNotMatch(page+hero,/images\.unsplash\.com|Unsplash|UnsplashHero/);
  assert.doesNotMatch(hero,/searchTop|className=\{styles\.tabs\}|Original GTH PRO booking portal, including/);
  assert.match(hero,/src=\{HOTEL_BOOKING_ORIGIN\}/);
  assert.match(hero,/Open Hotels &amp; Flights booking/);
});

test("all 12 hotel cards are real verified resorts linked directly without removed search form",()=>{
  const cards=source("src/components/maldives/MaldivesStays.tsx");
  const page=source("src/app/maldives-elite-escape/page.tsx");
  assert.equal(VERIFIED_MALDIVES_HOTELS.length,12);
  assert.equal(new Set(VERIFIED_MALDIVES_HOTELS.map(h=>h.id)).size,12);
  assert.match(page,/<MaldivesStays stay=\{stay\}\/>/);
  assert.match(cards,/hotelWhiteLabelUrl\(\{/);
  assert.match(cards,/href=\{href\}/);
  assert.match(cards,/data-maldives-hotel-id/);
  assert.match(cards,/target="_blank"/);
  assert.doesNotMatch(cards,/formAction|form="maldives-elite-stay-search"|type="submit"/);
  for(const h of VERIFIED_MALDIVES_HOTELS){
    assert.match(h.id,/^lp[a-f0-9]{4,12}$/i);
    assert.ok(h.photo.startsWith("https://"));
    assert.ok(h.rating>=8&&h.rating<=10);
    const target=new URL(hotelWhiteLabelUrl({
      hotelId:h.id,checkin:stay.checkin,checkout:stay.checkout,
      occupancies:[{adults:2,children:[5,8]}],currency:"USD",
    }));
    assert.equal(target.origin,"https://hotel.gthproglobal.com");
    assert.equal(target.pathname,"/hotels/"+h.id);
    assert.equal(target.searchParams.get("checkin"),"2026-12-20");
    assert.equal(target.searchParams.get("checkout"),"2026-12-26");
    assert.equal(target.searchParams.get("currency"),"USD");
    assert.deepEqual(JSON.parse(atob(target.searchParams.get("occupancies"))),
      [{adults:2,children:[5,8]}]);
  }
});

test("legacy individual hotel route still blocks unknown hotel IDs and bad stay params",()=>{
  assert.equal(maldivesHotelHandoff(params,"lp39ce1",now).status,"supplier_hotel");
  for(const bad of ["../lp39ce1","lp0000","https://evil.invalid"]){
    assert.equal(maldivesHotelHandoff(params,bad,now).status,"invalid");
  }
  const malicious=new URLSearchParams(stay);
  malicious.append("returnTo","https://evil.invalid");
  assert.equal(maldivesHotelHandoff(malicious,"lp39ce1",now).status,"invalid");
});

test("Explore Destinations renders COUNTRY cards with matching first-party country filters",()=>{
  const code=source("src/components/maldives/MaldivesExplore.tsx");
  const geo=source("src/lib/destinations/geography.ts");
  for(const country of ["India","United Arab Emirates","France","Japan","Singapore",
    "Thailand","Indonesia","United Kingdom","United States","Maldives","Sri Lanka","China",
    "Hungary","South Africa","Denmark","Ireland","Switzerland","Vietnam","Finland",
    "South Korea","Taiwan","Netherlands","Spain","Greece","Poland","Canada","Nepal",
    "Malaysia","Philippines","Norway","Portugal","Czechia","Austria","Sweden","Italy"]){
    assert.ok(code.includes('name:"'+country+'"'),country+" missing");
    assert.ok(geo.includes('"'+country+'":')||geo.includes('"'+country+'"'),country+" not a known country");
  }
  assert.match(code,/\/destinations\?country=/);
  assert.match(code,/encodeURIComponent\(item\.name\)/);
  assert.match(code,/href="\/destinations"/);
  assert.match(code,/overflow-x-auto/);
  assert.match(code,/lg:grid-cols-4/);
  assert.equal((code.match(/photo:"\/images\/cities\//g)||[]).length,35);
});

test("Explore Guides consists of REAL country guide cards, not nonexistent slugs",()=>{
  const code=source("src/components/maldives/MaldivesExplore.tsx");
  const {guideCatalog}=load("lib/travel/guideCatalog.ts");
  const countrySlugs=guideCatalog.filter(item=>item.kind==="country").map(item=>item.slug);
  assert.deepEqual([...countrySlugs],["india","france","australia"]);
  assert.match(code,/guideCatalog\.filter\(item=>item\.kind==="country"\)/);
  assert.match(code,/href=\{"\/guides\/"\+encodeURIComponent\(guide\.slug\)\}/);
  assert.match(code,/href="\/guides"/);
});

test("Explore Transport connects to existing transfer hub and no unwanted sections remain",()=>{
  const code=source("src/components/maldives/MaldivesExplore.tsx");
  const page=source("src/app/maldives-elite-escape/page.tsx");
  assert.match(code,/href="\/transfers"/);
  assert.ok(source("src/app/transfers/page.tsx").includes("export default function TransfersPage"));
  assert.match(page,/<MaldivesExplore\/>/);
  assert.doesNotMatch(page,/MaldivesExperiences|MaldivesConnectivity|Sun,Compass|Before you arrive/);
  assert.doesNotMatch(code,/href="\/hotels"/);
});


test("country links preserve exact territory instead of dropping filters outside the first global batch",()=>{
  const code=source("src/app/destinations/page.tsx");
  assert.match(code,/loadDestinations\(countryFilter = ""\)/);
  assert.match(code,/request\.eq\("country", countryFilter\)/);
  assert.match(code,/loadDestinations\(requestedCountry\)/);
  assert.match(code,/const country = requestedCountry/);
  assert.match(code,/match\.country !== requestedCountry/);
  assert.match(code,/Explore \$\{country\} destinations/);
});

test("worldwide destination links carry an exact country identity to prevent duplicate-slug misrouting",()=>{
  const {destinationDetailHref}=load("lib/destinations/detail-link.ts");
  assert.equal(destinationDetailHref({slug:"springfield",country:"United States"}),
    "/destinations/springfield?country=United%20States");
  assert.equal(destinationDetailHref({slug:"springfield",country:"Canada"}),
    "/destinations/springfield?country=Canada");
  assert.equal(destinationDetailHref({slug:"paris",country:null}),"/destinations/paris");
  assert.equal(destinationDetailHref({slug:"../admin",country:"France"}),"/destinations#discover");
  const detail=source("src/app/destinations/[slug]/page.tsx");
  assert.match(detail,/lookup\.eq\("country", countryFilter\)/);
  assert.match(detail,/getDestination\(slug,countryFilter\)/);
  for(const path of ["src/components/destination/DestinationCard.tsx",
    "src/components/destination/DestinationExplorerResults.tsx"]){
    assert.match(source(path),/destinationDetailHref/);
  }
});
