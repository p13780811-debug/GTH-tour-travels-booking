import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync("src/app/real-estate/registry/page.tsx","utf8");
const markets=fs.readFileSync("src/components/real-estate/GlobalMarkets.tsx","utf8");

test("registry caches only successful source-backed anonymous reads",()=>{
 assert.ok(source.includes('unstable_cache(readRegistryUncached'));
 assert.ok(source.includes('revalidate:300'));
 assert.ok(source.includes('throw new Error("registry_public_query_failed")'));
 assert.ok(source.includes('return {rows:[],error:true,hasNext:false}'));
 assert.ok(source.includes('.in("source_type",["registry","rera"])'));
 assert.ok(source.includes('.ilike("ingestion_source","%maharera%")'));
 assert.ok(!source.includes('.from("property_inventory")'));
});
test("temporary failures get one bounded retry and clear recoverable UI",()=>{
 assert.ok(source.includes('for(let attempt=0;attempt<2;attempt++)'));
 assert.ok(source.includes('AbortSignal.timeout(7_000)'));
 assert.ok(source.includes('"PGRST003"'));
 assert.ok(source.includes('Retry registry lookup'));
 assert.ok(source.includes('No records were invented'));
});
test("region links no longer add multiple source database queries per visitor",()=>{
 assert.ok(markets.includes('researchLocations=["Mumbai","Thane","Kalyan","Dombivli"]'));
 assert.ok(markets.includes('not counts or currently available property offers'));
 assert.ok(!markets.includes('supabase'));
 assert.ok(!markets.includes('marketplace_market_counts'));
});
