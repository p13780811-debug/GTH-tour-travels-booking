import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css=readFileSync("src/app/globals.css","utf8");
const search=readFileSync("src/components/hotel/HotelBookingExperience.tsx","utf8");
const supplier=readFileSync("src/lib/travel/hotel-whitelabel.ts","utf8");

test("mobile hotel search occupies available screen width using existing centralized hotel CSS",()=>{
 const marker="/* GTH HOTEL BOOKING SCOPED EXTENSION START */";
 const offset=css.indexOf(marker);
 assert.ok(offset>=0);
 const section=css.slice(offset);
 const mobile=section.slice(section.indexOf("@media (max-width: 640px)"));
 assert.match(mobile,/\.gth-hotel-booking \{ width: 100%; max-width: 100%;/);
 assert.match(mobile,/\.gth-hotel-search-panel \{ margin-inline: calc\(-1 \* var\(--space-md\)\); \}/);
 assert.match(mobile,/\.gth-hotel-search-frame \{ border-radius: 0; \}/);
 assert.match(mobile,/body\.gth-hotel-search-widget \{ padding: 0; \}/);
 assert.match(mobile,/\.gth-hotel-search-widget \.search-bar \{ width: 100%; max-width: 100%; \}/);
 assert.match(section,/\.gth-hotel-booking \{[^}]*background: var\(--card\); color: var\(--text\);/);
 assert.match(section,/\.gth-hotel-search-widget \.search-bar \{[^}]*background: var\(--card\); color: var\(--text\);/);
 assert.doesNotMatch(mobile,/#fff|#ffffff|background:\s*white|color:\s*white/);
});

test("isolated vendor search, theme sync, mobile full-window handoff remain functional",()=>{
 assert.match(search,/HOTEL_WIDGET_SCRIPT/);
 assert.match(search,/win\.LiteAPI\.SearchBar\.create/);
 assert.match(search,/onSearchClick: value => \{ if \(active\) search\(value\); \}/);
 assert.match(search,/hotelWidgetSearchParams\(payload\)/);
 assert.match(search,/window\.location\.assign\(hotelWhiteLabelUrl\(stay\)\)/);
 assert.match(search,/new MutationObserver\(syncTheme\)/);
 assert.match(search,/srcDoc=\{searchDocument\}/);
 assert.match(supplier,/https:\/\/gthproglobal\.nuitee\.link/);
});

test("supplier hotel search respects global dark tokens and loads them after vendor CSS",()=>{
 const dark=css.slice(css.indexOf("/* Supplier SearchBar can inject white field surfaces"));
 assert.ok(dark.includes("html.gth-hotel-widget-root.dark body.gth-hotel-search-widget"));
 for(const token of ["--card","--text","--text-soft","--border","--btn-bg","--btn-text"]){
   assert.ok(dark.includes("var("+token+")"),"reuse global token "+token);
 }
 assert.match(dark,/\.search-bar :is\(\.field, \.desktop-dates, \.mobile-checkin/);
 assert.match(dark,/\.search-bar input::placeholder/);
 assert.match(dark,/color-scheme: dark/);
 assert.doesNotMatch(dark,/background:\s*(?:white|#fff(?:fff)?)\b/i);
 const sdkCreation=search.indexOf("await win.LiteAPI.SearchBar.create(");
 const stylesheetCopy=search.indexOf('for (const sheet of document.querySelectorAll');
 assert.ok(sdkCreation>0 && stylesheetCopy>sdkCreation,"GTH CSS must follow injected vendor styling");
 assert.match(search,/doc\.documentElement\.className =/);
});
