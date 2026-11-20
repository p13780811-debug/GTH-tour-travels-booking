import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const cache=new Map();
function load(relative) {
  const filename=resolve(root,relative.startsWith("src/")?relative:"src/"+relative);
  if(!filename.startsWith(root+"/src/"))throw Error("Invalid source import");
  if(cache.has(filename))return cache.get(filename).exports;
  const result=ts.transpileModule(readFileSync(filename,"utf8"),{
    fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
    reportDiagnostics:true,
  });
  assert.equal((result.diagnostics??[]).filter(d=>d.category===1).length,0);
  const testModule={exports:{}};cache.set(filename,testModule);
  const localRequire=specifier=>{
    if(specifier==="server-only")return {};
    if(specifier==="react")return {cache:fn=>fn};
    if(specifier==="@supabase/supabase-js")return {createClient:()=>{throw Error("No API calls in unit test");}};
    const p=specifier.startsWith("@/")?resolve(root,"src",specifier.slice(2)):
      specifier.startsWith(".")?resolve(dirname(filename),specifier):null;
    if(!p||!p.startsWith(root+"/src/"))throw Error("Unexpected import "+specifier);
    return load(p.slice(root.length+1)+(p.endsWith(".ts")?"":".ts"));
  };
  vm.runInNewContext(result.outputText,{
    module:testModule,exports:testModule.exports,require:localRequire,
    URL,URLSearchParams,Date,AbortSignal,process,btoa,atob,Intl,
    TextEncoder,TextDecoder,
  },{filename,timeout:5000});
  return testModule.exports;
}
const {maldivesStayHandoff}=load("lib/maldives/elite-handoff.ts");
const now=new Date("2026-11-20T00:00:00Z");
const form=(changes={})=>new URLSearchParams({
  destination:"Maldives",checkin:"2026-12-20",checkout:"2026-12-26",
  adults:"2",children:"5,8",currency:"USD",...changes,
});
const fixturePlaceId="ChIJabcdefghijklmnopqrstuvwxyz";

test("verified supplier ID results in exact White Label /hotels URL and original guest ages",()=>{
  const r=maldivesStayHandoff(form(),fixturePlaceId,now);
  assert.equal(r.status,"supplier_listing");
  const u=new URL(r.href);
  assert.equal(u.origin,"https://hotel.gthproglobal.com");
  assert.equal(u.pathname,"/hotels");
  assert.equal(u.searchParams.get("placeId"),fixturePlaceId);
  assert.equal(u.searchParams.get("checkin"),"2026-12-20");
  assert.equal(u.searchParams.get("checkout"),"2026-12-26");
  assert.equal(u.searchParams.get("currency"),"USD");
  const occupancies=JSON.parse(atob(u.searchParams.get("occupancies")));
  assert.deepEqual(occupancies,[{adults:2,children:[5,8]}]);
  assert.equal(u.searchParams.has("city"),false);
});

test("no supplier Place ID never causes generic root or wrong Mumbai listing",()=>{
  const r=maldivesStayHandoff(form(),null,now);
  assert.equal(r.status,"destination_picker");
  const u=new URL(r.href,"https://www.gthproglobal.com");
  assert.equal(u.pathname,"/hotels");
  assert.equal(u.searchParams.get("view"),"booking");
  assert.equal(u.searchParams.get("city"),"Maldives");
  assert.equal(u.searchParams.get("country"),"MV");
  assert.equal(u.searchParams.get("checkin"),"2026-12-20");
  assert.equal(u.searchParams.get("checkout"),"2026-12-26");
  assert.equal(u.searchParams.get("children"),"5,8");
  assert.equal(u.searchParams.get("currency"),"USD");
  assert.doesNotMatch(r.href,/mumbai|hotel\.gthproglobal\.com\/?\?/i);
});

test("valid next-day defaults are used when dates untouched",()=>{
  const r=maldivesStayHandoff(new URLSearchParams({destination:"Maldives",adults:"2",currency:"USD"}),null,now);
  assert.equal(r.status,"destination_picker");
  const u=new URL(r.href,"https://www.gthproglobal.com");
  assert.equal(u.searchParams.get("checkin"),"2026-11-21");
  assert.equal(u.searchParams.get("checkout"),"2026-11-22");
});

test("bad dates, ages, currency, tampered destination and open redirect fields fail closed",()=>{
  const vectors=[
    form({checkout:"2026-12-19"}),form({checkin:"2025-11-20"}),
    form({children:"18"}),form({children:"5,,8"}),
    form({adults:"0"}),form({currency:"BTC"}),
    form({destination:"Mumbai"}),form({redirect:"https://evil.invalid"}),
  ];
  const dupe=form();dupe.append("checkout","2026-12-28");vectors.push(dupe);
  for(const input of vectors){
    assert.equal(maldivesStayHandoff(input,null,now).status,"invalid",input.toString());
  }
});

