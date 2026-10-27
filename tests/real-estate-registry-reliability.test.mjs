import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync("src/app/real-estate/registry/page.tsx","utf8");
const markets=fs.readFileSync("src/components/real-estate/GlobalMarkets.tsx","utf8");
test("public registry caches only successful source-backed anonymous reads",()=>{
 assert.match(source,/unstable_cache\\(readRegistryUncached/);
 assert.match(source,/revalidate:300/);
 assert.match(source,/throw new Error\\("registry_public_query_failed"\\)/);
 assert.match(source,/return \\{rows:\\[\\],error:true,hasNext:false\\}/);
 assert.match(source,/\\.in\\("source_type",\\["registry","rera"\\]\\)/);
 assert.match(source,/\\.ilike\\("ingestion_source","%maharera%"\\)/);
 assert.doesNotMatch(source,/\\.from\\("property_inventory"\\)/);
});
test("bounded retries and transparent registry failure state",()=>{
 assert.match(source,/for\\(let attempt=0;attempt<2;attempt\\+\\+\\)/);
 assert.match(source,/AbortSignal\\.timeout\\(7_000\\)/);
 assert.match(source,/PGRST003/);
 assert.match(source,/Retry registry lookup/);
 assert.match(source,/No records were invented/);
});
test("regional links avoid per-visitor database amplification",()=>{
 assert.match(markets,/researchLocations=\\["Mumbai","Thane","Kalyan","Dombivli"\\]/);
 assert.match(markets,/not counts or currently available property offers/i);
 assert.doesNotMatch(markets,/supabase|marketplace_market_counts|\\.from\\(/);
});