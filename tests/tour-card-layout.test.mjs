import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("all five tour partners and six experiences have compact image-backed cards", () => {
  const source = read("src/components/tours/TourAffiliateMarketplace.tsx");
  for (const name of ["WeGoTrip", "Tiqets", "Klook", "Go City", "KKday",
    "Guided city tours", "Attraction tickets", "Audio tours", "City passes", "Day trips", "Outdoor experiences"]) {
    assert.ok(source.includes('name: "' + name + '"'), name);
  }
  assert.match(source, /w-\[188px\]/);
  assert.match(source, /sm:w-\[206px\]/);
  assert.match(source, /h-\[112px\]/);
  assert.match(source, /sm:h-\[122px\]/);
  assert.match(source, /snap-start/);
  assert.match(source, /className="object-cover object-center/);
  assert.match(source, /sizes="\(max-width: 640px\) 188px, 206px"/);
  assert.match(source, /quality=\{85\}/);
  assert.match(source, /Destination imagery is illustrative/);
});

test("all illustrative card images are existing high-byte-size local source files", () => {
  const source = read("src/components/tours/TourAffiliateMarketplace.tsx");
  const images = [...source.matchAll(/image: "(\/images\/[^"]+\.jpg)"/g)].map((match) => match[1]);
  assert.equal(images.length, 11);
  for (const path of images) {
    const file = new URL("../public" + path, import.meta.url);
    assert.ok(statSync(file).size >= 500_000, "Use a sharp existing source asset: " + path);
  }
  assert.doesNotMatch(source, /unsplash\.com|images\.pexels\.com|picsum\.photos/);
});

test("partner strip precedes category strip and Tiqets, followed by real listings", () => {
  const source = read("src/components/tours/TourAffiliateMarketplace.tsx");
  const page = read("src/components/tours/ToursExplorer.tsx");
  const first = source.indexOf('<TourCarousel label="Tour booking partners">');
  const second = source.indexOf('<TourCarousel label="Tour experience categories">');
  const third = source.indexOf("<TiqetsPartnerWidgets />");
  assert.ok(first >= 0 && first < second && second < third);
  const landing=read("src/components/tours/TourLanding.tsx");
  assert.ok(landing.indexOf("<TourAffiliateMarketplace ") < landing.indexOf("<ToursExplorer "));
  assert.match(page, /<TourCarousel label="Source-backed tour listings">/);
  assert.match(page, /w-\[190px\]/);
  assert.match(page, /sm:w-\[216px\]/);
  assert.match(page, /tours\.length > 0/);
  assert.match(page, /searchTours\(/);
  assert.match(page, /parseTourFilters\(raw\)/);
  assert.doesNotMatch(page, /grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3/);
});

test("carousels expose keyboard focus and usable desktop navigation arrows", () => {
  const source = read("src/components/tours/TourCarousel.tsx");
  assert.match(source, /"use client"/);
  assert.match(source, /role="region"/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.match(source, /aria-label=\{label\}/);
  assert.match(source, /onClick=\{\(\) => move\(-1\)\}/);
  assert.match(source, /onClick=\{\(\) => move\(1\)\}/);
  assert.match(source, /viewport\.scrollBy/);
  assert.match(source, /snap-x snap-mandatory/);
  assert.match(source, /overflow-x-auto/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|eval\(|document\.write/);
});
