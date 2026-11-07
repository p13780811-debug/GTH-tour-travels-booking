import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";

function compile(path,deps={}) {
  const source=readFileSync(path,"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX
  }}).outputText;
  const m={exports:{}};
  vm.runInNewContext(code,{
    module:m,exports:m.exports,URL,URLSearchParams,
    require:name=>{if(name in deps)return deps[name];throw Error("Unexpected module: "+name);}
  },{timeout:2000});
  return m.exports;
}
const common=compile("src/lib/travel/partner-search.ts");
const cruise=compile("src/lib/travel/cruise-provider-search.ts",{
  "@/lib/travel/partner-search":common
});
const Widget=compile("src/components/travel/GetYourGuideCruiseDiscovery.tsx",{
  "react/jsx-runtime":jsx,"lucide-react":icons,
  "@/lib/travel/cruise-provider-search":cruise,
}).default;

test("GYG cruise searches validate destinations and send fixed partner campaign",()=>{
  assert.equal(cruise.GETYOURGUIDE_PARTNER_ID,"DF3NBKA");
  const url=new URL(cruise.buildGetYourGuideCruiseDiscovery("Kolkata","sunset"));
  assert.equal(url.origin,"https://www.getyourguide.com");
  assert.equal(url.pathname,"/s/");
  assert.equal(url.searchParams.get("q"),"Kolkata sunset cruise");
  assert.equal(url.searchParams.get("partner_id"),"DF3NBKA");
  assert.equal(url.searchParams.get("cmp"),"gthpro_cruises_style_sunset");
  assert.equal(url.searchParams.get("utm_medium"),"online_publisher");
  const unicode=new URL(cruise.buildGetYourGuideCruiseDiscovery("São Paulo","harbour"));
  assert.equal(unicode.searchParams.get("q"),"São Paulo harbour cruise");
  for(const value of ["https://evil.example","Mumbai?partner_id=bad","","a".repeat(81),"..//evil"]){
    assert.equal(cruise.buildGetYourGuideCruiseDiscovery(value,"dinner"),null);
  }
  assert.equal(cruise.buildGetYourGuideCruiseDiscovery("Mumbai","__proto__"),null);
  assert.equal(cruise.buildGetYourGuideCruiseDiscovery("Mumbai","anything"),null);
});

test("Cruise-only GetYourGuide discovery renders tracked, accessible link groups",()=>{
  const html=renderToStaticMarkup(React.createElement(Widget,{destination:"Mumbai"}));
  assert.match(html,/id="getyourguide-cruises"/);
  assert.equal((html.match(/data-gyg-cruise-style=/g)||[]).length,8);
  assert.equal((html.match(/data-gyg-cruise-destination=/g)||[]).length,8);
  assert.equal((html.match(/data-gyg-widget="activities"/g)||[]).length,3);
  assert.equal((html.match(/data-gyg-number-of-items="3"/g)||[]).length,3);
  assert.equal((html.match(/data-gyg-partner-id="DF3NBKA"/g)||[]).length,3);
  for(const campaign of ["mumbai","kolkata","dubai"]){
    assert.ok(html.includes('data-gyg-cmp="gthpro_cruises_widget_'+campaign+'"'));
  }
  const affiliateHrefs=[...html.matchAll(/href="(https:\/\/www\.getyourguide\.com\/[^"]+)"/g)];
  assert.ok(affiliateHrefs.length>=15);
  for(const match of affiliateHrefs){
    const url=new URL(match[1].replaceAll("&amp;","&"));
    assert.equal(url.origin,"https://www.getyourguide.com");
    assert.equal(url.searchParams.get("partner_id"),"DF3NBKA");
    assert.match(url.searchParams.get("cmp"),/^gthpro_cruises_style_[a-z]+$/);
  }
  assert.match(html,/noopener noreferrer sponsored/);
  assert.doesNotMatch(html,/guaranteed availability|instant booking|live prices|₹[0-9]/i);
});

test("Existing cruise catalogue, Klook handoffs and site-global integrations stay intact",()=>{
  const page=readFileSync("src/app/cruises/page.tsx","utf8");
  const original=readFileSync("src/lib/travel/cruises.ts","utf8");
  const india=readFileSync("src/components/travel/IndianWaters.tsx","utf8");
  const localLayout=readFileSync("src/app/cruises/layout.tsx","utf8");
  const globalLayout=readFileSync("src/app/layout.tsx","utf8");
  assert.match(page,/GetYourGuideCruiseDiscovery/);
  assert.match(page,/<IndianWaters options=\{selectedIndia\}\/>/);
  assert.match(page,/\/go\/cruises\/\$\{item.slug\}/);
  assert.match(page,/buildCruiseProviderSearch/);
  assert.equal((original.match(/sourceUrl:"https:\/\/www\.klook\.com/g)||[]).length,7);
  assert.equal((india.match(/slug:"(?:goa-mandovi-dinner|kerala-alleppey-houseboat|mumbai-harbour|lakshadweep-cruises|kolkata-river-cruises|andaman-cruises)"/g)||[]).length,6);
  assert.match(india,/https:\/\/gyg\.me\/ZzIrHzQ9/);
  assert.equal(localLayout.split("pa.umd.production.min.js").length-1,1);
  assert.ok(!globalLayout.includes("pa.umd.production.min.js"));
  assert.ok(globalLayout.includes('id="gth-impact-stat"'));
  assert.ok(globalLayout.includes('id="gth-travelpayouts-drive"'));
});
