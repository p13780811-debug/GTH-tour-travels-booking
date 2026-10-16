import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeFares } from "../src/lib/flights/fare-search.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const search = { origin: "CCU", destination: "DXB", departDate: "2026-11-15", returnDate: null };
const base = {
  origin: "CCU", destination: "DXB", airline: "EK", flight_number: "571",
  price: 12345, departure_at: "2026-11-15T09:00:00+05:30", transfers: 0,
  duration_to: 300, link: "/search/CCU1511DXB1?x=sample",
};

test("normalizes only real matching fare observations", () => {
  const result = normalizeFares({ data: [
    base,
    { ...base, price: -50 },
    { ...base, departure_at: "2026-11-16T09:00:00+05:30" },
    { ...base, origin: "BOM" },
    base,
    { ...base, flight_number: "572", price: 14100, transfers: 1 },
  ] }, search);
  assert.equal(result.length, 2);
  assert.equal(result[0].price, 12345);
  assert.equal(result[0].currency, "INR");
  assert.equal(result[0].transfers, 0);
  assert.equal(result[1].price, 14100);
});

test("rejects malicious or cross-domain partner links", () => {
  const variants = ["//evil.test/search/x", "https://evil.test/search/x", "/search/\\evil.test"];
  for (const link of variants) {
    const results = normalizeFares({ data: [{ ...base, link }] }, search);
    assert.equal(results.length, 1);
    assert.ok(results[0].partnerUrl.startsWith("https://www.aviasales.com/search"));
  }
});

test("round-trip fare observations must match return date", () => {
  const result = normalizeFares({ data: [
    { ...base, return_at: "2026-11-20T20:10:00+04:00" },
    { ...base, price: 6000, return_at: "2026-11-21T20:10:00+04:00" },
  ] }, { ...search, returnDate: "2026-11-20" });
  assert.equal(result.length, 1);
  assert.equal(result[0].returnAt?.slice(0, 10), "2026-11-20");
});

test("does not invent prices when the provider response is invalid", () => {
  assert.deepEqual(normalizeFares({ error: "unavailable" }, search), []);
  assert.deepEqual(normalizeFares({ data: [{ ...base, price: null }] }, search), []);
});

test("flight API validates dates, limits data fields and protects API token", () => {
  const route = read("src/app/api/flights/route.ts");
  assert.match(route, /cleanDate\(params.get\("depart_date"\)\)/);
  assert.match(route, /enforceRateLimit\(req, "flights"\)/);
  assert.match(route, /X-Access-Token/);
  assert.doesNotMatch(route, /searchParams\.set\("token"/);
  assert.match(route, /cached_observations/);
});

test("flight page keeps travel sections connected without invented prices", () => {
  const page = read("src/app/flights/page.tsx");
  const destinations = read("src/data/flight/destinations.ts");
  assert.match(page, /href: "\/hotels"/);
  assert.match(page, /href: "\/tours"/);
  assert.match(page, /<AviasalesWhiteLabel isResultsView=\{isResultsView\} \/>/);
  assert.match(page, /<FlightJourneyServices \/>/);
  assert.doesNotMatch(destinations, /price:\s*["'$]/);
  assert.doesNotMatch(page, /Filter flight observations|No cached fare observations/);
});
