import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("daily production smoke covers the actual public domain and all three pillars",()=>{
 const s=read("scripts/monitor-ecosystem.mjs");
 const w=read(".github/workflows/gth-ecosystem-daily-smoke.yml");
 assert.match(s,/https:\/\/www\.gthproglobal\.com/);
 assert.match(w,/GTH_PRO_MONITOR_URL: https:\/\/www\.gthproglobal\.com/);
 for(const route of ["/","/mega-aggregator","/travel","/flights","/hotels","/tours","/transfers","/real-estate","/tender","/partners","/contact"]){
   assert.ok(s.includes('"'+route+'"'),"missing "+route);
 }
 assert.match(w,/cron: "0 6 \* \* \*"/);
});
test("route checks detect silent redirect-to-home and expose slow first responses without fake booking claims",()=>{
 const s=read("scripts/monitor-ecosystem.mjs");
 assert.match(s,/redirect:"manual"/);
 assert.match(s,/response\.status===200&&isHtml/);
 assert.match(s,/Date\.now\(\)-start/);
 assert.match(s,/slowMs=8000,concurrency=4/);
 assert.match(s,/AbortSignal\.timeout\(timeoutMs\)/);
 assert.match(s,/if\(failures\)process\.exitCode=1/);
 assert.match(s,/not Core Web Vitals/);
 assert.doesNotMatch(s,/POST|PUT|DELETE|authorization|service_role|NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});
