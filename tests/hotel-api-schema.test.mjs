import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../src/app/api/hotels/route.ts", import.meta.url), "utf8");
test("Hotel API does not ask for missing stars column", () => {
  assert.doesNotMatch(api, /\.select\([^)]*\bstars\b/);
});
test("Unpublished legacy hotels are never returned", () => {
  assert.match(api, /\.eq\("is_public", true\)/);
});
test("Hotel catalog uses attribution without invented prices", () => {
  assert.match(api, /source_license: "ODbL-1\.0"/);
  assert.match(api, /affiliate_link: null/);
});
