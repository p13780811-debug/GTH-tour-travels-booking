import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("only the observed TPWL CSS Modules bundle is lowered to Tailwind's existing base layer",()=>{
  const s=read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(s, /function lowerPriorityForSupplierBundle/);
  assert.match(s, /node instanceof HTMLStyleElement/);
  assert.match(s, /css\.length < 50_000/);
  assert.match(s, /\.Modal-module__root___/);
  assert.match(s, /node\.dataset\.gthTpwlLayered = "base"/);
  assert.match(s, /node\.textContent = "@layer base \{" \+ css \+ "\}"/);
  assert.match(s, /record\.target instanceof HTMLStyleElement/);
  assert.match(s, /lowerPriorityForSupplierBundle\(node\)/);
  assert.doesNotMatch(s, /document\.head\.replaceChildren|document\.body\.innerHTML/);
});

test("the original host CSS, navbar, and whole-site typography are not edited or replaced",()=>{
  const s=read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(s, /originalHeadStyles/);
  assert.match(s, /!isNextAppStylesheet\(asset\)/);
  assert.match(s, /document\.head\.appendChild\(script\)/);
  assert.match(s, /id="tpwl-search"/);
  assert.match(s, /id="tpwl-tickets"/);
  assert.match(s, /setStatus\("ready"\)/);
  assert.match(s, /window\.setInterval\(reconcileStatus, 750\)/);
  assert.match(s, /if \(hasProviderContent\(\)\)/);
  assert.match(s, /else load\(FALLBACK_SCRIPT, false\)/);
  assert.doesNotMatch(s, /<iframe|srcDoc=|allow-same-origin/);
});
