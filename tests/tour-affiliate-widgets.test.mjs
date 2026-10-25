import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("tour partner marketplace includes actual publisher-provided affiliate handoffs", () => {
  const content = source("src/components/tours/TourAffiliateMarketplace.tsx");
  for (const url of [
    "https://wegotrip.tpo.lv/ZQjE9yR2",
    "https://klook.tpo.lv/IKb6eSUe",
    "https://gocity.tpo.lv/NdfDWRGS",
    "https://kkday.tpo.lv/ytfvDLam",
  ]) {
    assert.ok(content.includes(url), url);
  }
  assert.match(content, /rel="noopener noreferrer sponsored"/);
  assert.match(content, /GTH PRO does not issue tickets/);
  assert.doesNotMatch(content, /Math\.random|guaranteed price|instant booking/i);
});

test("ticket tabs use real supplier links instead of blank product-less embeds", () => {
  const widget = source("src/components/tours/TiqetsPartnerWidgets.tsx");
  for (const target of [
    "https://www.tiqets.com/",
    "https://klook.tpo.lv/IKb6eSUe",
    "https://gocity.tpo.lv/NdfDWRGS",
    "https://wegotrip.tpo.lv/ZQjE9yR2",
    "https://kkday.tpo.lv/ytfvDLam",
  ]) assert.ok(widget.includes(target), "Missing verified provider link: "+target);
  assert.match(widget, /cards:/);
  assert.match(widget, /product:/);
  assert.match(widget, /More ticket options/);
  assert.match(widget, /aria-pressed=\{selected === tab\}/);
  assert.match(widget, /aria-controls="tiqets-ticket-results"/);
  assert.match(widget, /rel=\{option\.sponsored \? "noopener noreferrer sponsored"/);
  assert.doesNotMatch(widget, /tpwidg\.com|promo_id=3948|product=&|<iframe|createElement\("script"\)|dangerouslySetInnerHTML|eval\(/);
});

test("changing tabs always has actual destination links without network-dependent iframe states", () => {
  const widget = source("src/components/tours/TiqetsPartnerWidgets.tsx");
  assert.match(widget, /panel\.options\.map\(option =>/);
  assert.match(widget, /setSelected\(tab\)/);
  assert.match(widget, /<div id="tiqets-ticket-results"/);
  assert.doesNotMatch(widget, /mountRef|mount\.replaceChildren|script\.onload|script\.onerror/);
  assert.doesNotMatch(source("src/app/layout.tsx"), /tpwidg\.com/);
  assert.doesNotMatch(source("src/app/flights/page.tsx"), /tpwidg\.com/);
});

test("source-backed tour search and detail routes are preserved", () => {
  const tours = source("src/components/tours/ToursExplorer.tsx");
  const activities = source("src/app/activities/page.tsx");
  const landing=source("src/components/tours/TourLanding.tsx");
  assert.match(landing, /import TourAffiliateMarketplace/);
  assert.match(landing, /<TourAffiliateMarketplace search=\{filters\}/);
  assert.match(tours, /searchTours\(/);
  assert.match(tours, /String\(tour\.id\)/);
  assert.match(activities, /<TourLanding searchParams=\{searchParams\} basePath="\/activities"/);
  assert.doesNotMatch(tours, /Guaranteed Price|Instant Booking|Math\.random/);
});
