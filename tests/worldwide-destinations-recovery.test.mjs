import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const source=read("src/app/destinations/page.tsx");
const catalog=read("src/lib/destinations/world-country-catalog.ts");
test("all 244 saved country codes have selectable country filters",()=>{
 assert.equal((catalog.match(/  \{code:"[A-Z]{2}",name:/g)||[]).length,244);
 for(const pair of [["IN","India"],["MV","Maldives"],["JP","Japan"],["FR","France"],["GB","United Kingdom"]])
   assert.ok(catalog.includes('code:"'+pair[0]+'",name:"'+pair[1]+'"'),pair.join(":"));
 assert.match(source,/findDestinationCountry\(params\.country\)/);
 assert.match(source,/WORLD_DESTINATION_COUNTRIES\\.map/);
 assert.match(catalog,/dbName:"Korea, Republic of"/);
 assert.match(catalog,/dbName:"Bolivia, Plurinational State of"/);
 assert.match(catalog,/item\\.dbName\\.toLocaleLowerCase/);
});
test("directory reads one bounded database page with exact country identity",()=>{
 for(const expression of [/count:"exact"/,/\.eq\("country_code",countryCode\)/,
 /\.range\(offset,offset\+perPage-1\)/,/WORLD_SLUG\.test\(row\.slug\)/,
 /abortSignal\(AbortSignal\.timeout\(4_500\)\)/])
   assert.match(source,expression);
 assert.doesNotMatch(source,/offset < 1200/);
 assert.doesNotMatch(source,/\.upsert\(|\.insert\(|\.delete\(|\.update\(/);
 assert.match(source,/directory\.available/);
});
test("country-to-city detail routes preserve existing unified routing",()=>{
 assert.match(read("src/app/destinations/[slug]/page.tsx"),/resolveCityContext\(db, \{ slug \}\)/);
 assert.match(source,/DestinationExplorerResults items=\{visible\}/);
});
