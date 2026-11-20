import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const cached=new Map();
function load(relative){
  const path=resolve(root,relative.startsWith("src/")?relative:"src/"+relative);
  if(!path.startsWith(root+"/src/"))throw Error("Invalid test import");
  if(cached.has(path))return cached.get(path).exports;
  const code=ts.transpileModule(readFileSync(path,"utf8"),{
    fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,
  });
  assert.equal((code.diagnostics??[]).filter(d=>d.category===1).length,0);
  const testModule={exports:{}};cached.set(path,testModule);
  const localRequire=(specifier)=>{
    if(specifier==="server-only")return {};
    const name=specifier.startsWith("@/")?resolve(root,"src",specifier.slice(2)):
      specifier.startsWith(".")?resolve(dirname(path),specifier):null;
    if(!name||!name.startsWith(root+"/src/"))throw Error("Unexpected import: "+specifier);
    return load(name.slice(root.length+1)+(name.endsWith(".ts")?"":".ts"));
  };
  vm.runInNewContext(code.outputText,{
    module:testModule,exports:testModule.exports,require:localRequire,URL,URLSearchParams,Date,process,
    btoa,atob,AbortSignal,Headers,Intl,decodeURIComponent,encodeURIComponent,
  },{filename:path,timeout:5000});
  return testModule.exports;
}
const {resolveDestinationStayHandoff}=load("lib/destinations/destinationStayHandoff.ts");
const now=new Date("2026-11-20T00:00:00Z");
const city=(name,slug,country,placeId=null)=>({
  id:"eeaa0041-3456-41b0-b230-000000000001",name,slug,country,
  country_code:null,verifiedNuiteePlaceId:placeId,
});
const selection=(overrides={})=>new URLSearchParams({
  checkin:"2026-12-12",checkout:"2026-12-15",adults:"3",
  children:"6,10",currency:"USD",...overrides,
});

test("Mumbai: verified place ID opens Nuitee city listing, exact dates and ages",()=>{
  const result=resolveDestinationStayHandoff(city("Mumbai","mumbai","India","ChIJwe1EZjDG5zsRaYxkjY_tpF0"),selection(),now);
  assert.equal(result.status,"direct");
  const u=new URL(result.href);
  assert.equal(u.origin,"https://hotel.gthproglobal.com");
  assert.equal(u.pathname,"/hotels");
  assert.equal(u.searchParams.get("placeId"),"ChIJwe1EZjDG5zsRaYxkjY_tpF0");
  assert.equal(u.searchParams.get("checkin"),"2026-12-12");
  assert.equal(u.searchParams.get("checkout"),"2026-12-15");
  assert.equal(u.searchParams.get("currency"),"USD");
  assert.equal(u.searchParams.get("language"),"en");
  const occupancies=JSON.parse(atob(u.searchParams.get("occupancies")));
  assert.equal(occupancies.length,1);
  assert.equal(occupancies[0].adults,3);
  assert.deepEqual([...occupancies[0].children],[6,10]);
  assert.equal(u.searchParams.has("city"),false,"Never add an unsupported supplier city parameter");
});

test("Goa: no verified Place ID means no invented listing or generic nearby Mumbai redirect",()=>{
  const result=resolveDestinationStayHandoff(city("Goa","goa","India"),selection(),now);
  assert.equal(result.status,"select_destination");
  const u=new URL(result.href,"https://www.gthproglobal.com");
  assert.equal(u.origin,"https://www.gthproglobal.com");
  assert.equal(u.pathname,"/hotels");
  assert.equal(u.searchParams.get("city"),"Goa India");
  assert.equal(u.searchParams.get("checkin"),"2026-12-12");
  assert.equal(u.searchParams.get("checkout"),"2026-12-15");
  assert.equal(u.searchParams.get("children"),"6,10");
  assert.equal(u.searchParams.get("currency"),"USD");
  assert.equal(u.searchParams.has("placeId"),false);
});

