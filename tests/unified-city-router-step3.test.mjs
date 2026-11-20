import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = new Map();
function load(path) {
  const filename = resolve(root, path.startsWith("src/") ? path : "src/" + path);
  if (!filename.startsWith(root + "/src/")) throw new Error("Untrusted test import");
  if (cache.has(filename)) return cache.get(filename).exports;
  const result = ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal((result.diagnostics ?? []).filter(d=>d.category===1).length, 0);
  const testModule = { exports:{} };
  cache.set(filename, testModule);
  const localRequire = input => {
    if (input === "server-only") return {};
    const next = input.startsWith("@/") ? resolve(root, "src", input.slice(2)) :
      input.startsWith(".") ? resolve(dirname(filename), input) : null;
    if (!next || !next.startsWith(root + "/src/")) throw new Error("Unexpected import: "+input);
    return load(next.slice(root.length+1)+".ts");
  };
  vm.runInNewContext(result.outputText, {
    module:testModule,exports:testModule.exports,require:localRequire,
    URL,URLSearchParams,Date,AbortSignal,Headers,process,btoa,atob,Intl,
    decodeURIComponent,encodeURIComponent,
  }, {filename,timeout:4000});
  return testModule.exports;
}

const context = load("lib/router/cityContext.ts");
const router = load("lib/router/affiliateRouter.ts");
const spine = load("lib/router/citySpine.ts");
const lookup = load("lib/router/worldCitySearch.ts");
const now = new Date("2026-11-20T00:00:00Z");

const NINE = [
  ["Mumbai", "mumbai-in", "India", "IN"],
  ["Kolkata", "kolkata-in", "India", "IN"],
  ["Goa", "goa", "India", null],
  ["Dubai", "dubai-ae", "United Arab Emirates", "AE"],
  ["London", "london-gb", "United Kingdom", "GB"],
  ["Paris", "paris-fr", "France", "FR"],
  ["Singapore", "singapore-sg", "Singapore", "SG"],
  ["Tokyo", "tokyo-jp", "Japan", "JP"],
  ["Bangkok", "bangkok-th", "Thailand", "TH"],
];

function cityDatabase(row) {
  const actions=[];
  const query={
    select(fields){actions.push(["select",fields]);return this;},
    eq(k,v){actions.push(["eq",k,v]);return this;},
    limit(n){actions.push(["limit",n]);return this;},
    abortSignal(){return this;},
    async maybeSingle(){return{data:row,error:null};},
  };
  return {actions,from(table){actions.push(["from",table]);return query;}};
}
async function trustedCity(name, slug, country, code, index) {
  const id="c132b181-79b6-42ba-bc47-"+String(index).padStart(12,"0");
  const response=await context.resolveCityContext(cityDatabase({
    id,name,slug,country,country_code:code,nuitee_place_id:null,is_active:true,
  }), {slug});
  assert.equal(response.status,"found");
  return response.city;
}
const cities=new Map();
for(let i=0;i<NINE.length;i++){
  const [name,slug,country,code]=NINE[i];
  cities.set(name,await trustedCity(name,slug,country,code,i+1));
}
async function withFlag(value,run) {
  const old=process.env.ENABLE_UNIFIED_CITY_ROUTER;
  try { process.env.ENABLE_UNIFIED_CITY_ROUTER=value;return await run();}
  finally {if(old===undefined)delete process.env.ENABLE_UNIFIED_CITY_ROUTER;else process.env.ENABLE_UNIFIED_CITY_ROUTER=old;}
}

test("Step 3 stays fully inactive with the default disabled flag",async()=>{
  await withFlag("false",()=>{
    for(const [name] of NINE){
      const city=cities.get(name);
      assert.equal(router.resolveFlightCompetition({city}).length,0);
      assert.equal(router.resolveAffiliateRoute({city,service:"hotels"}).capability,"unavailable");
    }
  });
  const env=readFileSync(resolve(root,".env.example"),"utf8");
  assert.match(env,/^ENABLE_UNIFIED_CITY_ROUTER=false$/m);
});

