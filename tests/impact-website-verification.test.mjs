import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const root=read("src/app/layout.tsx");
const wrapper=read("src/components/LayoutWrapper.tsx");
test("Impact/Omio website verification exact supplied meta tag, hoisted into head by React",()=>{
  assert.ok(wrapper.includes('<meta name="impact-site-verification" {...{value:"94cbf0e7-14b4-445d-94c5-8edd0ef466a2"}} />'));
  assert.equal((wrapper.match(/name="impact-site-verification"/g)||[]).length,1);
  assert.match(root,/<LayoutWrapper>/);
  assert.doesNotMatch(root,/impact-site-verification|utt\.impactcdn\.com|impactStat\(/);
  assert.doesNotMatch(wrapper,/utt\.impactcdn\.com|impactStat\(/);
});
test("Verification change preserves active affiliate loader and core root layout",()=>{
  assert.match(root,/id="gth-travelpayouts-drive"/);
  assert.match(root,/NTA0MzQy\.js\?t=504342/);
  assert.match(root,/id="gtag-init"/);
  assert.match(root,/<Navbar\s*\/>/);
});
