import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("real Travelpayouts White Label Web 23459 is the Flights primary UI", () => {
  const page = read("src/app/flights/page.tsx");
  const widget = read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(page, /<AviasalesWhiteLabel isResultsView=\{isResultsView\} \/>/);
  assert.match(widget, /wl_web\/main\.js\?wl_id=23459/);
  assert.doesNotMatch(widget, /srcDoc=|WL_FRAME_ROUTE|<iframe/);
  assert.match(widget, /id="tpwl-search"/);
  assert.match(widget, /id="tpwl-tickets"/);
  assert.match(widget, /script\.type = "module"/);
  assert.match(widget, /script\.onerror/);
  assert.match(widget, /document\.head\.appendChild\(script\)/);
  assert.match(widget, /data-gth-white-label/);
  assert.doesNotMatch(page, /fetch\(\`\/api\/flights\/search|FlightSearchResponse|No cached fare observations|observed fares/i);
  assert.doesNotMatch(widget, /dangerouslySetInnerHTML|eval\(|document\.write|NEXT_PUBLIC_.*SECRET/);
});

test("flight page includes complete airport journey sections without touching other modules", () => {
  const page = read("src/app/flights/page.tsx");
  const services = read("src/components/flights/FlightJourneyServices.tsx");
  const categories = read("src/lib/flights/service-categories.ts");
  for (const section of ["Flight protection", "Airport transfers", "Car rentals", "Airport essentials", "At destination"]) {
    assert.ok(categories.includes('group: "' + section + '"'), section);
  }
  const navigation = read("src/components/travel/TravelSectionNav.tsx");
  assert.match(page, /<TravelSectionNav\s*\/>/);
  for (const route of ["/transfers", "/cars", "/insurance", "/hotels", "/tours", "/destinations"]) {
    assert.ok(new RegExp('href:\\s*"' + route + '"').test(navigation) || services.includes('href="' + route + '"'), route);
  }
  assert.match(services, /snap-x snap-mandatory/);
  assert.match(services, /rel="noopener noreferrer sponsored"/);
  assert.match(page, /<PopularDestinations/);
});

test("publisher links are allowlisted, never built from visitor URLs", () => {
  const programs = read("src/lib/flights/partners.ts");
  const endpoint = read("src/app/flights/out/[slug]/route.ts");
  for (const id of ["aviasales", "airhelp", "compensair", "ekta", "yesim", "kiwitaxi",
    "intui", "welcome", "gettransfer", "qeeq", "localrent", "radical",
    "klook", "wegotrip", "gocity", "kkday", "tiqets"]) {
    assert.match(programs, new RegExp('slug: "' + id + '"'));
  }
  for (const affiliate of [
    "https://aviasales.tpo.lv/hqP8zh9u", "https://airhelp.tpo.lv/W9baN8JY",
    "https://compensair.tpo.lv/s1kibgeh", "https://ektatraveling.tpo.lv/zRNsrOPf",
    "https://yesim.tpo.lv/yZBVdtqT", "https://tpo.lv/GFuzmgYk",
    "https://gettransfer.tpo.lv/jpv6nsqO", "https://radicalstorage.tpo.lv/iDuI1UD0",
    "https://klook.tpo.lv/IKb6eSUe", "https://wegotrip.tpo.lv/ZQjE9yR2",
    "https://gocity.tpo.lv/NdfDWRGS", "https://kkday.tpo.lv/ytfvDLam",
  ]) {
    assert.ok(programs.includes(affiliate), affiliate);
  }
  assert.match(endpoint, /findFlightPartner\(slug\)/);
  assert.match(endpoint, /Cache-Control/);
  assert.match(endpoint, /target\.protocol !== "https:"/);
  assert.doesNotMatch(endpoint, /searchParams\.get\(["']url|new URL\(params\.get/);
});

test("legacy data API stays historical and never impersonates live bookable fares", () => {
  const api = read("src/app/api/flights/route.ts");
  assert.match(api, /"cached_observations"/);
  assert.match(api, /X-Access-Token/);
  assert.match(api, /enforceRateLimit/);
});
