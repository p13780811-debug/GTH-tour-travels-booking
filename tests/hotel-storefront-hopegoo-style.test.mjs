import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const ui = read("src/components/hotel/HotelDiscoveryShowcase.tsx");
const page = read("src/app/hotels/page.tsx");
const booking = read("src/components/hotel/HotelBookingExperience.tsx");
const handoff = read("src/lib/travel/hotel-whitelabel.ts");

test("Hotel storefront reuses GTH tokens without a second theme, copied brand or invented prices", () => {
  assert.match(ui, /border-\[var\(--border\)\]/);
  assert.match(ui, /bg-\[var\(--card\)\]/);
  assert.match(ui, /gth-btn-gold/);
  assert.match(ui, /snap-x snap-mandatory/);
  assert.match(ui, /images\/cities\/mumbai\.jpg/);
  assert.doesNotMatch(ui, /HopeGoo|CJ Affiliate|bookaway|Nuitee\.link|Math\.random|discount|65% off|US\$|₹[0-9]/i);
  assert.doesNotMatch(ui, /style=\{|linear-gradient|radial-gradient|from-black|bg-white|text-white/);
});
test("Accessible date-free destination search goes to booking, not the failing OSM directory", () => {
  assert.match(ui, /action="\/hotels" method="GET"/);
  assert.match(ui, /name="view" value="booking"/);
  assert.match(ui, /window\.location\.assign\(trackedHotelCityHref\(selected\) \|\| route\("booking", selected\)\)/);
  assert.match(ui, /name="city" type="search"/);
  assert.match(ui, /onSubmit=\{quickSearch\}/);
  assert.match(ui, /maxLength=\{80\}/);
  assert.match(ui, /\/hotels\?/);
  assert.match(ui, /view === "directory" \? "#hotel-results"/);
  assert.doesNotMatch(ui, /\bfetch\(/);
});
test("All booking handoffs preserve existing supplier search and explicit date selection", () => {
  assert.match(ui, /route\("booking", place\.city\)/);
  assert.match(page, /<HotelBookingExperience key=\{currency\} currency=\{currency\} \/>/);
  assert.match(page, /id="hotel-booking-experience"/);
  assert.match(booking, /HOTEL_BOOKING_ORIGIN/);
  assert.match(booking, /hotelWhiteLabelUrl\(stay\)/);
  assert.match(page, /directoryRequested = params\.get\("view"\) === "directory"/);
  assert.match(handoff, /https:\/\//);
});
test("Category chips filter only directory inventory and keep destination scope", () => {
  assert.match(ui, /value: "resort"/);
  assert.match(ui, /value: "apartment"/);
  assert.match(ui, /value: "guest_house"/);
  assert.match(ui, /route\("directory", validateCity\(initialCity\) \?\? undefined, type\.value\)/);
  assert.match(page, /const initialCategory = \["hotel","hostel","guest_house","motel","apartment","resort"\]/);
  assert.match(page, /useEffect\(\(\)=>setCategory\(initialCategory\),\[initialCategory\]\)/);
  assert.match(page, /source-backed listings/i);
});
test("Directory cards are compact on phones but never invent room inventory or booking approval", () => {
  assert.match(page, /flex min-w-0 flex-row/);
  assert.match(page, /min-h-44 w-28 shrink-0/);
  assert.match(page, /hotel\.booking_ready\?"\/hotels\/partner\/"/);
  assert.match(page, /Price on provider/);
  assert.doesNotMatch(page, /hopegoo\.com|kol\.hopegoo\.com/);
});
