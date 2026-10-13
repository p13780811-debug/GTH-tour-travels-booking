import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/travelpayouts.ts", import.meta.url), "utf8");

test("hotel lookup accepts legitimate international city names", () => {
  const match = source.match(/if \(!\/(\^\[[^\n]+?\]\{2,80\}\$)\/u\.test\(query\)\)/);
  assert.ok(match, "Hotel lookup destination validator must remain present");

  const validator = new RegExp(match[1], "u");
  for (const city of ["Mumbai", "Paris", "New Delhi", "São Paulo", "Kolkata", "Évry"]) {
    assert.equal(validator.test(city), true, `Expected valid city: ${city}`);
  }

  for (const city of ["", "A", "Mumbai1", "New_York", "/etc/passwd", "*", "x".repeat(81)]) {
    assert.equal(validator.test(city), false, `Expected invalid city: ${city}`);
  }
});
