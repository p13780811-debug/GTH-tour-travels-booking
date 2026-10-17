import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("src/app/hotels/page.tsx", "utf8");

test("hotel hero includes editable, accessible stay-planning controls", () => {
  for (const [name, inputType] of [
    ["Check-in date", "date"],
    ["Check-out date", "date"],
    ["Number of guests", "number"],
  ]) {
    assert.match(page, new RegExp('aria-label="' + name + '" type="' + inputType + '"'));
  }
  assert.match(page, /setCheckIn\(e\.target\.value\)/);
  assert.match(page, /setCheckOut\(e\.target\.value\)/);
  assert.match(page, /setGuests\(Number\(e\.target\.value\)\)/);
  assert.match(page, /checkOut <= checkIn/);
  assert.match(page, /setSearchValidation/);
});

test("hotel hero is compact and uses central theme tokens", () => {
  assert.match(page, /border-b border-\[var\(--border\)\] bg-\[var\(--card\)\]/);
  assert.match(page, /max-w-7xl mx-auto px-4 py-6 md:py-9/);
  assert.doesNotMatch(page, /pt-20 pb-8 md:pt-28 md:pb-12/);
  assert.match(page, /does not search live rooms/i);
});
