import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeFares, fullFlightPartnerSearchUrl } from "../src/lib/flights/fare-search.ts";

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
  assert.match(page, /url:\s*"\/hotels"/);
  assert.match(page, /url:\s*"\/tours"/);
  assert.match(page, /url:\s*"\/guides"/);
  assert.doesNotMatch(destinations, /price:\s*["'$]/);
  assert.match(page, /aria-label="Filter flight observations"/);
});

test("all 200 supplier observations are preserved without invented fares", () => {
  const sample = Array.from({ length: 200 }, (_, i) => ({
    ...base, flight_number: String(1000 + i), price: 12000 + i,
  }));
  const result = normalizeFares({ data: sample }, search);
  assert.equal(result.length, 200);
  assert.equal(new Set(result.map((fare) => fare.id)).size, 200);
});

test("route search handoff uses exact airports, departure date and INR currency preference", () => {
  assert.equal(
    fullFlightPartnerSearchUrl("CCU", "GOI", "2026-11-15"),
    "https://www.aviasales.com/search/CCU1511GOI1?currency=inr",
  );
  assert.throws(() => fullFlightPartnerSearchUrl("CCU", "//evil.test", "2026-11-15"));
  assert.throws(() => fullFlightPartnerSearchUrl("CCU", "CCU", "2026-11-15"));
});

test("provider flight-specific deeplink is preserved only for Aviasales search paths", () => {
  const result = normalizeFares({ data: [{ ...base, link: "/CCU1511DXB1?t=source-offer" }] }, search);
  assert.equal(result.length, 1);
  assert.match(result[0].partnerUrl, /^https:\/\/www\.aviasales\.com\/CCU1511DXB1\?/);
});

test("popular image routes go directly to dated results and keep selected calendar dates", () => {
  const cards = read("src/components/flights/PopularDestinations.tsx");
  const hero = read("src/components/flights/FlightHero.tsx");
  const ui = read("src/app/flights/page.tsx");
  assert.match(cards, /depart_date: chosenDate/);
  assert.match(cards, /#flight-results/);
  assert.match(cards, /Tomorrow \(default\)/);
  assert.match(hero, /onDatesChange\?/);
  assert.match(ui, /departDate=\{draftDepartDate\} returnDate=\{draftReturnDate\}/);
  assert.match(ui, /Compare all available flights on Aviasales/);
  assert.match(ui, /currency to INR in its regional settings/);
});

test("backend pages all cached results but never claims full flight schedules", () => {
  const api = read("src/app/api/flights/route.ts");
  const ui = read("src/app/flights/page.tsx");
  assert.match(api, /url\.searchParams\.set\("limit", "200"\)/);
  assert.match(api, /url\.searchParams\.set\("page", String\(page\)\)/);
  assert.match(api, /providerRows >= 200/);
  assert.match(ui, /Load more recorded fares/);
  assert.match(ui, /observed fares, not every operating flight/);
});
