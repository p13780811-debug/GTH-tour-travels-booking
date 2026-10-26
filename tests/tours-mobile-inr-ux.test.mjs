import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function read(path){return readFileSync(new URL("../"+path,import.meta.url),"utf8");}
function harness(fetch){
 const out={exports:{}};
 vm.runInNewContext(ts.transpileModule(read("src/lib/tours/reference-fx.ts"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText,{module:out,exports:out.exports,require:name=>{
  if(name==="server-only")return {};
  throw Error("Unexpected import "+name);
 },fetch,AbortSignal,Date,Number});
 return out.exports.getUsdInrReference;
}
function response(rate,date=new Date().toISOString().slice(0,10)){
 return new Response(JSON.stringify({amount:1,base:"USD",date,rates:{INR:rate}}),{
  headers:{"content-type":"application/json"},
 });
}

test("current source-dated USD INR reference can be displayed as an estimate",async()=>{
 const get=harness(async()=>response(95.18));
 const result=await get();
 assert.equal(result.rate,95.18);
 assert.match(result.asOf,/^\d{4}-\d{2}-\d{2}$/);
});

test("stale, negative, invalid and failed FX responses never generate estimates",async()=>{
 for(const fetch of [
  async()=>response(0),
  async()=>response(-1),
  async()=>response(95,"2020-01-01"),
  async()=>new Response("<html>error</html>",{headers:{"content-type":"text/html"}}),
  async()=>{throw Error("private service response");},
 ]){
  const result=await harness(fetch)();
  assert.equal(result,null);
 }
});

test("mobile scroll fix retains horizontal swipe, never touches global CSS",()=>{
 const nav=read("src/components/travel/TravelSectionNav.tsx");
 const landing=read("src/components/tours/TourLanding.tsx");
 const styles=read("src/components/travel/TravelScroll.module.css");
 assert.match(nav,/overflow-x-auto/);
 assert.match(landing,/overflow-x-auto/);
 assert.match(nav,/scroll\.strip/);
 assert.match(landing,/scroll\.strip/);
 assert.match(styles,/scrollbar-width:\s*none/);
 assert.match(styles,/::-webkit-scrollbar/);
});

test("Tours avoid artificial shortage claims and display only labelled INR estimates",()=>{
 const catalog=read("src/components/tours/SupplierTourCatalog.tsx");
 const card=read("src/components/tours/SupplierTourCard.tsx");
 assert.doesNotMatch(catalog,/currently in this selection/);
 assert.match(catalog,/not the provider’s complete inventory/);
 assert.match(card,/Indicative FX as of/);
 assert.match(card,/not the final supplier INR fare/);
 assert.match(catalog,/getUsdInrReference/);
});
