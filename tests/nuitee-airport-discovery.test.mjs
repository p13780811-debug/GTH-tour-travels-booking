import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const sources = [
  ["India", "IN"],
  ["Japan", "JP"],
  ["UnitedStates", "US"],
  ["Germany", "DE"],
  ["UK", "GB"],
  ["France", "FR"],
  ["Australia", "AU"],
  ["China", "CN"],
  ["Canada", "CA"],
  ["Brazil", "BR"],
  ["Thailand", "TH"],
  ["UAE", "AE"],
  ["Indonesia", "ID"],
  ["Malaysia", "MY"],
  ["Spain", "ES"],
];

function source(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function records(suffix) {
  const file = source(`src/lib/travel/airportReference${suffix}.ts`);
  const match = file.match(/=\s*(\[[\s\S]*?\])\s+as const;/);
  assert.ok(match, `Expected a static JSON-compatible reference array in ${suffix}`);
  return JSON.parse(match[1]);
}

test("reference airport data is nonempty, valid and country-scoped", () => {
  let total = 0;
  for (const [suffix, country] of sources) {
    const rows = records(suffix);
    assert.ok(rows.length > 0, `No airport data for ${suffix}`);
    total += rows.length;
    for (const airport of rows) {
      assert.equal(airport.countryCode, country);
      assert.match(airport.code, /^[A-Z]{3}$/);
      assert.ok(airport.name?.trim());
      assert.ok(airport.city?.trim());
      assert.doesNotMatch(airport.name, /all airports/i);
      if (airport.icao) assert.match(airport.icao, /^[A-Z0-9]{4}$/);
    }
  }
  assert.ok(total >= 200, `Expected a substantial airport directory, got ${total}`);
});

test("airport explorer is additive and does not call booking or priced APIs", () => {
  const files = [
    "src/lib/travel/nuiteeAirportIndex.ts",
    "src/components/travel/AirportDiscoveryTools.tsx",
    "src/app/travel/airports/page.tsx",
    "src/app/travel/airports/[iata]/page.tsx",
  ];
  const text = files.map(source).join("\n");
  assert.doesNotMatch(text, /api\.liteapi\.travel|fetch\(\s*["']https?:|post_flights_rates|post_flights_bookings|prebookExperienceTour|createExperienceBooking|process\.env\.\w*(?:API_KEY|SECRET|TOKEN)/i);
  assert.match(source("src/app/travel/page.tsx"), /href: "\/travel\/airports"/);
  assert.match(source("src/app/sitemap.ts"), /\/travel\/airports/);
});
