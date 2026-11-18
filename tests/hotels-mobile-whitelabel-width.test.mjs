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

test("first-party hotel form has no keystroke supplier API, styles or hidden rate iframe",()=>{
 assert.match(search,/srcDoc=\{searchDocument\}/);
 assert.match(search,/id="gth-hotel-native-search"/);
 assert.match(search,/resolveHotelRoute\(/);
 assert.match(search,/window\.location\.assign\(result\.url\)/);
 assert.match(search,/const embedResults = false/);
 assert.match(search,/document\.querySelectorAll\('link\[rel="stylesheet"\]'\)/);
 assert.doesNotMatch(search,/LiteAPI\.SearchBar|HOTEL_WIDGET_SCRIPT|hotelWidgetSearchParams|<style|style=\{/);
 assert.match(supplier,/DEFAULT_HOTEL_BOOKING_ORIGIN = "https:\/\/hotel\.gthproglobal\.com"/);
});

test("global CSS remains centralized while no supplier search SDK gets loaded",()=>{
 const dark=css.slice(css.indexOf("/* Supplier SearchBar can inject white field surfaces"));
 assert.ok(dark.includes("html.gth-hotel-widget-root.dark body.gth-hotel-search-widget"));
 for(const token of ["--card","--text","--text-soft","--border","--btn-bg","--btn-text"]){
   assert.ok(dark.includes("var("+token+")"),"reuse global token "+token);
 }
 assert.match(search,/gth-hotel-search-frame/);
 assert.match(search,/onLoad=\{\(\) => loadSearch\(\)\}/);
 assert.match(search,/cloneNode\(true\)/);
 assert.doesNotMatch(search,/doc\.createElement\("style"\)|style=\{|\.style\./);

});