test("Dubai: no ID stays scoped to Dubai UAE in first-party supplier picker",()=>{
  const result=resolveDestinationStayHandoff(
    city("Dubai","dubai-ae","United Arab Emirates"),selection({adults:"2",children:"",currency:"AED"}),now,
  );
  assert.equal(result.status,"select_destination");
  const u=new URL(result.href,"https://www.gthproglobal.com");
  assert.equal(u.searchParams.get("city"),"Dubai United Arab Emirates");
  assert.equal(u.searchParams.get("adults"),"2");
  assert.equal(u.searchParams.get("currency"),"AED");
  assert.equal(u.href.includes("Mumbai"),false);
});

test("Dates shown by default are the dates forwarded when untouched",()=>{
  const result=resolveDestinationStayHandoff(city("London","london-gb","United Kingdom",
    "ChIJdd4hrwug2EcRmSrV3Vo6llI"),new URLSearchParams({adults:"2",currency:"GBP"}),now);
  assert.equal(result.status,"direct");
  const u=new URL(result.href);
  assert.equal(u.searchParams.get("checkin"),"2026-11-21");
  assert.equal(u.searchParams.get("checkout"),"2026-11-22");
  assert.deepEqual(JSON.parse(atob(u.searchParams.get("occupancies"))),[{adults:2,children:[]}]);
});

test("All destinations use their source identity; no hard-coded city fallback",()=>{
  const result=resolveDestinationStayHandoff(
    city("Rio de Janeiro","rio-de-janeiro-br","Brazil"),
    selection({currency:"BRL"}),now,
  );
  assert.equal(result.status,"invalid","Unsupported currency must never pass");
  const selected=resolveDestinationStayHandoff(
    city("Rio de Janeiro","rio-de-janeiro-br","Brazil"),
    selection({currency:"USD"}),now,
  );
  assert.equal(selected.status,"select_destination");
  assert.equal(new URLSearchParams(selected.href.split("?")[1]).get("city"),"Rio de Janeiro Brazil");
});

test("Invalid, duplicate or malicious parameters fail closed",()=>{
  const m=city("Mumbai","mumbai","India","ChIJwe1EZjDG5zsRaYxkjY_tpF0");
  const variations=[
    selection({checkout:"2026-12-11"}),
    selection({checkin:"2020-01-01"}),
    selection({children:"18"}),
    selection({children:"6,,10"}),
    selection({adults:"0"}),
    selection({currency:"BAD"}),
    selection({returnUrl:"https://evil.example"}),
  ];
  const duplicate=selection();duplicate.append("checkin","2026-12-16");variations.push(duplicate);
  for(const v of variations)assert.equal(resolveDestinationStayHandoff(m,v,now).status,"invalid",v.toString());
});

test("The one destination template owns both hotel buttons; no change to flight/tour integrations",()=>{
  const control=readFileSync(resolve(root,"src/components/destination/StaySearchControls.tsx"),"utf8");
  const hub=readFileSync(resolve(root,"src/components/destination/CitySpineHub.tsx"),"utf8");
  const route=readFileSync(resolve(root,"src/app/destinations/[slug]/stays/route.ts"),"utf8");
  assert.match(control,/id="gth-destination-stay-form"/);
  assert.match(control,/\/stays"/);
  assert.match(control,/defaultValue=\{dates\.checkin\}/);
  assert.match(control,/defaultValue=\{dates\.checkout\}/);
  assert.match(hub,/formId="gth-destination-stay-form"/);
  assert.match(hub,/const flights=resolveFlightCompetition\(\{city\}\)/);
  assert.match(hub,/const transport=resolveAffiliateRoute/);
  assert.match(hub,/const experiences=providers\.map/);
  assert.match(route,/resolveCityContext\(db, \{ slug \}\)/);
  assert.match(route,/NextResponse\.redirect\(url, 307\)/);
  assert.doesNotMatch(route,/SUPABASE_SERVICE_ROLE_KEY|fetch\("https:\/\/api\.liteapi|NEXT_PUBLIC_NUITEE_PRODUCTION_API_KEY/);
});
