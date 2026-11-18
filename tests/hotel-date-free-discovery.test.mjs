import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("date-free hotel discovery is visible without changing the booking provider", () => {
  const booking = read("src/components/hotel/HotelBookingExperience.tsx");
  const hotels = read("src/app/hotels/page.tsx");
  assert.match(booking, /href="\/hotels\?view=directory"/);
  assert.match(booking, /Browse hotels without dates/);
  assert.match(booking, /Directory listings are for discovery, not proof of live rooms or prices/);
  assert.match(hotels, /directoryRequested = params.get\("view"\) === "directory"/);
  assert.match(booking, /HOTEL_BOOKING_ORIGIN/);
  assert.match(booking, /resolveHotelRoute\(/);
  assert.match(booking, /hotelWhiteLabelUrl\(selectedStay\)/);
  assert.doesNotMatch(booking, /bookaway\.com|offer_id=34|aff_id=4344/i);
});

test("only reviewed exact hotel affiliate mappings may be booking-ready", () => {
  const api = read("src/app/api/hotels/route.ts");
  const partner = read("src/app/hotels/partner/[id]/route.ts");
  assert.match(api, /eq\("exact_property_verified",true\)/);
  assert.match(api, /eq\("program_approved",true\)/);
  assert.match(partner, /safeVerifiedHotelAffiliateUrl/);
  assert.doesNotMatch(partner, /bookaway\.com/i);
});
