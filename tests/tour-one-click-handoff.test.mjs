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
test("Tours and Activities search first-party matches first and offer explicit tracked fallback",()=>{
 const hero=read("src/components/tours/TourSearchHero.tsx");
 const landing=read("src/components/tours/TourLanding.tsx");
 assert.match(hero,/^"use client";/);
 assert.doesNotMatch(hero,/onSubmit=\{handleSearch\}|window\.open\(/);
 assert.match(hero,/action=\{basePath\+"#discover"\} method="GET"/);
 assert.match(hero,/providerUrl && <a href=\{providerUrl\}/);
 assert.match(hero,/target="_blank" rel="noopener noreferrer sponsored"/);
 assert.match(hero,/partnerSearchHref\(basePath==="\/tours"\?"tours":"activities"/);
 assert.match(landing,/id="discover" className="scroll-mt-24"/);
});