test("Nine-city full four-pillar route matrix rejects invented city claims",async()=>{
  await withFlag("true",()=>{
    for(const [name,,country,code] of NINE){
      const city=cities.get(name), links=spine.buildCitySpineLinks(city,now);
      assert.equal(links.cityId,city.id,name);
      assert.equal(links.tenders.scope,code?"country":"global",name);
      assert.equal(links.realEstate.scope,code?"city_filter":"global",name);
      const tender=new URL(links.tenders.href,"https://gthproglobal.com");
      assert.equal(tender.pathname,"/tender");
      assert.equal(tender.searchParams.get("scope"),"world");
      assert.equal(tender.searchParams.get("country"),code,name);
      const prop=new URL(links.realEstate.href,"https://gthproglobal.com");
      assert.equal(prop.pathname,"/real-estate");
      assert.equal(prop.searchParams.get("city"),code?name:null);
      assert.equal(prop.searchParams.get("country"),code?country:null);
      const flights=router.resolveFlightCompetition({city},now);
      assert.equal(flights.length,3,name);
      assert.equal(flights[0].provider,"aviasales");
      assert.equal(flights[1].provider,"12go");
      assert.equal(flights[2].provider,"nuitee");
      assert.equal(flights[2].capability,"unavailable");
      assert.equal(flights[2].href,null);
      assert.equal(flights[0].capability,"internal_discovery");
      assert.equal(flights[1].capability,"internal_discovery");
      const ticket=router.resolveAffiliateRoute({city,service:"tickets"});
      assert.equal(ticket.capability,"internal_discovery");
      const train=router.resolveAffiliateRoute({city,service:"train"});
      assert.equal(train.capability,"internal_discovery");
    }
  });
});

test("Exact stadium mapping requires country AND host city",()=>{
  const hits={
    Mumbai:"wankhede-stadium",Kolkata:"eden-gardens",
    London:"wembley-stadium",Singapore:"singapore-national-stadium",
    Tokyo:"tokyo-dome",
  };
  for(const [name,slug] of Object.entries(hits)){
    const linked=spine.buildCitySpineLinks(cities.get(name),now);
    assert.ok(linked.venues.some(v=>v.slug===slug),name);
    assert.ok(linked.venues.every(v=>v.href.startsWith("/stadiums/")));
  }
  const londonCanada={
    ...cities.get("London"),country_code:"CA",country:"Canada",
  };
  assert.equal(spine.buildCitySpineLinks(londonCanada,now),null,
    "Forged country code cannot inherit a UK stadium.");
  assert.equal(spine.buildCitySpineLinks(cities.get("Goa"),now).venues.length,0);
  assert.equal(spine.buildCitySpineLinks(cities.get("Paris"),now).venues.length,0);
});

test("MahaRERA registry is shown only for supported Indian markets",()=>{
  const mumbai=spine.buildCitySpineLinks(cities.get("Mumbai"),now);
  assert.equal(new URL(mumbai.realEstate.registryHref,"https://gthproglobal.com")
    .searchParams.get("q"),"Mumbai");
  for(const name of ["London","Paris","Dubai","Goa","Tokyo","Bangkok"]){
    assert.equal(spine.buildCitySpineLinks(cities.get(name),now).realEstate.registryHref,null,name);
  }
  const london=spine.buildCitySpineLinks(cities.get("London"),now);
  assert.equal(london.venues.some(v=>v.slug==="silverstone"),false,
    "Visitor flightCity must never imply a London venue.");
});

test("12Go verified flight handoff reuses existing supplier search route",async()=>{
  await withFlag("true",()=>{
    const city=cities.get("Mumbai");
    const search=router.resolveFlightCompetition({
      city,
      flightRoute:{
        originIata:"DEL",destinationIata:"BOM",
        departDate:"2026-12-12",
      },
      travelParams:{adults:"2"},
    },now);
    const provider=search.find(item=>item.provider==="12go");
    assert.equal(provider.capability,"supplier_search");
    const url=new URL(provider.href,"https://gthproglobal.com");
    assert.equal(url.pathname,"/go/transport/search");
    assert.equal(url.searchParams.get("mode"),"flight");
    assert.equal(url.searchParams.get("from"),"Delhi");
    assert.equal(url.searchParams.get("to"),"Mumbai");
    assert.equal(url.searchParams.get("people"),"2");
    assert.equal(url.searchParams.get("date"),"2026-12-12");
    assert.equal(provider.searchIntentForwarded,true);
    assert.equal(search.find(item=>item.provider==="nuitee").href,null);
  });
});

