import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=p=>readFileSync(p,"utf8");
function load(path,requires={}){
 const output=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};
 vm.runInNewContext(output,{module:mod,exports:mod.exports,URL,URLSearchParams,require:ref=>{
  assert.ok(ref in requires,ref+" unexpected");
  return requires[ref];
 }});
 return mod.exports;
}
const partner=load("src/lib/travel/partner-search.ts");
const venues=load("src/lib/travel/stadiums.ts");
const affiliates=load("src/lib/travel/stadium-affiliates.ts",{
 "./partner-search":partner,
 "./cruise-provider-search":{GETYOURGUIDE_PARTNER_ID:"DF3NBKA"},
});
const discovery=load("src/lib/travel/stadium-partner-discovery.ts",{
 "./partner-search":partner,"./stadiums":venues,"./stadium-affiliates":affiliates,
});
const ui=read("src/app/stadiums/StadiumPartnerDiscovery.tsx");
const page=read("src/app/stadiums/page.tsx");
const detail=read("src/app/stadiums/[slug]/page.tsx");

test("exact reviewed partner products use existing affiliate IDs and real product routes",()=>{
 for(const [query,venue,kind] of [
  ["London","wembley-stadium","klook"],
  ["New York Yankees","yankee-stadium","klook"],
  ["Melbourne","melbourne-cricket-ground","getyourguide"],
 ]){
  const result=discovery.stadiumPartnerSearchLinks(query);
  assert.ok(result,query);
  assert.equal(result.venueSlug,venue);
  const url=new URL(result[kind]);
  if(kind==="klook"){
   assert.equal(url.origin,"https://tp.media");
   for(const [key,value] of Object.entries({marker:"417668",trs:"504342",campaign_id:"137",p:"4110"}))assert.equal(url.searchParams.get(key),value);
   const origin=new URL(url.searchParams.get("u"));
   assert.equal(origin.origin,"https://www.klook.com");
   assert.ok(origin.pathname.startsWith("/activity/")||origin.pathname.includes("/activity/"));
   assert.equal(origin.pathname.includes("/search/"),false);
  }else{
   assert.equal(url.origin,"https://www.getyourguide.com");
   assert.notEqual(url.pathname,"/s/");
   assert.equal(url.searchParams.get("partner_id"),"DF3NBKA");
   assert.match(url.searchParams.get("cmp"),/^gth_stadium_/);
  }
 }
});
test("Eden Gardens Kolkata and all unreviewed stadiums never redirect to unrelated Eden, Australia",()=>{
 for(const input of ["Eden Gardens","Eden","Eden Gardens stadium tour","Kolkata",
 "Mumbai","Wankhede Stadium","Old Trafford","Manchester United","FC Barcelona","Spotify Camp Nou"]){
  assert.equal(discovery.stadiumPartnerSearchLinks(input),null,"Must not invent venue offer: "+input);
 }
 assert.ok(discovery.matchReviewedStadiums("Eden Gardens stadium tour").some(v=>v.slug==="eden-gardens"));
 assert.ok(discovery.matchReviewedStadiums("Kolkata").some(v=>v.slug==="eden-gardens"));
 assert.ok(!discovery.matchReviewedStadiums("Eden Gardens stadium tour").some(v=>v.city==="Eden"));
 assert.equal(venues.findStadium("eden-gardens").tickets.url,"https://www.cricketassociationofbengal.com/notice.php");
 assert.match(detail,/No verified partner stadium tour listed/);
 assert.match(detail,/Generic supplier searches can match unrelated/);
 assert.match(ui,/No exact reviewed partner stadium product/);
 assert.match(ui,/\/stadiums\/eden-gardens/);
});
test("discovery does not generate generic provider search pages or claim live tickets",()=>{
 assert.match(page,/<StadiumPartnerDiscovery\/>/);
 assert.match(ui,/matchReviewedStadiums\(term\)/);
 assert.match(ui,/stadiumPartnerSearchLinks\(term\)/);
 assert.match(ui,/input id="gth-stadium-partner-query"/);
 assert.match(ui,/rel="noopener noreferrer sponsored"/);
 assert.match(ui,/not presented as stadium tours or match tickets/i);
 assert.match(detail,/stadiumPartnerSearchLinks\(venue\.name\)/);
 assert.match(detail,/partnerSearch\.klook&&/);
 assert.match(detail,/partnerSearch\.getyourguide&&/);
 assert.doesNotMatch(read("src/lib/travel/stadium-partner-discovery.ts"),/getyourguide\.com\/s\/|klook\.com\/en-IN\/search\/result\//);
 for(const path of ["src/lib/travel/stadium-partner-discovery.ts","src/app/stadiums/StadiumPartnerDiscovery.tsx"]){
  assert.doesNotMatch(read(path),/fetch\(|NEXT_PUBLIC_|api\.ticketmaster|Bearer |Authorization:|service_role|setInterval\(/i);
 }
 for(const input of ["","a","javascript:alert(1)","https://evil.example","<script>","A".repeat(81),{},null,[],"abc?x=1"]){
  assert.equal(discovery.stadiumPartnerSearchLinks(input),null);
 }
 assert.equal(existsSync("src/lib/travel/stadium-live-feed.ts"),false);
});
test("all venues retain direct official sources; exact products are validated before linking",()=>{
 assert.equal(venues.stadiums.length,11);
 for(const venue of venues.stadiums){
  assert.equal(new URL(venue.schedule.url).protocol,"https:");
  assert.equal(venues.findStadium(venue.slug),venue);
  const offers=(venue.products||[]).map(p=>affiliates.stadiumAffiliateHref(p,venue.slug)).filter(Boolean);
  const found=discovery.stadiumPartnerSearchLinks(venue.name);
  if(offers.length){
   assert.ok(found,venue.slug+" reviewed product missing");
   assert.ok(offers.includes(found.klook||found.getyourguide));
  }else assert.equal(found,null,venue.slug+" must not have fabricated provider product");
 }
 assert.match(detail,/href=\{venue\.schedule\.url\}/);
 assert.match(detail,/href=\{venue\.tickets\.url\}/);
 assert.match(detail,/href=\{event\.url\}/);
});
test("official event previews still avoid fake inventory and unauthorized data sources",()=>{
 const events=read("src/app/stadiums/StadiumUpcomingEvents.tsx");
 assert.match(page,/stadiums\.flatMap\(venue=>\(venue\.products\?\?\[\]\)/);
 assert.match(events,/upcomingStadiumEvents\(venue\)/);
 assert.match(events,/Official event details/);
 assert.match(events,/not a worldwide live event/i);
 const files=["src/lib/travel/stadium-partner-discovery.ts","src/lib/travel/stadium-affiliates.ts","src/app/stadiums/StadiumPartnerDiscovery.tsx","src/app/stadiums/[slug]/page.tsx"];
 for(const path of files)assert.doesNotMatch(read(path),/fetch\(|supabase|service_role|setInterval\(/i,path);
});
