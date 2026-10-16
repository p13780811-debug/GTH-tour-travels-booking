import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("car rentals retain Localrent widget and introduce exactly one QEEQ widget", () => {
  const widget = read("src/components/travel/TravelpayoutsCarWidget.tsx");
  assert.match(widget, /export const CAR_WIDGET_URL = "https:\/\/tpwidg\.com\/content\?/);
  assert.match(widget, /country=153&city=68511/);
  assert.match(widget, /campaign_id=87&promo_id=2466/);
  assert.match(widget, /export const QEEQ_WIDGET_URL = "https:\/\/tpwidg\.com\/content\?/);
  assert.match(widget, /campaign_id=172&promo_id=4850/);
  assert.equal((widget.match(/https:\/\/tpwidg\.com\/content\?/g) || []).length, 2);
  assert.match(widget, /trs=504342&shmarker=417668/);
});

test("provider switch is scoped to car widget with safe third-party lifecycle", () => {
  const widget = read("src/components/travel/TravelpayoutsCarWidget.tsx");
  assert.match(widget, /"use client"/);
  assert.match(widget, /aria-pressed=\{active === key\}/);
  assert.match(widget, /document\.createElement\("script"\)/);
  assert.match(widget, /mount\.appendChild\(script\)/);
  assert.match(widget, /mount\.replaceChildren\(\)/);
  assert.match(widget, /script\.onerror/);
  assert.match(widget, /specific country and city preset/);
  assert.doesNotMatch(widget, /dangerouslySetInnerHTML|eval\(|document\.write|Math\.random|localStorage/);
  assert.doesNotMatch(read("src/app/layout.tsx"), /tpwidg\.com/);
});

test("existing worldwide car marketplace and transfer separation are retained", () => {
  const page = read("src/app/cars/page.tsx");
  assert.match(page, /CarRentalPlanner/);
  assert.match(page, /TravelpayoutsCarWidget/);
  assert.match(page, /canonical: "\/cars"/);
  assert.match(page, /href="\/transfers"/);
  assert.match(page, /affiliate-disclosure/);
  assert.doesNotMatch(page, /redirect\("\/transfers"\)|mock prices|reservation confirmed/);
});
