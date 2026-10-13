import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hotelPageWindow } from "../src/lib/travel/hotel-page-window.ts";

test("supplier and OSM page windows never skip OSM rows", () => {
  const first = hotelPageWindow(1, 25, 60);
  assert.deepEqual([first.supplierTake, first.catalogTake], [24, 0]);
  const middle = hotelPageWindow(2, 25, 60);
  assert.deepEqual([middle.supplierStart, middle.supplierTake, middle.catalogStart, middle.catalogTake], [24, 1, 0, 23]);
  const next = hotelPageWindow(3, 25, 60);
  assert.deepEqual([next.supplierTake, next.catalogStart, next.catalogTake], [0, 23, 24]);
  const last = hotelPageWindow(4, 25, 60);
  assert.deepEqual([last.catalogStart, last.hasMore], [47, false]);
});
test("catalog-only and supplier-only hotel pages work", () => {
  assert.equal(hotelPageWindow(1, 0, 0).hasMore, false);
  assert.equal(hotelPageWindow(2, 0, 50).catalogStart, 24);
  assert.equal(hotelPageWindow(3, 48, 1).catalogStart, 0);
});
test("landing page removes fake live fares and broken travel guide routes", () => {
  const mega = readFileSync(new URL("../src/app/mega-aggregator/page.tsx", import.meta.url), "utf8");
  const blog = readFileSync(new URL("../src/data/blogs.ts", import.meta.url), "utf8");
  const policy = readFileSync(new URL("../src/app/insurance/page.tsx", import.meta.url), "utf8");
  for (const slug of ["research-a-new-destination", "hotel-booking-checklist", "how-to-compare-flight-fares"]) {
    assert.match(mega, new RegExp('href="/blog/' + slug + '"'));
    assert.match(blog, new RegExp('slug: "' + slug + '"'));
  }
  assert.doesNotMatch(mega, /LIVE DEALS FROM|href="\/blog\/goa-travel-guide"/);
  assert.match(mega, /link: "\/insurance"/);
  assert.match(policy, /does not underwrite, sell or issue insurance policies/);
  assert.match(mega, /link: "https:\/\/www\.trip\.com\/"/);
  assert.match(mega, /GTHNetwork partners=\{partners\} discoveryOnly/);
  const network = readFileSync(new URL("../src/components/sections/GTHNetwork.tsx", import.meta.url), "utf8");
  assert.match(network, /discoveryOnly \? "Explore International Travel Providers"/);
  assert.match(network, /rel="noopener noreferrer sponsored"/);
});
