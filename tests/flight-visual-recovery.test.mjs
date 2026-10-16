import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("root body respects Noto Sans design font instead of overriding all travel pages with Cinzel", () => {
  const root = read("src/app/layout.tsx");
  const global = read("src/app/globals.css");
  const estate = read("src/components/real-estate/Listing.module.css");
  const flightLayout = read("src/app/flights/layout.tsx");
  const flightPage = read("src/app/flights/page.tsx");
  const flightService = read("src/components/flights/FlightJourneyServices.tsx");
  assert.match(root, /Noto_Sans/);
  assert.match(root, /\$\{notoSans\.className\}/);
  assert.doesNotMatch(root, /Cinzel|cinzel\.className/);
  assert.match(global, /@apply font-sans/);
  assert.match(estate, /\.estateScope \{ font-family: var\(--font-sans\)/);
  assert.doesNotMatch(flightLayout, /flights\.css/);
  assert.ok(!existsSync(new URL("../src/app/flights/flights.css", import.meta.url)), "No manual Flights typography stylesheet");
  assert.doesNotMatch(flightPage, /gth-flights-root|gth-flight-hero-photo|gth-flight-shell/);
  assert.match(flightPage, /mx-auto w-full max-w-7xl/);
  assert.match(flightService, /aspect-\[16\/9\]/);
});

test("flight search stays primary with human-readable premium hero and scoped nav", () => {
  const page = read("src/app/flights/page.tsx");
  const widget = read("src/components/flights/AviasalesWhiteLabel.tsx");
  assert.match(page, /Find your next flight/);
  assert.match(page, /<AviasalesWhiteLabel \/>/);
  assert.match(page, /<FlightJourneyServices \/>/);
  assert.match(page, /<PopularDestinations/);
  assert.ok(page.indexOf("<AviasalesWhiteLabel />") < page.indexOf("<FlightJourneyServices />"));
  assert.match(widget, /id="tpwl-search"/);
  assert.match(widget, /id="tpwl-tickets"/);
  assert.doesNotMatch(page, /Cached fares|No cached fare observations|Math\.random/i);
});

test("five illustrated categories use compact horizontal cards and active provider selection", () => {
  const s = read("src/components/flights/FlightJourneyServices.tsx");
  assert.match(s, /^"use client"/);
  for (const group of ["Flight protection","Airport transfers","Car rentals","Airport essentials","At destination"]) {
    assert.ok(s.includes('group: "' + group + '"'), group);
  }
  assert.match(s, /w-\[166px\]/);
  assert.match(s, /sm:w-\[194px\]/);
  assert.match(s, /snap-x snap-mandatory/);
  assert.match(s, /aria-pressed=\{selected === category\.group\}/);
  assert.match(s, /onClick=\{\(\) => setSelected\(category\.group\)\}/);
  assert.match(s, /activeProviders\.map/);
  assert.match(s, /rel="noopener noreferrer sponsored"/);
  assert.doesNotMatch(s, /<details|Math\.random|fake fare/);
  const images = [...s.matchAll(/image: "(\/images\/[^"]+\.jpg)"/g)].map(match=>match[1]);
  assert.equal(images.length,5);
  for(const img of images) assert.ok(statSync(new URL("../public" + img,import.meta.url)).size > 30000, img);
});
