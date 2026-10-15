import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=readFileSync(new URL("../src/lib/tender/localization.ts",import.meta.url),"utf8")
  .replace('import "server-only";',"");
let resolvedHeaders={};
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const localModule={exports:{}};
vm.runInNewContext(js,{module:localModule,exports:localModule.exports,require:()=>({headers:async()=>({get:name=>resolvedHeaders[name]??null})}),Intl,Set,Map,Date},{timeout:1500});
const {validCountry,preferLanguage,nearbyCountries,resolveTenderAudience,countryLabel}=localModule.exports;

test("Country codes reject fake/non-ISO values",()=>{
  assert.equal(validCountry("IN"),"IN");
  assert.equal(validCountry("in"),"IN");
  assert.equal(validCountry("ZZ"),null);
  assert.equal(validCountry("india"),null);
});
test("India neighbors are geographic, not unrelated international inventory",()=>{
  const nearby=Array.from(nearbyCountries("IN"));
  assert.deepEqual(nearby,["NP","BT","BD","LK","MM","PK","CN"]);
  assert.ok(!nearby.includes("US"));
  assert.ok(!nearby.includes("FR"));
});
test("Browser language takes precedence over inferred country; q=0 is not selected",()=>{
  assert.equal(preferLanguage("bn-IN,bn;q=0.9,en;q=0.8","IN"),"bn");
  assert.equal(preferLanguage("fr;q=0,hi;q=0.7","IN"),"hi");
  assert.equal(preferLanguage(null,"IN"),"hi");
  assert.equal(preferLanguage("en-US","IN","ta"),"ta");
});
test("Visitor country is coarse server header, user override has precedence",async()=>{
  resolvedHeaders={"x-vercel-ip-country":"IN","accept-language":"bn-IN,bn;q=0.8"};
  const visitor=await resolveTenderAudience();
  assert.equal(visitor.country,"IN");
  assert.equal(visitor.language,"bn");
  const chosen=await resolveTenderAudience("AE","ar");
  assert.equal(chosen.country,"AE");
  assert.equal(chosen.language,"ar");
  assert.ok(Array.from(chosen.nearby).includes("SA"));
});
test("No geolocation never invents user's current country",async()=>{
  resolvedHeaders={"accept-language":"de"};
  const visitor=await resolveTenderAudience();
  assert.equal(visitor.country,null);
  assert.equal(visitor.language,"de");
});
test("Localized region labels remain readable",()=>{
  assert.equal(typeof countryLabel("IN","hi"),"string");
});
