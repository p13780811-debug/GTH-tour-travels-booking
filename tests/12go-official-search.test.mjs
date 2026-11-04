import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("single approved search widget is the sole journey input for bus/train", () => {
  const widget = source("src/components/travel/GTHTransportSearchWidget.tsx");
  assert.match(widget, /https:\/\/cdn0\.trainbusferry\.com\/tools\/form\/en\/\?id=17380992&domain=12go\.asia/);
  assert.match(widget, /script\.dataset\.one2go = AFFILIATE_ID/);
  assert.match(widget, /script\.dataset\.domain = "12go\.asia"/);
  assert.match(widget, /script\.dataset\.width = String\(width\)/);
  assert.match(widget, /script\.dataset\.height = String\(height\)/);
  assert.match(widget, /getBoundingClientRect\(\)\.width/);
  assert.match(widget, /ResizeObserver/);
  assert.match(widget, /if \(width < 640\)/);
  assert.match(widget, /if \(width < 1024\)/);
  assert.match(widget, /host\.contains\(document\.activeElement\)/);
  assert.match(widget, /className="mt-4 w-full min-w-0 max-w-full overflow-x-auto/);
  assert.match(widget, /className="gth-glass mb-10 w-full min-w-0/);
  assert.match(widget, /role="region"/);
  assert.match(widget, /Loading booking search/);
  assert.match(widget, /script\.onerror/);
  assert.match(widget, /href="\/go\/transport"/);
  assert.doesNotMatch(widget, /dataset\.width = "250"|dangerouslySetInnerHTML|NEXT_PUBLIC_.*SECRET|fakeResults|Math\.random/);
  for (const mode of ["bus", "train"]) {
    const page = source("src/app/" + mode + "/page.tsx");
    assert.match(page, /GTHTransportSearchWidget/);
    assert.ok(page.includes('<GTHTransportSearchWidget mode="' + mode + '" />'));
    assert.match(page, /<TransportRouteDiscovery/);
    assert.match(page, /searchFirstLayout/);
    assert.match(page, /partners=\{\[\]\}/);
    assert.doesNotMatch(page, /TransportPlanner|TwelveGoSearchWidget|verifiedRouteValue|<iframe|<script|url: "\/go\/transport"/);
  }
});

test("route suggestions scroll to the only search form and do not promise prefill", () => {
  const routes = source("src/components/travel/TransportRouteDiscovery.tsx");
  assert.match(routes, /href="#journey-search"/);
  assert.match(routes, /Search route/);
  assert.match(routes, /booking form above to search a route once/);
  assert.doesNotMatch(routes, /encodeURIComponent\(route\.from\)|encodeURIComponent\(route\.to\)|#journey-planner/);
});

test("mobile and desktop share a full-width GTH layout without changing flights or transfers", () => {
  const flight = source("src/app/flights/page.tsx");
  const flightWidget = source("src/components/flights/AviasalesWhiteLabel.tsx");
  const shell = source("src/components/travel/TravelServicePage.tsx");
  const widget = source("src/components/travel/GTHTransportSearchWidget.tsx");
  assert.match(flight, /mx-auto w-full max-w-7xl pb-16 pt-2 sm:pt-9/);
  assert.match(flightWidget, /w-full min-w-0 scroll-mt-24/);
  assert.match(shell, /searchFirstLayout\?: boolean/);
  assert.match(shell, /searchFirstLayout = false/);
  assert.match(shell, /max-w-7xl min-w-0 px-4 pb-16 pt-2 sm:px-6 sm:pt-9/);
  assert.match(shell, /!searchFirstLayout && <aside/);
  assert.match(shell, /partners\.length/);
  assert.match(shell, /!searchFirstLayout \?/);
  assert.match(widget, /p-2 sm:p-6/);
  assert.match(widget, /sizeFor\(width\)/);
  assert.match(widget, /category: "desktop"/);
  assert.match(widget, /category: "mobile"/);
  const transfers = source("src/app/transfers/page.tsx");
  const planner = source("src/components/travel/TransportPlanner.tsx");
  assert.doesNotMatch(transfers, /searchFirstLayout|GTHTransportSearchWidget/);
  assert.match(planner, /transfer: \{ label: "Welcome Pickups", url: "https:\/\/www\.welcomepickups\.com\/" \}/);
  assert.match(planner, /Journey summary — not booked/);
});

test("worldwide rail copy does not claim an official domestic railway booking engine", () => {
  const train = source("src/app/train/page.tsx");
  assert.match(train, /Global Train & Rail Journey Planning/);
  assert.match(train, /Explore global rail journeys — Asia & beyond/);
  assert.match(train, /official railway PNR services are not integrated/);
  assert.doesNotMatch(train, /Indian Rail Journey Planning|12Go White Label|IRCTC|Busbud|redBus/);
});

test("approved booking fallback stays fixed-target and unchanged", () => {
  const route = source("src/app/go/12go/route.ts");
  const alias = source("src/app/go/transport/route.ts");
  assert.match(route, /https:\/\/transport\.gthproglobal\.com\//);
  assert.match(route, /https:\/\/12go\.asia\/\?z=17380992/);
  assert.match(route, /AbortSignal\.timeout\(3000\)/);
  assert.match(route, /redirect: "manual"/);
  assert.match(route, /X-Robots-Tag/);
  assert.match(route, /no-store/);
  assert.match(alias, /export \{ GET, runtime, dynamic \} from "\.\.\/12go\/route"/);
  assert.doesNotMatch(route, /request\.nextUrl|searchParams|get\("url"\)|NEXT_PUBLIC_|apiKey|Math\.random/i);
});

test("staging branch cannot trigger a preview deploy", () => {
  const config = JSON.parse(source("vercel.json"));
  assert.equal(config.git.deploymentEnabled["fix/12go-single-responsive-search-20261105"], false);
});
