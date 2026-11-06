import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css=readFileSync("src/app/globals.css","utf8");
const search=readFileSync("src/components/hotel/HotelBookingExperience.tsx","utf8");
const whitelabel=readFileSync("src/lib/travel/hotel-whitelabel.ts","utf8");
const preview=JSON.parse(readFileSync("vercel.json","utf8"));

test("mobile Nuitee search uses nearly all available phone width via central CSS only",()=>{
  const marker="/* GTH HOTEL BOOKING SCOPED EXTENSION START */";
  const extension=css.slice(css.indexOf(marker));
  assert.ok(css.includes(marker));
  assert.match(extension,/@media \(max-width: 640px\) \{/);
  assert.match(extension,/\.gth-hotel-booking \{ width: 100%; max-width: 100%;/);
  assert.match(extension,/\.gth-hotel-search-panel \{ margin-inline: calc\(-1 \* var\(--space-md\)\); \}/);
  assert.match(extension,/\.gth-hotel-search-frame \{ border-radius: 0; \}/);
  assert.match(extension,/body\.gth-hotel-search-widget \{ padding: 0; \}/);
  assert.match(extension,/\.gth-hotel-search-widget \.search-bar \{ width: 100%; max-width: 100%; \}/);
});
test("booking widget and supplier handoff retain their existing functional contract",()=>{
  assert.match(search,/HOTEL_WIDGET_SCRIPT/);
  assert.match(search,/win\.LiteAPI\.SearchBar\.create/);
  assert.match(search,/onSearchClick: value => \{ if \(active\) search\(value\); \}/);
  assert.match(search,/hotelWidgetSearchParams\(payload\)/);
  assert.match(search,/normalizeHotelOccupancies|hotelBookingParams/);
  assert.match(search,/window\.location\.assign\(hotelWhiteLabelUrl\(stay\)\)/);
  assert.match(whitelabel,/https:\/\/gthproglobal\.nuitee\.link/);
  assert.equal(preview.git.deploymentEnabled["feat/hotels-global-source-cards-20261106"],false);
});
