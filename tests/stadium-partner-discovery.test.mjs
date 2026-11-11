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
const discovery=load("src/lib/travel/stadium-partner-discovery.ts",{
  "./partner-search":partner,
  "./cruise-provider-search":{GETYOURGUIDE_PARTNER_ID:"DF3NBKA"},
});
const ui=read("src/app/stadiums/StadiumPartnerDiscovery.tsx");
const page=read("src/app/stadiums/page.tsx");

test("worldwide club search reuses the owner's existing Klook/Travelpayouts marker and original GYG partner",()=>{
  for(const term of ["Mumbai","New York Yankees","Manchester United","FC Barcelona","London"]){
    const result=discovery.stadiumPartnerSearchLinks(term);
    assert.ok(result,"Failed "+term);
    assert.equal(result.term,term);
    const klook=new URL(result.klook);
    assert.equal(klook.origin,"https://tp.media");
    assert.equal(klook.searchParams.get("marker"),"417668");
    assert.equal(klook.searchParams.get("trs"),"504342");
    assert.equal(klook.searchParams.get("campaign_id"),"137");
    assert.equal(klook.searchParams.get("p"),"4110");
    const supplier=new URL(klook.searchParams.get("u"));
    assert.equal(supplier.origin,"https://www.klook.com");
    assert.equal(supplier.searchParams.get("query"),term+" sports tickets");
    const gyg=new URL(result.getyourguide);
    assert.equal(gyg.origin,"https://www.getyourguide.com");
    assert.equal(gyg.pathname,"/s/");
    assert.equal(gyg.searchParams.get("q"),term+" stadium tour");
    assert.equal(gyg.searchParams.get("partner_id"),"DF3NBKA");
    assert.equal(gyg.searchParams.get("cmp"),"gthpro_stadium_partner_search");
  }
});
test("no arbitrary external redirects, HTML injection or unvalidated affiliate destinations",()=>{
  for(const input of ["", "a", "javascript:alert(1)","https://evil.example", "<script>", "A".repeat(81), {}, null, [], "abc?x=1"]){
    assert.equal(discovery.stadiumPartnerSearchLinks(input),null,JSON.stringify(input));
  }
});
test("new stadium partner UI has no paid event API, server read, cron or fake ticket feed",()=>{
  assert.match(page,/<StadiumPartnerDiscovery\/>/);
  assert.match(page,/stadiums\.flatMap\(venue=>\(venue\.products\?\?\[\]\)/);
  assert.match(page,/stadiumAffiliateHref\(product,venue\.slug\)/);
  assert.match(ui,/stadiumPartnerSearchLinks\(term\)/);
  assert.match(ui,/input id="gth-stadium-partner-query"/);
  assert.match(ui,/rel="noopener noreferrer sponsored"/);
  assert.match(ui,/A tour or museum ticket|a game admission ticket/);
  assert.match(ui,/not a live feed of every upcoming match/i);
  for(const path of ["src/lib/travel/stadium-partner-discovery.ts","src/app/stadiums/StadiumPartnerDiscovery.tsx"]){
    assert.doesNotMatch(read(path),/fetch\(|NEXT_PUBLIC_|api\.ticketmaster|Bearer |Authorization:|service_role|setInterval\(/i);
  }
  assert.equal(existsSync("src/lib/travel/stadium-live-feed.ts"),false);
  assert.equal(existsSync("src/lib/travel/stadium-event-normalize.ts"),false);
});


test("all 11 stadium detail pages gain trusted venue-specific ticket/tour searches",()=>{
  const catalog=load("src/lib/travel/stadiums.ts");
  const detail=read("src/app/stadiums/[slug]/page.tsx");
  const directory=read("src/app/stadiums/StadiumDirectory.tsx");
  assert.equal(catalog.stadiums.length,11);
  for(const venue of catalog.stadiums){
    const links=discovery.stadiumPartnerSearchLinks(venue.name);
    assert.ok(links,"No safe search handoff for "+venue.slug);
    const supplier=new URL(new URL(links.klook).searchParams.get("u"));
    assert.ok(supplier.searchParams.get("query").includes(venue.name));
    assert.equal(new URL(links.getyourguide).searchParams.get("partner_id"),"DF3NBKA");
  }
  assert.match(detail,/stadiumPartnerSearchLinks\(venue\.name\)/);
  assert.match(detail,/href=\{partnerSearch\.klook\}/);
  assert.match(detail,/href=\{partnerSearch\.getyourguide\}/);
  assert.match(detail,/rel="noopener noreferrer sponsored"/);
  assert.match(directory,/id="stadium-directory"/);
  assert.match(directory,/href=\{venue\.schedule\.url\}/);
  assert.match(directory,/Official events calendar/);
});

test("stadium event previews use only official reviewed fixtures, with time-based expiry and honest availability labels",()=>{
  const catalog=load("src/lib/travel/stadiums.ts");
  const index=read("src/app/stadiums/page.tsx");
  const events=read("src/app/stadiums/StadiumUpcomingEvents.tsx");
  assert.match(index,/export const revalidate = 3600/);
  assert.match(index,/<StadiumUpcomingEvents\/>/);
  assert.match(events,/upcomingStadiumEvents\(venue\)/);
  assert.match(events,/Official event details/);
  assert.match(events,/href=\{event\.url\}/);
  assert.match(events,/venue-local date/);
  assert.match(events,/not a worldwide live event/i);
  assert.match(events,/No future dated events/);
  assert.doesNotMatch(events,/fetch\(|supabase|Ticketmaster|setInterval\(|NEXT_PUBLIC_/);
  const seen=new Set();
  for(const venue of catalog.stadiums){
    for(const event of venue.events??[]){
      assert.match(event.starts,/^\d{4}-\d{2}-\d{2}$/);
      assert.ok(!event.ends||event.ends>=event.starts);
      assert.equal(new URL(event.url).protocol,"https:");
      assert.equal(seen.has(venue.slug+event.url),false);
      seen.add(venue.slug+event.url);
    }
  }
  assert.ok(seen.size>=6);
  assert.equal(catalog.findStadium("eden-gardens").tickets.url,
    "https://www.cricketassociationofbengal.com/notice.php");
});

test("stadium discovery is an existing affiliate handoff, not a fabricated real-time booking system",()=>{
  const files=[
    "src/app/stadiums/page.tsx",
    "src/app/stadiums/[slug]/page.tsx",
    "src/app/stadiums/StadiumUpcomingEvents.tsx",
    "src/app/stadiums/StadiumDirectory.tsx",
    "src/app/stadiums/StadiumPartnerDiscovery.tsx",
    "src/lib/travel/stadium-partner-discovery.ts",
  ];
  for(const path of files)assert.doesNotMatch(read(path),/fetch\(|supabase|service_role|api\.ticketmaster|setInterval\(/i,path);
  assert.match(read("src/app/stadiums/page.tsx"),/stadiumAffiliateHref\(product,venue\.slug\)/);
  assert.match(read("src/app/stadiums/StadiumPartnerDiscovery.tsx"),/not a live feed of every upcoming match/i);
  assert.match(read("src/app/stadiums/[slug]/page.tsx"),/providers independently confirm|Providers independently confirm/i);
});
