import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const registry=readFileSync(new URL("../src/lib/travel/stadium-ticket-destinations.ts",import.meta.url),"utf8");
const items=[...registry.matchAll(/\{id:"([^"]+)",name:"([^"]+)",region:"([^"]+)",sport:"([^"]+)",url:"([^"]+)",kind:"([^"]+)"\}/g)].map(m=>({id:m[1],name:m[2],region:m[3],sport:m[4],url:m[5],kind:m[6]}));
test("stadium destinations are populated and uniquely keyed",()=>{
 assert.ok(items.length>=20);
 assert.equal(new Set(items.map(x=>x.id)).size,items.length);
});
test("outbound destinations are HTTPS and do not contain secrets or misleading affiliate attribution",()=>{
 for(const d of items){
  const u=new URL(d.url);
  assert.equal(u.protocol,"https:",d.id);
  assert.equal(u.username,"",d.id);
  assert.equal(u.password,"",d.id);
  assert.equal(u.hash,"",d.id);
  assert.ok(["official-tickets","official-schedule","authorized-marketplace"].includes(d.kind),d.id);
  assert.ok(!/[?&](?:token|api_key|secret|partner_id)=/i.test(d.url),d.id);
 }
});
test("organizer schedule URLs are not mislabeled as confirmed checkout",()=>{
 for(const id of ["ipl","icc","bcci","premier","afl","npb"]){
  assert.equal(items.find(x=>x.id===id)?.kind,"official-schedule",id);
 }
 assert.equal(items.find(x=>x.id==="ticketmaster")?.kind,"authorized-marketplace");
});
