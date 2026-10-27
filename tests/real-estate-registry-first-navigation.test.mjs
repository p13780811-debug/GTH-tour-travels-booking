import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const markets=fs.readFileSync("src/components/real-estate/GlobalMarkets.tsx","utf8");
const explorer=fs.readFileSync("src/app/real-estate/page.tsx","utf8");
const header=fs.readFileSync("src/components/real-estate/EstateHeader.tsx","utf8");
const presentation=fs.readFileSync("src/app/real-estate/registry/explorer-presentation.ts","utf8");

test("research-market city links open documented registry, never empty sale/rent results",()=>{
  assert.match(markets,/href=\{\`\/real-estate\/registry\?q=\$\{encodeURIComponent\(market\.city\)\}\`\}/);
  assert.doesNotMatch(markets,/href=\{\`\/real-estate\?city=/);
  assert.match(markets,/\.in\("source_type", \["registry", "rera"\]\)/);
  assert.match(markets,/\.ilike\("ingestion_source", "%maharera%"\)/);
  assert.match(markets,/Not live sale\/rent inventory/);
});
test("empty marketplace advertises separate registry research and consent-based onboarding",()=>{
  assert.match(explorer,/Verified property offers are coming to this marketplace/);
  assert.match(explorer,/href=\{"\/real-estate\/registry"/);
  assert.match(explorer,/href="\/real-estate\/post-property"/);
  assert.match(presentation,/active_inventory_count\)>0/);
  assert.match(presentation,/hasApprovedPropertyPhoto\(p\)/);
});
test("phone header keeps theme and menu while hiding redundant large links",()=>{
  assert.match(header,/className="hidden lg:block"><Link href="\/real-estate\/post-property"/);
  assert.match(header,/className="hidden lg:block"><Link href="\/real-estate\/profile"/);
  assert.match(header,/<ThemeToggle\/>/);
  assert.match(header,/aria-label=\{open \? "Close navigation" : "Open navigation"\}/);
});
