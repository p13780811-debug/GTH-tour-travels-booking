import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const page = readFileSync("src/app/hotels/results/page.tsx", "utf8");
const results = readFileSync("src/app/hotels/results/HotelResults.tsx", "utf8");
const builder = readFileSync("src/lib/travel/hotel-search-params.ts", "utf8");

test("dedicated hotel results route reads full search scope", () => {
  for (const key of ["city", "destination", "name", "country", "category", "sort", "source"]) {
    assert.match(page, new RegExp("params\\." + key + "\\b"), key + " must come from URL");
    assert.match(page, new RegExp("\\b" + key + "\\b"));
  }
  assert.match(page, /<HotelResults scope=\{\{/);
  assert.match(page, /Boolean\(city \|\| destination \|\| name \|\| country \|\| category\)/);
  assert.match(page, /index: false/);
});

test("first page and next page use the same canonical query builder", () => {
  assert.match(results, /hotelSearchParams\(\{city,destination,name,country,category,sort,source\},n\)/);
  assert.match(results, /fetch\(query\(1\)/);
  assert.match(results, /fetch\(query\(page\+1\)/);
  assert.match(results, /\[city,destination,name,country,category,sort,source\]/);
  assert.match(builder, /if\(scope\.country\)params\.set\("country",scope\.country\)/);
  assert.match(builder, /if\(scope\.category\)params\.set\("category",scope\.category\)/);
  assert.match(builder, /if\(scope\.name\)params\.set\("name",scope\.name\)/);
});
