import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(path,"utf8");
const files={
 partners:read("src/lib/travel/attraction-ticket-partners.ts"),
 index:read("src/app/attractions/page.tsx"),
 detail:read("src/app/(mapped-places)/attractions/osm/[id]/page.tsx"),
 osm:read("src/lib/travel/osm-place.ts"),
};
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(files.partners,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText,{module:mod,exports:mod.exports});
const {ATTRACTION_TICKET_PARTNERS,isTicketOrientedCategory,attractionTicketQueryLabel}=mod.exports;

test("KKday reuses real existing project referral; Tiqets never claims unverified tracking",()=>{
 assert.equal(ATTRACTION_TICKET_PARTNERS.kkday.href,"https://kkday.tpo.lv/ytfvDLam");
 assert.equal(ATTRACTION_TICKET_PARTNERS.kkday.tracked,true);
 assert.equal(ATTRACTION_TICKET_PARTNERS.tiqets.href,"https://www.tiqets.com/en/");
 assert.equal(ATTRACTION_TICKET_PARTNERS.tiqets.tracked,false);
 for(const p of Object.values(ATTRACTION_TICKET_PARTNERS)){
  const u=new URL(p.href);
  assert.equal(u.protocol,"https:");
  assert.equal(u.username,"");
  assert.equal(u.password,"");
 }
 assert.doesNotMatch(files.partners,/TICKETMASTER|SERVICE_ROLE|secret|API_KEY|178000|174819|pricing/);
});
test("maps use categories to guide searches without claiming that every record needs admission",()=>{
 for(const cat of ["museum","zoo","theme-park","fort","monument"]){
  assert.equal(isTicketOrientedCategory(cat),true);
  assert.match(attractionTicketQueryLabel(cat),/possible admission/);
 }
 for(const cat of ["beach","park","nature-reserve"]){
  assert.equal(isTicketOrientedCategory(cat),false);
  assert.match(attractionTicketQueryLabel(cat),/nearby tours/);
 }
});
test("existing 174k-source attraction directory promotes programs and actual mapped category filters",()=>{
 assert.match(files.index,/ATTRACTION_TICKET_PARTNERS\.kkday\.href/);
 assert.match(files.index,/ATTRACTION_TICKET_PARTNERS\.tiqets\.href/);
 assert.match(files.index,/Direct supplier browsing; affiliate attribution not yet confirmed/);
 assert.match(files.index,/Source category/);
 for(const cat of ["museum","theme-park","zoo","fort","monument","attraction"]){
  assert.ok(files.index.includes('["'+cat+'",'),cat+" not offered");
 }
 assert.match(files.index,/No admission price, discount, live/);
 assert.match(files.index,/cachedSourceProgress\(\)/);
 assert.match(files.index,/href=\{osmPlacePath\(place\.source_id\)!\}/);
 assert.match(files.index,/robots:\{index:false,follow:true\}/);
});
test("each OSM detail offers contextual existing Klook/GYG search plus correctly labeled KKday/Tiqets",()=>{
 assert.match(files.detail,/links\.klook/);
 assert.match(files.detail,/links\.getyourguide/);
 assert.match(files.detail,/attractionTicketQueryLabel\(item\.category\)/);
 assert.match(files.detail,/ATTRACTION_TICKET_PARTNERS\.kkday\.href/);
 assert.match(files.detail,/ATTRACTION_TICKET_PARTNERS\.tiqets\.href/);
 assert.match(files.detail,/isTicketOrientedCategory\(item\.category\)&&<a href=\{ATTRACTION_TICKET_PARTNERS\.tiqets\.href\}/);
 assert.match(files.detail,/rel="sponsored noopener noreferrer"/);
 assert.match(files.detail,/rel="noopener noreferrer nofollow"/);
 assert.match(files.detail,/not an exact ticket for \{item\.name\}/);
 assert.match(files.detail,/not a confirmed ticket/);
 assert.match(files.detail,/revalidate=86400/);
 assert.match(files.osm,/marker:"417668"/);
 assert.match(files.osm,/p:"4110"/);
 assert.match(files.osm,/trs:"504342"/);
 assert.doesNotMatch(files.detail,/fetch\(|NUITEE_PRODUCTION_API_KEY|service_role|api\.kkday\.com|api\.tiqets\.com/);
});
test("no new server endpoints, rate/availability simulation or affiliate product mismatch",()=>{
 const src=files.index+files.detail+files.partners;
 assert.doesNotMatch(src,/new Date\(\).*price|Math\.random|SUPABASE_SERVICE_ROLE_KEY|verified_tickets:true|live_availability:true/);
 assert.doesNotMatch(src,/fetch\("https:\/\/api\.|setInterval\(|\/api\/tickets\/live/);
});
