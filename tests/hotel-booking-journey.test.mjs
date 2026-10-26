import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("hotel directory never exposes a guessed booking link; exact partner readiness is sourced per page",()=>{
 const api=read("src/app/api/hotels/route.ts");
 assert.match(api,/bookingReady=new Set<string>/);
 assert.match(api,/from\("hotel_booking_links"\)/);
 assert.match(api,/safeVerifiedHotelAffiliateUrl/);
 assert.match(api,/booking_ready: bookingReady\.has/);
 assert.match(api,/affiliate_link: null/);
});
test("GTH booking starts only on hotel details after the source-to-property mapping has been approved",()=>{
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 const list=read("src/app/hotels/page.tsx");
 const results=read("src/app/hotels/results/HotelResults.tsx");
 assert.match(detail,/from\("hotel_booking_links"\)/);
 assert.match(detail,/\.eq\("exact_property_verified",true\)/);
 assert.match(detail,/safeVerifiedHotelAffiliateUrl/);
 assert.match(detail,/href=\{hotel\.partner\}/);
 assert.match(detail,/Book Now\{hotel\.partnerName/);
 assert.match(detail,/Exact-property booking is not yet connected/);
 assert.match(detail,/hotelProviderSearchUrl/);
 assert.match(detail,/Search stays using Nuitee white-label/);
 assert.doesNotMatch(detail,/Find this hotel on Booking.com/);
 assert.match(detail,/!hotel.partner&&\(hotel.city\|\|hotel.address\|\|hotel.country\)/);
 for(const page of [list,results])assert.doesNotMatch(page,/hotelProviderSearchUrl|Search this hotel on Booking\.com/);
});
test("travel stay scope carries unchanged through results, navigation and detail page",()=>{
 const query=read("src/lib/travel/hotel-search-params.ts");
 const page=read("src/app/hotels/results/page.tsx");
 const list=read("src/app/hotels/results/HotelResults.tsx");
 assert.match(query,/validatedHotelStay/);
 assert.match(page,/checkin, checkout, adults/);
 assert.match(list,/staySuffix/);
 assert.match(list,/encodeURIComponent\(String\(hotel\.id\)\)\+staySuffix/);
});

test("hotel directory fallback never invents Booking.com partner status or a matching hotel",()=>{
 const source=read("src/lib/travel/hotel-provider-search.ts");
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 assert.match(source,/\/hotels\?view=booking/);
 assert.doesNotMatch(source,/booking\.com/i);
 assert.match(detail,/exact hotel match or rate is not guaranteed/);
 assert.match(detail,/hotelProviderSearchUrl/);
});
