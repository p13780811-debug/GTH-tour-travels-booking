import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("registry homepage invites only legitimate owners to submit photos through existing private workflow", () => {
  const registry = source("src/components/real-estate/RegistryDiscovery.tsx");
  assert.match(registry, /\/real-estate\/claim-project\?rera=/);
  assert.match(registry, /\/\^P\[0-9\]\{11\}\$\/\.test\(project\.rera_id\)/);
  assert.match(registry, /permission evidence for independent review/);
  assert.match(registry, /No photo is published automatically/);
  assert.match(registry, /href="\/real-estate\/post-property"/);
  assert.match(registry, /MahaRERA records/);
  assert.doesNotMatch(registry, /fake photo|mock inventory|guaranteed availability/i);
});

test("registry research and sale/rent submissions stay separate", () => {
  const page = source("src/app/real-estate/registry/page.tsx");
  assert.match(page, /Builder or authorized agent\? Claim your project/);
  assert.match(page, /Submit real sale \/ rental listing/);
  assert.match(page, /MahaRERA Project Registry & Worldwide Property Research/);
  assert.match(page, /not a geographic restriction on GTH PRO Real Estate/);
  assert.match(page, /district=Thane/);
  assert.match(page, /district=Mumbai%20Suburban/);
  assert.match(page, /district=Mumbai%20City/);
  assert.doesNotMatch(page, /11,747|5,661|4,988|1,098/); // Avoid stale static record counts.
  assert.match(page, /not a sale\/rent inventory/);
  assert.match(page, /No property photos or asking prices are inferred/);
});

test("travel booking conversion copy links existing hosted Nuitee without changing supplier code", () => {
  const travel = source("src/app/travel/page.tsx") + source("src/components/travel/ConnectedTravelWorkspace.tsx");
  const hotels = source("src/lib/travel/hotel-whitelabel.ts");
  const flights = source("src/components/flights/AviasalesWhiteLabel.tsx");
  const tours = source("src/app/tours/page.tsx");
  assert.match(travel, /HOTEL SEARCH & BOOKING/);
  assert.match(travel, /\/hotels\?view=booking/);
  assert.match(travel, /HOTEL_BOOKING_ORIGIN/);
  assert.match(hotels, /https:\/\/hotel\.gthproglobal\.com/);
  assert.match(flights, /wl_id=23459/);
  assert.match(tours, /TourLanding/);
});

test("tender landing becomes indexable only on publicly launched production; admin stays private", () => {
  const page = source("src/app/tender/services/page.tsx");
  const sitemap = source("src/app/sitemap.ts");
  assert.match(page, /GTH_PUBLIC_LAUNCH_ENABLED/);
  assert.match(page, /robots:\{index:publicLaunch,follow:true\}/);
  assert.match(sitemap, /"\/tender\/services"/);
  assert.doesNotMatch(sitemap, /"\/admin\/tender-services"/);
});

test("branch remains isolated from all live site deployments", () => {
  const vercel = JSON.parse(source("vercel.json"));
  assert.equal(vercel.git.deploymentEnabled["fix/tender-service-search-discovery-20261104"], false);
});
