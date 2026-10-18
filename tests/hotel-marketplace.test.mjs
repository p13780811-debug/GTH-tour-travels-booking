import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("hotel landing never fabricates nightly rates or ratings", () => {
  const page = read("src/app/hotels/page.tsx");
  assert.doesNotMatch(page, /Math\.random|generateHotels\(/);
  assert.match(page, /hotelSearchParams/);
  assert.match(page, /const hotelParams = hotelParamsFor\(1\)/);
  assert.match(page, /const hotelParams = hotelParamsFor\(nextPage\)/);
  assert.match(page, /setTotal\(/);
  assert.match(page, /View hotel details/);
});

test("city hotel page handles multi-word city slugs and only real listings", () => {
  const page = read("src/app/hotels/[slug]/page.tsx");
  assert.match(page, /citySlug\.split\("-"\)/);
  assert.match(page, /<HotelResults city=\{parsed\.city\}/);
  assert.doesNotMatch(page, /<HotelDeals|<CarRental|<BikeRental|<HotelGrid/);
  assert.match(page, /href: "\/flights"/);
  assert.match(page, /href: "\/tours"/);
});

test("legacy hotel grid and deals cannot render synthetic reviews", () => {
  const grid = read("src/components/cards/HotelGrid.tsx");
  const deals = read("src/components/hotel/HotelDeals.tsx");
  for (const source of [grid, deals]) {
    assert.doesNotMatch(source, /Trusted Reviews|Free Cancellation|4\.8|generateHotels/);
    assert.match(source, /HotelResults/);
  }
});

test("hotel API exposes only public listing attributes", () => {
  const api = read("src/app/api/hotels/route.ts");
  assert.doesNotMatch(api, /select\("\*"\)/);
  assert.match(api, /safePartnerLink/);
  assert.match(api, /Cache-Control/);
});

test("hotel results retain approved handoffs and honest external hotel-name search", () => {
  const result = read("src/app/hotels/results/HotelResults.tsx");
  assert.match(result, /Continue to booking partner/);
  assert.match(result, /Search this hotel on Booking\.com/);
  assert.match(result, /External name search only/);
  assert.match(result, /rel="noopener noreferrer sponsored"/);
  assert.match(result, /rel="noopener noreferrer nofollow"/);
});

test("hotel search retains validated guest and date planning across details", () => {
  const list = read("src/app/hotels/page.tsx");
  const detail = read("src/app/hotels/stay/[id]/page.tsx");
  assert.match(list,/const stayParams=new URLSearchParams/);
  assert.match(list,/stayParams\.set\("checkin",checkin\)/);
  assert.match(list,/stayParams\.set\("checkout",checkout\)/);
  assert.match(list,/stayParams\.set\("adults",String\(guests\)\)/);
  assert.match(list,/encodeURIComponent\(String\(hotel\.id\)\)\+staySuffix/);
  assert.match(detail,/searchParams\?:Promise/);
  assert.match(detail,/const requestedStay=\{checkin,checkout,adults\}/);
  assert.match(detail,/hotelProviderSearchUrl\([^\n]*,requestedStay\)/);
  assert.match(list,/scrollIntoView\(\{behavior:"smooth",block:"start"\}\)/);
});

test("hotel search and result pages recover from API failures without fake records", () => {
  const landing=read("src/app/hotels/page.tsx");
  const results=read("src/app/hotels/results/HotelResults.tsx");
  const image=read("src/components/hotel/HotelPropertyImage.tsx");
  assert.match(landing,/Retry hotel search/);
  assert.match(landing,/\[queryKey,retryCount\]/);
  assert.match(results,/Retry hotel listings/);
  assert.match(results,/effectiveSource,retryCount\]/);
  assert.match(results,/activeKey\.current!==startedFor/);
  assert.match(image,/Original property photo not available/);
  assert.match(image,/Property directory/);
  assert.doesNotMatch(image,/useHotelIllustrations|illustration=/);
});

test("hotel discovery has real linked destination imagery separate from property media", () => {
  const page=read("src/app/hotels/page.tsx");
  assert.match(page,/featuredDestinations/);
  assert.match(page,/src:"/images/cities/mumbai\.jpg"/);
  assert.match(page,/src:"/images/cities/goa\.jpg"/);
  assert.match(page,/<Image src=\{place\.image\}/);
  assert.match(page,/href=\{"/hotels/"\+place\.slug\}/);
  assert.match(page,/Destination photographs illustrate the cities, not any individual hotel/);
  assert.doesNotMatch(page,/index%illustrations\.length/);
});
