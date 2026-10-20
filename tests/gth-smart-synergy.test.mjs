import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import ts from "typescript";

const source=readFileSync("src/lib/search/smart-intent.ts","utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,
  isolatedModules:true
},reportDiagnostics:true});
assert.deepEqual((compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
const {smartSearchTarget}=await import("data:text/javascript;base64,"+
  Buffer.from(compiled.outputText).toString("base64"));

test("2BHK Andheri budget maps to existing property inventory filters",()=>{
  const actual=smartSearchTarget("2BHK near metro in Andheri under 1.5 Cr");
  assert.equal(actual.category,"property");
  assert.equal(actual.filters.city,"Mumbai");
  assert.equal(actual.filters.query,"andheri");
  assert.equal(actual.filters.bedrooms,"2");
  assert.equal(actual.filters.maxPrice,"15000000");
  assert.equal(actual.filters.currency,"INR");
  assert.ok(actual.href.startsWith("/real-estate?"));
  assert.ok(!actual.href.includes("undefined"));
});
test("Paris hotels route only applies supported city search, not fictional landmark proximity",()=>{
  const actual=smartSearchTarget("Best heritage hotels in Paris near Eiffel Tower");
  assert.equal(actual.category,"hotel");
  assert.equal(actual.href,"/hotels?city=Paris");
  assert.match(actual.notice,/not verified proximity/i);
});
test("flight intent always uses the existing Aviasales White Label route",()=>{
  const actual=smartSearchTarget("Flights to Mumbai next month");
  assert.equal(actual.href,"/flights#flight-search");
  const flights=readFileSync("src/components/flights/AviasalesWhiteLabel.tsx","utf8");
  assert.match(flights,/wl_id=23459/);
  assert.match(flights,/id="tpwl-search"/);
  assert.match(flights,/id="tpwl-tickets"/);
});
test("only published and rights-cleared record media enters printable dossier",()=>{
 const prop=readFileSync("src/app/real-estate/[slug]/dossier/page.tsx","utf8");
 const tour=readFileSync("src/app/tours/[slug]/dossier/page.tsx","utf8");
 assert.match(prop,/getPublishedProjectMedia/);
 assert.match(prop,/projectCover/);
 assert.match(tour,/media_rights_verified/);
 assert.match(prop,/official@gthproglobal\.com/);
 assert.match(tour,/official@gthproglobal\.com/);
});
test("service worker never caches documents or sensitive dynamic API responses",()=>{
 const sw=readFileSync("public/sw.js","utf8");
 assert.match(sw,/request\.mode==="navigate"/);
 assert.match(sw,/\/_next\/static\//);
 assert.match(sw,/if\(!publicAsset\)return/);
 assert.doesNotMatch(sw,/\/api\/.*cache\.put/);
});
test("mobile bottom-sheet and nav retain reduced-motion and keyboard support",()=>{
 const sheet=readFileSync("src/app/real-estate/page.tsx","utf8");
 const nav=readFileSync("src/components/mobile/BottomNav.tsx","utf8");
 assert.match(sheet,/onTouchEnd=/);
 assert.match(sheet,/Swipe down to close/);
 assert.match(nav,/motion-reduce:transition-none/);
 assert.match(nav,/aria-current=/);
});
