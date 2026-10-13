import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/app/api/hotels/route.ts", import.meta.url), "utf8");

test("public supplier projections do not assume a stars column", () => {
  assert.doesNotMatch(api, /\.select\([^)]*\bstars\b/);
  assert.match(api, /\.eq\("is_public", true\)/);
  assert.doesNotMatch(api, /select\("\*"\)/);
});
test("OSM discovery remains separate from bookable supplier inventory", () => {
  assert.match(api, /source_license: "ODbL-1\.0"/);
  assert.match(api, /affiliate_link: null/);
  assert.match(api, /supplierFailed && catalogFailed/);
  assert.match(api, /hotelPageWindow\(page, supplierVisible, catalogCount, PAGE_SIZE\)/);
});
test("hotel API validates page and protects partner redirects", () => {
  assert.match(api, /safePartnerLink/);
  assert.match(api, /Cache-Control/);
  assert.match(api, /count: "exact"/);
});
