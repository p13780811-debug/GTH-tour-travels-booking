import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const testModule={exports:{}};
vm.runInNewContext(ts.transpileModule(read("src/lib/tours/discovery.ts"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,{module:testModule,exports:testModule.exports,URL,URLSearchParams},{timeout:2000});
const {parseTourFilters,directTourSearch}=testModule.exports;

test("first Tours submit builds the validated London Klook search",()=>{
 const parsed=parseTourFilters({city:"  London  ",category:"audio-tour",sort:"name"});
 assert.equal(parsed.ok,true);
 const url=new URL(directTourSearch(parsed.filters));
 assert.equal(url.origin,"https://www.klook.com");
 assert.equal(url.pathname,"/en-IN/search/result/");
 assert.equal(url.searchParams.get("query"),"London Audio tours");
});
test("invalid or empty destination cannot open a provider URL",()=>{
 for(const city of ["","London,or(id.gt.0)","javascript:alert(1)"]){
  const parsed=parseTourFilters({city});
  assert.equal(parsed.ok,city==="");
  if(parsed.ok)assert.equal(directTourSearch(parsed.filters),null);
 }
});
test("Tours first button launches Klook and navigates natively to filtered cards",()=>{
 const hero=read("src/components/tours/TourSearchHero.tsx");
 const landing=read("src/components/tours/TourLanding.tsx");
 assert.match(hero,/^"use client";/);
 assert.match(hero,/onSubmit=\{handleSearch\}/);
 assert.match(hero,/new FormData\(event\.currentTarget\)/);
 assert.match(hero,/window\.open\(providerUrl,"_blank","noopener,noreferrer"\)/);
 assert.match(hero,/action=\{basePath\+"#discover"\} method="GET"/);
 assert.doesNotMatch(hero,/event\.preventDefault\(/);
 assert.ok(hero.includes('basePath==="/activities"&&direct&&<a'));
 assert.match(landing,/id="discover" className="scroll-mt-24"/);
});
