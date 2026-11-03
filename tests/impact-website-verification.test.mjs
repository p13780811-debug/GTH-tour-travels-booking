import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = p => readFileSync(new URL("../"+p,import.meta.url),"utf8");
const root=read("src/app/layout.tsx");
const wrapper=read("src/components/LayoutWrapper.tsx");
const approvedCode="(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A8102593-82f8-43dd-baf2-89d6712f2a581.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');";
const expectedTag='<script id="gth-impact-stat" type="text/javascript" dangerouslySetInnerHTML={{ __html: `' + approvedCode + '` }} />';

test("Impact stat tag is an exact, single raw script in the document head and prior meta is removed",()=>{
  const begin=root.indexOf("<head>"), end=root.indexOf("</head>");
  assert.ok(begin >= 0 && end > begin);
  const head=root.slice(begin,end+7);
  assert.ok(head.includes(expectedTag),"Approved Impact script must be present in head exactly");
  assert.equal(root.split('id="gth-impact-stat"').length-1,1);
  assert.ok(head.indexOf(expectedTag) < head.indexOf('id="gth-travelpayouts-drive"'));
  assert.ok(!root.includes("impact-site-verification"));
  assert.ok(!wrapper.includes("impact-site-verification"));
  assert.ok(!wrapper.includes("utt.impactcdn.com"));
  assert.ok(!wrapper.includes("impactStat("));
});

test("Existing Travelpayouts loader, analytics and navigation stay untouched",()=>{
  for(const invariant of ['id="gth-travelpayouts-drive"','NTA0MzQy.js?t=504342','id="gtag-init"',"<Navbar />","<LayoutWrapper>"]) {
    assert.ok(root.includes(invariant), invariant);
  }
});
