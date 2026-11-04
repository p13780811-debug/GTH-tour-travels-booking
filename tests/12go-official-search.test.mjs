import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("GTH PRO native bus/train search hands off directly to approved 12Go gateway", () => {
  const planner = source("src/components/travel/TransportPlanner.tsx");
  assert.match(planner, /bus: \{ label: "12Go White Label", url: "\/go\/12go" \}/);
  assert.match(planner, /train: \{ label: "12Go White Label", url: "\/go\/12go" \}/);
  assert.match(planner, /window\.location\.assign\(provider\.url\)/);
  assert.match(planner, /mode === "bus" \|\| mode === "train"/);
  assert.match(planner, /"Search bus journeys"/);
  assert.match(planner, /"Search train journeys"/);
  assert.match(planner, /not transferred or prefilled/);
  assert.match(planner, /todayLocal/);
  assert.match(planner, /origin\.toLocaleLowerCase\(\) === destination\.toLocaleLowerCase\(\)/);
  assert.match(planner, /transfer: \{ label: "Welcome Pickups", url: "https:\/\/www\.welcomepickups\.com\/" \}/);
  assert.match(planner, /"Review journey"/);
  assert.doesNotMatch(planner, /trainbusferry\.com|document\.createElement\("script"\)|12GoSearchWidget|NEXT_PUBLIC_.*TOKEN/i);
  for (const mode of ["bus", "train"]) {
    const page = source("src/app/" + mode + "/page.tsx");
    assert.match(page, /<TransportPlanner/);
    assert.match(page, /<TransportRouteDiscovery/);
    assert.match(page, /url: "\/go\/12go"/);
    assert.doesNotMatch(page, /TwelveGoSearchWidget|cdn0\.trainbusferry\.com|<iframe|<script/i);
  }
});

test("rail copy keeps the worldwide ecosystem and clearly separates IRCTC", () => {
  const train = source("src/app/train/page.tsx");
  assert.match(train, /Global Train & Rail Journey Planning/);
  assert.match(train, /global rail journeys — Asia & beyond/i);
  assert.match(train, /IRCTC is not integrated with GTH PRO/);
  assert.match(train, /IRCTC — India-only official booking/);
  assert.match(train, /12Go White Label/);
  assert.doesNotMatch(train, /Plan an Indian Railways journey|Indian Rail Journey Planning/);
});

test("12Go White Label gateway only redirects to SSL-valid approved partner or tracked fallback", () => {
  const route = source("src/app/go/12go/route.ts");
  assert.match(route, /https:\/\/transport\.gthproglobal\.com\//);
  assert.match(route, /https:\/\/12go\.asia\/\?z=17380992/);
  assert.match(route, /AbortSignal\.timeout\(3000\)/);
  assert.match(route, /redirect: "manual"/);
  assert.match(route, /response\.status >= 200 && response\.status < 400/);
  assert.match(route, /NextResponse\.redirect\(target, 307\)/);
  assert.match(route, /X-Robots-Tag/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /request\.nextUrl|searchParams|get\("url"\)|NEXT_PUBLIC_|apiKey|Math\.random/i);
});

test("isolated staging branch cannot deploy previews automatically", () => {
  const config = JSON.parse(source("vercel.json"));
  assert.equal(config.git.deploymentEnabled["fix/12go-native-white-label-search-20261104"], false);
});
