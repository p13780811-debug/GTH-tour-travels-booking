import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";
const source=readFileSync(new URL("../src/lib/intelligence/market-evidence.ts",import.meta.url),"utf8");
const {propertyMatchesMarket}=await import("data:text/javascript;base64,"+Buffer.from(stripTypeScriptTypes(source,{mode:"strip"})).toString("base64"));
test("legacy default city cannot establish a Mumbai market link",()=>{
 assert.equal(propertyMatchesMarket({city:"Mumbai",source_type:"rera",district:"Pune"},"Mumbai"),false);
 assert.equal(propertyMatchesMarket({city:"Mumbai",source_type:"rera",district:"Mumbai"},"Mumbai"),false);
});
test("only exact non-archived city evidence is accepted",()=>{
 assert.equal(propertyMatchesMarket({city:" Mumbai ",source_type:"official_csv"},"Mumbai"),true);
 assert.equal(propertyMatchesMarket({city:"Londonderry"},"London"),false);
 assert.equal(propertyMatchesMarket({city:"Mumbai",status:"archived"},"Mumbai"),false);
});
test("tender region matching has no substring wildcards",()=>{
 const service=readFileSync(new URL("../src/lib/intelligence/market-decision.ts",import.meta.url),"utf8");
 assert.ok(service.includes('.ilike("region",escapedCity)'));
 assert.ok(!service.includes('"%"+escapedCity+"%"'));
});
