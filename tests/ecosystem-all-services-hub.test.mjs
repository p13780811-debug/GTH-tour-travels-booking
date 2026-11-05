import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (file) => readFileSync(resolve(root, file), "utf8");
const page = read("src/app/mega-aggregator/page.tsx");
const hub = read("src/app/mega-aggregator/EcosystemHub.tsx");

test("all-services experience is scoped to the existing ecosystem page", () => {
  assert.match(page, /import EcosystemHub from "\.\/EcosystemHub"/);
  assert.match(page, /<EcosystemHub \/>/);
  assert.match(page, /<HeroSlider \/>/);
  assert.match(page, /<EcosystemPillars \/>/);
  assert.match(page, /<HotelQuadSection/);
  assert.match(page, /<FeaturedDestinationsSlider/);
  assert.match(page, /<GTHNetwork/);
  assert.match(page, /import HeroSearch from/);
  assert.match(page, /id="travel-services"/);
  assert.match(page, /id="insights"/);
  assert.match(page, /id="providers"/);
});

test("mobile service tiles and interactive pillar filters remain responsive and keyboard accessible", () => {
  assert.match(hub, /"use client"/);
  assert.match(hub, /useState<Selection>\("all"\)/);
  assert.match(hub, /onClick=\{\(\) => setActive\(filter\.key\)\}/);
  assert.match(hub, /aria-pressed=\{active === filter\.key\}/);
  assert.match(hub, /grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8/);
  assert.match(hub, /min-w-0/);
  assert.match(hub, /focus-visible:outline/);
  assert.match(hub, /overflow-x-auto/);
  assert.match(hub, /href=\{service\.href\}/);
  assert.match(hub, /gth-btn-gold/);
  assert.match(hub, /var\(--bg\)/);
  assert.match(hub, /var\(--card\)/);
  assert.match(hub, /var\(--gold\)/);
});

test("travel, worldwide property, tender and business links cover actual existing page routes", () => {
  const serviceChunk = hub.split("const services = [")[1]?.split("] as const;")[0] || "";
  const routePaths = [...serviceChunk.matchAll(/href: "(\/[^"]+)"/g)].map(x => x[1]);
  assert.ok(routePaths.length >= 20, "Ecosystem tiles should cover all major live site categories");
  const groups = [
    "/flights", "/hotels", "/tours", "/activities", "/transfers",
    "/cars", "/insurance", "/destinations", "/guides", "/blog",
    "/bus", "/train", "/ferry",
    "/real-estate", "/real-estate/registry", "/real-estate/tools",
    "/real-estate/post-property", "/real-estate/claim-project",
    "/tender", "/tender/services", "/partners", "/contact",
  ];
  for (const route of groups) assert.ok(routePaths.includes(route), "Missing major destination " + route);
  for (const route of routePaths) {
    assert.ok(route.startsWith("/") && !route.includes("//") && !route.includes("#"));
    assert.ok(existsSync(resolve(root, "src/app" + route + "/page.tsx")), "No implemented page for " + route);
  }
});

test("highlight cards contain legitimate page entries, not invented offers or inventory", () => {
  assert.match(hub, /Featured services and discovery/);
  assert.match(hub, /Explore live pages, not sample discounts/);
  assert.match(hub, /worldwide scope/);
  assert.match(hub, /currently available Maharashtra projects/);
  assert.match(hub, /Request tender assistance/);
  assert.doesNotMatch(hub, /flat \d+% off|₹\d+ OFF|guaranteed fares|guaranteed bookings|fake deals/i);
  for (const path of ["flights.jpg", "hotels.jpg", "tours.jpg"]) {
    assert.ok(existsSync(resolve(root, "public/images/mega/" + path)), "Missing real bundled image asset " + path);
  }
});

test("expandable useful links provide all three ecosystem pillars and known global destinations", () => {
  assert.match(hub, /<details/);
  assert.match(hub, /<summary/);
  assert.match(hub, /aria-label=\{group\.heading\}/);
  assert.match(hub, /Popular destinations in India/);
  assert.match(hub, /Popular international destinations/);
  assert.match(hub, /Global real estate/);
  assert.match(hub, /Tenders and procurement/);
  assert.match(hub, /Bus, train, ferry and transfers/);
  assert.match(hub, /About, partners and support/);
  assert.match(hub, /Full inventories, registration research and live opportunities remain on their own search pages/);
});
