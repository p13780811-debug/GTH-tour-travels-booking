import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("official 12Go search form remains opt-in and scoped to transport pages", () => {
  const widget = source("src/components/travel/TwelveGoSearchWidget.tsx");
  assert.match(widget, /cdn0\.trainbusferry\.com\/tools\/form\/en/);
  assert.match(widget, /17380992/);
  assert.match(widget, /script\.dataset\.width = "100%"/);
  assert.match(widget, /script\.dataset\.domain = "12go\.asia"/);
  assert.match(widget, /Powered by/);
  assert.match(widget, /12Go system/);
  assert.match(widget, /https:\/\/12go\.asia\/\?z=17380992/);
  assert.match(widget, /Affiliate disclosure/);
  assert.match(widget, /if \(!enabled \|\| !container\) return/);
  assert.doesNotMatch(widget, /dangerouslySetInnerHTML|NEXT_PUBLIC_.*TOKEN|process\.env|document\.write|timetable\.php/i);
  for (const mode of ["bus", "train"]) {
    const file = source("src/app/" + mode + "/page.tsx");
    assert.match(file, /import TwelveGoSearchWidget/);
    assert.ok(file.includes('<TwelveGoSearchWidget mode="' + mode + '" />'));
    assert.match(file, /<TransportPlanner/);
    assert.match(file, /<TransportRouteDiscovery/);
  }
});

test("12Go staging branch does not enable Vercel deployment", () => {
  const config = JSON.parse(source("vercel.json"));
  assert.equal(config.git.deploymentEnabled["feat/12go-search-staging-20261104"], false);
});