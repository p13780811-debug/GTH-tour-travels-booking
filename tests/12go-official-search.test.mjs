import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("native branded bus and global train search open the approved booking gateway", () => {
  const planner = source("src/components/travel/TransportPlanner.tsx");
  assert.match(planner, /bus: \{ label: "GTH PRO Booking", url: "\/go\/transport" \}/);
  assert.match(planner, /train: \{ label: "GTH PRO Booking", url: "\/go\/transport" \}/);
  assert.match(planner, /window\.location\.assign\(provider\.url\)/);
  assert.match(planner, /mode === "bus" \|\| mode === "train"/);
  assert.match(planner, /"Search bus journeys"/);
  assert.match(planner, /"Search train journeys"/);
  assert.match(planner, /not prefilled/);
  assert.match(planner, /todayLocal/);
  assert.match(planner, /origin\.toLocaleLowerCase\(\) === destination\.toLocaleLowerCase\(\)/);
  assert.match(planner, /grid-cols-1/);
  assert.match(planner, /sm:grid-cols-2/);
  assert.match(planner, /transfer: \{ label: "Welcome Pickups", url: "https:\/\/www\.welcomepickups\.com\/" \}/);
  assert.match(planner, /"Review journey"/);
  assert.doesNotMatch(planner, /trainbusferry\.com|document\.createElement\("script"\)|TwelveGoSearchWidget|NEXT_PUBLIC_.*TOKEN/i);
});

test("GTH PRO pages show their own brand, never provider names, embeds or external booking callouts", () => {
  for (const mode of ["bus", "train"]) {
    const page = source("src/app/" + mode + "/page.tsx");
    assert.match(page, /<TransportPlanner/);
    assert.match(page, /<TransportRouteDiscovery/);
    assert.match(page, /GTH PRO /);
    assert.match(page, /url: "\/go\/transport"/);
    assert.match(page, /actionLabel: "Search available journeys"/);
    assert.match(page, /may earn a referral commission/);
    assert.doesNotMatch(page, /12Go|IRCTC|Busbud|redBus|TwelveGoSearchWidget|cdn0\.trainbusferry\.com|<iframe|<script/i);
  }
  const shared = source("src/components/travel/TravelServicePage.tsx");
  assert.match(shared, /actionLabel\?: string/);
  assert.match(shared, /partner\.actionLabel \?\? "Open official provider"/);
  const widgetSource = new URL("../src/components/travel/TwelveGoSearchWidget.tsx", import.meta.url);
  assert.throws(() => readFileSync(widgetSource, "utf8"), /ENOENT/);
});

test("global rail presentation does not imply any Indian Railways integration", () => {
  const train = source("src/app/train/page.tsx");
  assert.match(train, /Global Train & Rail Journey Planning/);
  assert.match(train, /global rail journeys — Asia & beyond/i);
  assert.match(train, /Domestic railway status and PNR services are not integrated/);
  assert.doesNotMatch(train, /Plan an Indian Railways journey|Indian Rail Journey Planning/);
});

test("brand-neutral gateway delegates to only the approved SSL-verified partner or official tracked fallback", () => {
  const alias = source("src/app/go/transport/route.ts");
  const route = source("src/app/go/12go/route.ts");
  assert.match(alias, /export \{ GET \} from "\.\.\/12go\/route"/);\n  assert.match(alias, /export const runtime = "nodejs"/);\n  assert.match(alias, /export const dynamic = "force-dynamic"/);
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

test("staging disables Vercel preview deployment", () => {
  const config = JSON.parse(source("vercel.json"));
  assert.equal(config.git.deploymentEnabled["fix/12go-native-white-label-search-20261104"], false);
});
