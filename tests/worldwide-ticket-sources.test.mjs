import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const source=readFileSync(new URL("../src/lib/travel/worldwide-ticket-sources.ts",import.meta.url),"utf8");
const match=source.match(/export const worldwideTicketSources: readonly WorldwideTicketSource\[\] = (\[[\s\S]*?\]);/);
assert.ok(match,"Ticket source registry must remain a parseable JSON-compatible array");
const sources=JSON.parse(match[1]);
const categories=new Set([...source.matchAll(/\{slug:"([^"]+)",label:/g)].map(m=>m[1]));
const supported=new Set(["ticket-platform","official-box-office","official-calendar","discovery-platform"]);

test("worldwide ticket discovery has varied real categories and independent sources",()=>{
 assert.ok(sources.length>=25);
 assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);
 assert.deepEqual([...categories].sort(),["sports","concerts","theatre","comedy","festivals","attractions","museums","theme-parks","cinema"].sort());
 for(const key of categories)assert.ok(sources.some(s=>s.categories.includes(key)),"Missing sources for "+key);
 assert.ok(sources.some(s=>s.region==="India"));
 assert.ok(sources.some(s=>s.region==="Worldwide"));
});
test("ticket source URLs are public HTTPS pages without credentials or affiliate claims",()=>{
 for(const s of sources){
  const u=new URL(s.url);
  assert.equal(u.protocol,"https:",s.id);
  assert.equal(u.username,"",s.id);
  assert.equal(u.password,"",s.id);
  assert.equal(u.hash,"",s.id);
  assert.ok(supported.has(s.kind),s.id);
  assert.ok(s.categories.length>0,s.id);
  for(const category of s.categories)assert.ok(categories.has(category),s.id+" category "+category);
  assert.ok(!/[?&](?:token|key|api_key|secret|partner_id|subid|affid)=/i.test(s.url),s.id);
  assert.ok(s.name.length>2&&s.region.length>1,s.id);
 }
});
test("direct official offices, information and generic platforms are distinct",()=>{
 const byId=Object.fromEntries(sources.map(s=>[s.id,s]));
 assert.equal(byId["vatican"].kind,"official-box-office");
 assert.equal(byId["ghibli"].kind,"official-calendar");
 assert.equal(byId["eventbrite"].kind,"discovery-platform");
 assert.equal(byId["bookmyshow"].kind,"ticket-platform");
});
test("worldwide hub uses verified matches or a clearly empty state instead of unrelated fallbacks",()=>{
 const app=readFileSync(new URL("../src/app/tickets/WorldwideTicketExplorer.tsx",import.meta.url),"utf8");
 const page=readFileSync(new URL("../src/app/tickets/page.tsx",import.meta.url),"utf8");
 const nav=readFileSync(new URL("../src/components/travel/TravelSectionNav.tsx",import.meta.url),"utf8");
 assert.ok(app.includes('mode==="not-found"'));
 assert.ok(app.includes("terms.every(term=>tokens.has(term))"));
 assert.ok(app.includes("No verified matching venue or ticket-source listing"));
 assert.ok(!app.includes("const pool=relevant.length?relevant:items.filter"));
 assert.ok(page.includes("WorldwideTicketExplorer"));
 assert.ok(nav.includes('href:"/tickets"'));
 assert.ok(app.includes('kind:"venue-guide"'));
});