test("Flight routes mismatching country or invalid dates remain non-bookable",async()=>{
  await withFlag("true",()=>{
    const intent={originIata:"DEL",destinationIata:"BOM",departDate:"2026-12-12"};
    const wrong=router.resolveFlightCompetition({
      city:cities.get("London"),flightRoute:intent,
    },now);
    assert.equal(wrong.find(item=>item.provider==="12go").capability,"internal_discovery");
    assert.equal(wrong.find(item=>item.provider==="12go").href,"/go/transport");
    const past=router.resolveFlightCompetition({
      city:cities.get("Mumbai"),flightRoute:{...intent,departDate:"2025-01-01"},
    },now);
    assert.equal(past.find(item=>item.provider==="12go").capability,"unavailable");
    assert.equal(past.find(item=>item.provider==="12go").href,null);
    assert.equal(router.resolveFlightCompetition({
      city:cities.get("Mumbai"),travelParams:{returnUrl:"https://evil.test"},
    },now).length,0);
    assert.equal(router.resolveFlightCompetition({
      city:{...cities.get("Mumbai")},
    },now).length,0);
  });
});

test("Country-only tender results do not inherit invented city filters",()=>{
  const goa=spine.buildCitySpineLinks(cities.get("Goa"),now);
  assert.equal(goa.realEstate.href,"/real-estate");
  assert.equal(goa.tenders.href,"/tender?scope=world");
  for(const [name] of NINE){
    const tender=spine.buildCitySpineLinks(cities.get(name),now).tenders.href;
    assert.ok(!tender.includes("&city="));
    assert.ok(!tender.includes("q="));
  }
});

test("Bounded city search validates inputs and never performs writes",async()=>{
  const rows=[
    {name:"Paris",slug:"paris-fr",country:"France",country_code:"FR"},
    {name:"Paris",slug:"paris-us",country:"United States",country_code:"US"},
  ];
  const calls=[];
  const query={
    select(){return this;},eq(){return this;},ilike(key,v){calls.push(["ilike",key,v]);return this;},
    order(){return this;},limit(v){calls.push(["limit",v]);return this;},
    abortSignal(){return this;},
    then(resolve,reject){return Promise.resolve({data:rows,error:null}).then(resolve,reject);},
  };
  const db={from(name){calls.push(["from",name]);return query;}};
  await withFlag("false",async()=>{
    assert.equal((await lookup.searchWorldwideCities(db,"Paris")).length,0);
    assert.equal(calls.length,0);
  });
  await withFlag("true",async()=>{
    const found=await lookup.searchWorldwideCities(db,"Paris");
    assert.equal(found.length,2);
    assert.equal(found[0].slug,"paris-fr");
    assert.equal(found[1].slug,"paris-us");
    assert.ok(calls.some(c=>c[0]==="limit"&&c[1]===40));
    assert.ok(calls.some(c=>c[0]==="ilike"&&c[2]==="Paris%"));
    const before=calls.length;
    for(const invalid of ["../etc","%","a".repeat(100),"\nParis","https://evil.test"]){
      assert.equal((await lookup.searchWorldwideCities(db,invalid)).length,0);
    }
    assert.equal(calls.length,before);
  });
});