test("all 3 canonical paths exist, aliases preserve query, no root homepage fallback",()=>{
  const elite=readFileSync(resolve(root,"src/app/maldives-elite-escape/page.tsx"),"utf8");
  assert.match(elite,/Maldives Elite Escape — Luxury Overwater Resorts, Flights & Island Tours \| GTH PRO/);
  assert.match(elite,/alternates:\{canonical\}/);
  assert.match(elite,/"@type":"TouristDestination"/);
  assert.match(elite,/JsonLd/);
  for(const p of ["src/app/maldives/route.ts","src/app/destinations/maldives/route.ts"]){
    const s=readFileSync(resolve(root,p),"utf8");
    assert.match(s,/\/maldives-elite-escape"\+request\.nextUrl\.search/);
    assert.match(s,/301/);
    assert.doesNotMatch(s,/destination:"\/"|redirect\(new URL\("\/"/);
  }
});

test("mobile and desktop layout retains 3 unique licensed images and 44px actions",()=>{
  const hero=readFileSync(resolve(root,"src/components/maldives/MaldivesHero.tsx"),"utf8");
  const imageIds=[...hero.matchAll(/photo-\d{10,13}-[a-f0-9]{12}/g)].map(m=>m[0]);
  assert.equal(imageIds.length,3);
  assert.equal(new Set(imageIds).size,3);
  for(const fragment of ["gth-glass-strong","grid-cols-2","lg:grid-cols","-mt-14","touch-auto","min-h-11","min-w-11","overscroll-x-contain","prefers-reduced-motion"]){
    assert.ok(hero.includes(fragment),fragment);
  }
  assert.match(hero,/name="destination" value="Maldives"/);
  assert.match(hero,/name="checkin"/);
  assert.match(hero,/name="checkout"/);
  assert.match(hero,/name="adults"/);
  assert.match(hero,/name="children"/);
  assert.match(hero,/name="currency"/);
  assert.doesNotMatch(hero,/style=\{|#[a-f0-9]{3,8}(?:\b|["'])/i);
});

test("actual supplier cards reused; unavailable hotels/tours never fabricated",()=>{
  const hotels=readFileSync(resolve(root,"src/components/maldives/MaldivesStays.tsx"),"utf8");
  const tours=readFileSync(resolve(root,"src/components/maldives/MaldivesExperiences.tsx"),"utf8");
  const mobility=readFileSync(resolve(root,"src/components/maldives/MaldivesConnectivity.tsx"),"utf8");
  assert.match(hotels,/NuiteeHotelsListWidget/);
  assert.match(hotels,/placeId \?/);
  assert.match(hotels,/form="maldives-elite-stay-search"/);
  assert.match(hotels,/lg:grid-cols-3/);
  assert.doesNotMatch(hotels,/Superb|[1-5]\.\d\s*stars?|₹\s*\d+/i);
  assert.match(tours,/SupplierTourCard/);
  assert.match(tours,/getSupplierCatalog/);
  assert.match(tours,/loadPersistedSupplierProducts/);
  assert.match(tours,/isMaldivesProduct/);
  assert.match(tours,/lg:grid-cols-3/);
  assert.doesNotMatch(tours,/wegotrip\.com\/"\s*|view experience.*wegotrip\.com\/"/i);
  assert.match(mobility,/name="destination" value="MLE"/);
  assert.match(mobility,/name="origin"/);
  assert.match(mobility,/name="departDate"/);
  assert.match(mobility,/\/transfers\?airport=MLE&city=Male/);
  assert.doesNotMatch(mobility,/SUPABASE_SERVICE_ROLE_KEY|NUITEE_API_KEY|NEXT_PUBLIC_.*KEY|style=\{/);
});

test("protected pages and global CSS are not imported for mutation",()=>{
  const page=readFileSync(resolve(root,"src/app/maldives-elite-escape/page.tsx"),"utf8");
  assert.match(page,/pb-\[calc\(110px\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(page,/MaldivesTypography\.module\.css/);
  const font=readFileSync(resolve(root,"src/components/maldives/MaldivesTypography.module.css"),"utf8");
  assert.match(font,/font-family: "Cinzel", var\(--font-heading\)/);
  assert.doesNotMatch(page,/globals\.css|FlagshipHome|RealEstate|TenderBidGenerator/);
});
