import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=readFileSync(new URL("../src/app/layout.tsx",import.meta.url),"utf8");
test("Omio/Impact website ownership proof uses exact provided meta name and value in head",()=>{
  const head=root.match(/<head>([\s\S]*?)<\/head>/)?.[1]??"";
  assert.match(head,/<meta name="impact-site-verification" value="94cbf0e7-14b4-445d-94c5-8edd0ef466a2"\s*\/>/);
  assert.equal((root.match(/name="impact-site-verification"/g)||[]).length,1);
  assert.doesNotMatch(root,/utt\.impactcdn\.com|impactStat\(/);
});
test("Existing Travelpayouts script, GA and core layout are not altered",()=>{
  assert.match(root,/id="gth-travelpayouts-drive"/);
  assert.match(root,/NTA0MzQy\.js\?t=504342/);
  assert.match(root,/id="gtag-init"/);
  assert.match(root,/<Navbar\s*\/>/);
  assert.match(root,/<LayoutWrapper>/);
});
