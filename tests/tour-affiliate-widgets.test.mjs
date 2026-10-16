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

test("two Tiqets widgets preserve supplied publisher and promo identifiers", () => {
  const widget = source("src/components/tours/TiqetsPartnerWidgets.tsx");
  assert.equal((widget.match(/https:\/\/tpwidg\.com\/content\?/g) || []).length, 2);
  assert.match(widget, /trs=504342&shmarker=417668/);
  assert.match(widget, /campaign_id=89&promo_id=3947/);
  assert.match(widget, /campaign_id=89&promo_id=3948/);
  assert.match(widget, /layout=horizontal&cards=4/);
  assert.match(widget, /product=&language=en/);
  assert.match(widget, /currency=USD/);
});

test("external scripts load only inside a scoped Tiqets panel with safe cleanup", () => {
  const widget = source("src/components/tours/TiqetsPartnerWidgets.tsx");
  assert.match(widget, /"use client"/);
  assert.match(widget, /document\.createElement\("script"\)/);
  assert.match(widget, /mount\.appendChild\(script\)/);
  assert.match(widget, /mount\.replaceChildren\(\)/);
  assert.match(widget, /script\.onerror/);
  assert.match(widget, /aria-pressed=\{selected === tab\}/);
  assert.doesNotMatch(widget, /dangerouslySetInnerHTML|eval\(|document\.write|localStorage|NEXT_PUBLIC_.*SECRET/);
  assert.doesNotMatch(source("src/app/layout.tsx"), /tpwidg\.com/);
  assert.doesNotMatch(source("src/app/flights/page.tsx"), /tpwidg\.com/);
});

test("source-backed tour search and detail routes are preserved", () => {
  const tours = source("src/app/tours/page.tsx");
  const activities = source("src/app/activities/page.tsx");
  assert.match(tours, /import TourAffiliateMarketplace/);
  assert.match(tours, /<TourAffiliateMarketplace \/>/);
  assert.match(tours, /searchTours\(filters\)/);
  assert.match(tours, /String\(tour\.id\)/);
  assert.match(activities, /<ToursPage searchParams=\{searchParams\}/);
  assert.doesNotMatch(tours, /Guaranteed Price|Instant Booking|Math\.random/);
});
