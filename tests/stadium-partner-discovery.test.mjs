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