test("Hub uses existing CSS tokens, source-based links and preserves SEO noindex",()=>{
  const hub=readFileSync(resolve(root,"src/components/destination/CitySpineHub.tsx"),"utf8");
  const detail=readFileSync(resolve(root,"src/app/destinations/[slug]/page.tsx"),"utf8");
  const directory=readFileSync(resolve(root,"src/app/destinations/page.tsx"),"utf8");
  const geo=readFileSync(resolve(root,"src/components/destination/GeoCityIntro.tsx"),"utf8");
  assert.match(hub,/gth-glass-strong/);
  assert.match(hub,/gth-btn-gold/);
  assert.match(hub,/var\(--gold\)/);
  assert.match(hub,/var\(--font-heading\)/);
  assert.doesNotMatch(hub,/style=\{|#[0-9a-f]{3,8}\b/i);
  assert.match(hub,/no specific product|never guaranteed/i);
  assert.match(detail,/isPublicLaunch\(\)&&place\.seoApproved/);
  assert.match(detail,/robots:\{index,follow:index\}/);
  assert.match(detail,/city\s*\?\s*<CitySpineHub/);
  assert.match(detail,/DestinationEcosystem/);
  assert.match(directory,/ENABLE_UNIFIED_CITY_ROUTER === "true"/);
  assert.match(directory,/<GeoCityIntro/);
  assert.match(geo,/resolveVercelGeoCity/);
  assert.doesNotMatch(geo,/NextResponse\.redirect|window\.location/);
  const style=readFileSync(resolve(root,"src/app/globals.css"),"utf8");
  assert.match(style,/--gold/);
  for(const p of [
    "src/components/flights/AviasalesWhiteLabel.tsx",
    "src/components/hotel/NuiteeHotelsListWidget.tsx",
    "src/components/travel/GTHTransportSearchWidget.tsx",
  ]) {
    const text=readFileSync(resolve(root,p),"utf8");
    assert.doesNotMatch(text,/CitySpineHub|router\/citySpine/);
  }
});

test("No database imports, mutations or third-party fabricated product URLs",()=>{
  for(const path of [
    "src/lib/router/citySpine.ts",
    "src/lib/router/flightCompetition.ts",
    "src/lib/router/worldCitySearch.ts",
    "src/components/destination/CitySpineHub.tsx",
    "src/components/destination/GeoCityIntro.tsx",
  ]) {
    const text=readFileSync(resolve(root,path),"utf8");
    assert.doesNotMatch(text,/\.insert\(|\.upsert\(|\.update\(|\.delete\(|create table|alter table/iu);
    assert.doesNotMatch(text,/https:\/\/(?:www\.)?(?:klook|hopegoo|nuitee)\.com\/(?:product|hotel)\//i);
  }
});

test("Geo currency and hotel intent controls preserve provider-safe input",async()=>{
  const geo=load("lib/router/edgeGeoAutoDetect.ts");
  assert.equal(geo.preferredCurrencyForCountry("IN"),"INR");
  assert.equal(geo.preferredCurrencyForCountry("SG"),"SGD");
  assert.equal(geo.preferredCurrencyForCountry("GB"),"GBP");
  assert.equal(geo.preferredCurrencyForCountry("FR"),"EUR");
  assert.equal(geo.preferredCurrencyForCountry("BR"),"USD");
  await withFlag("true",()=>{
    const result=router.resolveAffiliateRoute({
      city:cities.get("Mumbai"),
      service:"hotels",
      travelParams:{
        checkin:"2026-12-02",checkout:"2026-12-04",
        adults:"2",children:"3,6",currency:geo.preferredCurrencyForCountry("IN"),
      },
    },now);
    assert.equal(result.capability,"supplier_search");
    const url=new URL(result.href);
    assert.equal(url.searchParams.get("currency"),"INR");
    assert.equal(url.searchParams.get("checkin"),"2026-12-02");
    assert.equal(url.searchParams.get("checkout"),"2026-12-04");
    const guests=JSON.parse(atob(url.searchParams.get("occupancies")));
    assert.equal(guests[0].children.join(","),"3,6");
    const missing=router.resolveAffiliateRoute({
      city:cities.get("Mumbai"),service:"hotels",travelParams:{
        checkin:"2026-12-02",checkout:"invalid",currency:"INR",
      },
    },now);
    assert.equal(missing.capability,"unavailable");
  });
  const hub=readFileSync(resolve(root,"src/components/destination/CitySpineHub.tsx"),"utf8");
  const control=readFileSync(resolve(root,"src/components/destination/StaySearchControls.tsx"),"utf8");
  const page=readFileSync(resolve(root,"src/app/destinations/[slug]/page.tsx"),"utf8");
  assert.match(hub,/StaySearchControls/);
  assert.match(hub,/preferredCurrencyForCountry/);
  assert.match(control,/name="checkin"/);
  assert.match(control,/name="checkout"/);
  assert.match(control,/name="adults"/);
  assert.match(control,/name="children"/);
  assert.match(control,/name="currency"/);
  assert.match(page,/travelParams=\{stayParams\}/);
  assert.doesNotMatch(control,/window\.location|localStorage|NEXT_PUBLIC_.*KEY|style=\{/);
});
