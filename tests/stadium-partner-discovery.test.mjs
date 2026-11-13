import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(path,"utf8");
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
const catalog=load("src/lib/travel/stadiums.ts");
const discovery=load("src/lib/travel/stadium-partner-discovery.ts",{
 "./partner-search":partner,"./stadiums":catalog,
});
const intent=load("src/lib/travel/stadium-intent.ts",{"./stadiums":catalog});
const ui=read("src/app/stadiums/StadiumPartnerDiscovery.tsx");
const page=read("src/app/stadiums/page.tsx");
const detail=read("src/app/stadiums/[slug]/page.tsx");

test("all 11 reviewed stadiums resolve to specific, source-attributed venue guides",()=>{
 assert.equal(catalog.stadiums.length,11);
 for(const venue of catalog.stadiums){
  const link=discovery.stadiumPartnerSearchLinks(venue.name);
  assert.ok(link,"Missing reviewed guide for "+venue.slug);
  assert.equal(link.slug,venue.slug);
  assert.equal(link.city,venue.city);
  assert.equal(link.country,venue.country);
  assert.equal(link.reviewedProducts,venue.products?.length||0);
  assert.equal(new URL(link.officialUrl).protocol,"https:");
  assert.equal(intent.reviewedStadiumGuideHref(venue.name+" stadium tour"),"/stadiums/"+venue.slug);
 }
 assert.equal(discovery.stadiumPartnerSearchLinks("Kolkata").slug,"eden-gardens");
 const cityMatches=discovery.reviewedStadiumMatches("London");
 assert.ok(cityMatches.some(m=>m.slug==="wembley-stadium"));
});
test("Eden Gardens is Kolkata, never an unrelated Eden Australia supplier result",()=>{
 const link=discovery.stadiumPartnerSearchLinks("Eden Gardens stadium tour");
 assert.equal(link.slug,"eden-gardens");
 assert.equal(link.name,"Eden Gardens");
 assert.equal(link.city,"Kolkata");
 assert.equal(link.country,"India");
 assert.equal(link.reviewedProducts,0);
 assert.equal(link.officialUrl,"https://www.cricketassociationofbengal.com/notice.php");
 assert.equal(intent.reviewedStadiumGuideHref("Eden Gardens stadium tour"),"/stadiums/eden-gardens");
 assert.equal(intent.reviewedStadiumGuideHref("Eden beach kayak"),null);
 assert.equal(discovery.reviewedStadiumMatches("Eden").length,0,"Ambiguous single word must not claim stadium identity");
});
test("input validation disallows open redirects or arbitrary trusted source URLs",()=>{
 for(const input of ["","a","javascript:alert(1)","https://evil.example","<script>","A".repeat(81),{},null,[],"abc?x=1"]){
  assert.equal(discovery.stadiumPartnerSearchLinks(input),null,String(input));
  assert.equal(discovery.reviewedStadiumMatches(input).length,0);
 }
 const safe=discovery.reviewedStadiumMatches("Melbourne");
 assert.ok(safe.some(x=>x.slug==="melbourne-cricket-ground"));
});
test("no unsafe generic Klook/GetYourGuide stadium searches; exact reviewed catalog still handled",()=>{
 assert.match(page,/<StadiumPartnerDiscovery\/>/);
 assert.match(page,/stadiums\.flatMap\(venue=>\(venue\.products\?\?\[\]\)/);
 assert.match(page,/stadiumAffiliateHref\(product,venue\.slug\)/);
 assert.match(ui,/reviewedStadiumMatches\(term\)/);
 assert.match(ui,/gth-stadium-partner-query/);
 assert.match(ui,/venue\.officialUrl/);
 assert.match(ui,/venue\.reviewedProducts/);
 assert.match(ui,/No matching source-reviewed stadium/);
 assert.match(ui,/not a live feed of every upcoming match/i);
 assert.doesNotMatch(ui,/href=\{links\.(?:klook|getyourguide)\}/);
 assert.doesNotMatch(detail,/partnerSearch\.(?:klook|getyourguide)/);
 assert.match(detail,/partnerSearch\.officialUrl/);
 assert.match(detail,/stadiumAffiliateHref\(product, venue\.slug\)/);
 assert.match(detail,/href=\{product\.href\}/);
 assert.match(detail,/No exact stadium tour from an approved supplier/);
 for(const path of ["src/lib/travel/stadium-partner-discovery.ts","src/app/stadiums/StadiumPartnerDiscovery.tsx"]){
  assert.doesNotMatch(read(path),/fetch\(|NEXT_PUBLIC_|api\.ticketmaster|Bearer |Authorization:|service_role|setInterval\(/i);
 }
 assert.equal(existsSync("src/lib/travel/stadium-live-feed.ts"),false);
});
test("official match calendar remains distinct from paid match admission or vendor tour",()=>{
 const eden=catalog.findStadium("eden-gardens");
 assert.equal(eden.products,undefined);
 assert.equal(eden.tickets.url,"https://www.cricketassociationofbengal.com/notice.php");
 const mcg=catalog.findStadium("melbourne-cricket-ground");
 assert.equal(mcg.products[0].provider,"getyourguide");
 assert.equal(mcg.products[0].kind,"Venue experience");
 assert.equal(new URL(mcg.products[0].url).pathname,"/melbourne-l202/melbourne-melbourne-cricket-ground-mcg-guided-tour-t115996/");
});
