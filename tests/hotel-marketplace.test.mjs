import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("hotel landing never fabricates nightly rates or ratings", () => {
  const page = read("src/app/hotels/page.tsx");
  assert.doesNotMatch(page, /Math\.random|generateHotels\(/);
  assert.match(page, /hotelSearchParams/);
  assert.match(page, /const hotelParams = hotelParamsFor\(1\)/);
  assert.match(page, /const hotelParams = hotelParamsFor\(nextPage\)/);
  assert.match(page, /setTotal\(/);
  assert.match(page, /View hotel details/);
});

test("city hotel page handles multi-word city slugs and only real listings", () => {
  const page = read("src/app/hotels/[slug]/page.tsx");
  assert.match(page, /citySlug\.split\("-"\)/);
  assert.match(page, /<HotelResults city=\{parsed\.city\}/);
  assert.doesNotMatch(page, /<HotelDeals|<CarRental|<BikeRental|<HotelGrid/);
  assert.match(page, /href: "\/flights"/);
  assert.match(page, /href: "\/tours"/);
});

test("legacy hotel grid and deals cannot render synthetic reviews", () => {
  const grid = read("src/components/cards/HotelGrid.tsx");
  const deals = read("src/components/hotel/HotelDeals.tsx");
  for (const source of [grid, deals]) {
    assert.doesNotMatch(source, /Trusted Reviews|Free Cancellation|4\.8|generateHotels/);
    assert.match(source, /HotelResults/);
  }
});

test("hotel API exposes only public listing attributes", () => {
  const api = read("src/app/api/hotels/route.ts");
  assert.doesNotMatch(api, /select\("\*"\)/);
  assert.match(api, /safePartnerLink/);
  assert.match(api, /Cache-Control/);
});

test("hotel results show unavailable partner links honestly", () => {
  const result = read("src/app/hotels/results/HotelResults.tsx");
  assert.match(result, /Partner booking link not available/);
  assert.match(result, /rel="noopener noreferrer sponsored"/);
});
