import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("sitemap-driven daily SEO monitor checks every indexed candidate not just a static shortlist",()=>{
 const s=read("scripts/monitor-seo.mjs");
 assert.match(s,/https:\/\/www\.gthproglobal\.com/);
 assert.match(s,/sitemap\.xml/);
 assert.match(s,/\[\.\.\.new Set\(\[\.\.\.seedPaths, \.\.\.sitemapPaths\]\)\]/);
 assert.match(s,/const paths = /);
 assert.match(s,/for \(let i = 0; i < paths\.length; i \+= 4\)/);
 assert.match(s,/response\.status !== 200/);
 assert.match(s,/robots\.txt/);
 assert.match(s,/canonical/);
 assert.match(s,/noindex\|nofollow/);
 assert.match(s,/H1 absent in initial server HTML/);
 assert.match(s,/not a guarantee of indexing or ranking/);
});

test("SEO monitors do not mutate pages, fetch private data or falsely claim indexing",()=>{
 const s=read("scripts/monitor-seo.mjs");
 const y=read(".github/workflows/gth-daily-seo-health.yml");
 assert.match(s,/redirect: "manual"/);
 assert.match(s,/signal: AbortSignal\.timeout\(20000\)/);
 assert.doesNotMatch(s,/method:"POST"|method:'POST'|service_role|GEMINI_API_KEY|OPENAI_API_KEY/);
 assert.match(y,/schedule:/);
 assert.match(y,/cron: "20 7 \* \* \*"/);
 assert.match(y,/node scripts\/monitor-seo\.mjs/);
});

test("daily SEO sampling accepts the real-estate property shards advertised by the index",()=>{
 assert.match(read("scripts/monitor-seo.mjs"),/tenders\|properties/);
});

test("daily SEO monitor categorizes six website failure modes without claiming Google indexing status",()=>{
 const s=read("scripts/monitor-seo.mjs");
 for(const category of [
  "robots_blocked","noindex","redirect","http_failure","canonical_mismatch","content_quality",
 ])assert.ok(s.includes('"'+category+'"'),"missing audit category "+category);
 assert.match(s,/response\.headers\.get\("x-robots-tag"\)/);
 assert.match(s,/response\.status >= 300 && response\.status < 400/);
 assert.match(s,/const indexingDiagnostics =/);
 assert.match(s,/publicDisallow\.some/);
 assert.match(s,/INDEXABILITY_SITE_CHECK/);
 assert.match(s,/Google Crawled\/Discovered indexing states require Search Console URL Inspection/);
 assert.doesNotMatch(s,/method:\s*["']POST["']|SUPABASE_SERVICE_ROLE|INDEXING_API_KEY/);
});
