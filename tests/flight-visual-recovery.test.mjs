import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("flight-only styles restore modern type without editing global ecosystem CSS", () => {
  const css = read("src/app/flights/flights.css");
  const layout = read("src/app/flights/layout.tsx");
  const page = read("src/app/flights/page.tsx");
  assert.match(layout, /import "\.\/flights\.css"/);
  assert.match(page, /className="gth-flights-root/);
  assert.match(css, /font-family: var\(--font-geist-sans/);
  assert.match(css, /\.gth-flights-root h1/);
  assert.match(css, /\.gth-flights-root h2/);
  assert.match(css, /nav\[aria-label="GTH PRO mobile app navigation"\]/);
  assert.match(css, /@media \(min-width: 768px\)/);
  assert.doesNotMatch(css, /@import "tailwindcss"|\.gth-btn-gold \{|\.gth-master-home \{/);
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
