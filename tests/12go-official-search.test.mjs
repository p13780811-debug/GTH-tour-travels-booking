import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("official 12Go search form remains opt-in and scoped to transport pages", () => {
  const widget = source("src/components/travel/TwelveGoSearchWidget.tsx");
  assert.match(widget, /cdn0\.trainbusferry\.com\/tools\/form\/en/);
  assert.match(widget, /17380992/);
  assert.match(widget, /script\.dataset\.width = "250"/);
  assert.match(widget, /script\.dataset\.domain = "12go\.asia"/);
  assert.match(widget, /script\.dataset\.border = "1"/);
  assert.match(widget, /href="\/go\/12go"/);
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

test("12Go handoff never uses arbitrary redirect parameters, unapproved providers or unverified TLS", () => {
  const route = source("src/app/go/12go/route.ts");
  const widget = source("src/components/travel/TwelveGoSearchWidget.tsx");
  assert.match(route, /https:\/\/transport\.gthproglobal\.com\//);
  assert.match(route, /https:\/\/12go\.asia\/\?z=17380992/);
  assert.match(route, /AbortSignal\.timeout\(3000\)/);
  assert.match(route, /redirect: "manual"/);
  assert.match(route, /response\.status >= 200 && response\.status < 400/);
  assert.match(route, /NextResponse\.redirect\(target, 307\)/);
  assert.match(route, /X-Robots-Tag/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /request\.nextUrl|searchParams|get\("url"\)|NEXT_PUBLIC_|apiKey|Math\.random/i);
  assert.match(widget, /Continue to 12Go booking/);
  for (const mode of ["bus", "train"]) {
    const page = source("src/app/" + mode + "/page.tsx");
    assert.match(page, /url: "\/go\/12go"/);
    assert.match(page, /<TwelveGoSearchWidget mode=/);
  }
});

test("12Go staging branch does not enable Vercel deployment", () => {
  const config = JSON.parse(source("vercel.json"));
  assert.equal(config.git.deploymentEnabled["feat/12go-search-staging-20261104"], false);
});