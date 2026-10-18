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
  assert.match(page,/image:"\/images\/cities\/mumbai\.jpg"/);
  assert.match(page,/image:"\/images\/cities\/goa\.jpg"/);
  assert.match(page,/<Image src=\{place\.image\}/);
  assert.match(page,/href=\{"\/hotels\/"\+place\.slug\}/);
  assert.match(page,/Destination photographs illustrate the cities, not any individual hotel/);
  assert.doesNotMatch(page,/index%illustrations\.length/);
});

test("hotel sidebar does not present generic amenities as verified property features", () => {
  const page=read("src/app/hotels/page.tsx");
  assert.match(page,/General planning checklist only/);
  assert.match(page,/not verified amenities of any specific hotel/);
  assert.doesNotMatch(page,/Infinity Pool|Breakfast Included|Fitness Club/);
});

test("Booking-style responsive hotel list uses desktop filter sidebar and mobile filter drawer",()=>{
 const page=read("src/app/hotels/page.tsx");
 const results=read("src/app/hotels/results/HotelResults.tsx");
 assert.match(page,/lg:grid-cols-\[260px_minmax\(0,1fr\)\]/);
 assert.match(page,/aria-controls="hotel-filter-panel"/);
 assert.match(page,/aria-expanded=\{mobileFiltersOpen\}/);
 assert.match(page,/Close filters/);
 assert.match(page,/aria-label="Hotel listing results"/);
 assert.match(page,/flex min-w-0 flex-col md:flex-row/);
 assert.match(page,/Original hotel photos are shown|Original hotel photos are shown when supported|Original hotel photos/);
 assert.match(results,/className="flex min-w-0 flex-col gap-4"/);
 assert.match(results,/md:flex-row/);
 assert.doesNotMatch(results,/sm:grid-cols-2 xl:grid-cols-3/);
});

test("dedicated hotel results maintain source-backed sidebar and mobile category links",()=>{
 const code=read("src/app/hotels/results/HotelResults.tsx");
 assert.match(code,/Hotel result filters/);
 assert.match(code,/Accommodation categories/);
 assert.match(code,/Mobile accommodation categories/);
 assert.match(code,/filterHref\(\{category:type\.id\}\)/);
 assert.match(code,/filterHref\(\{source:value\}\)/);
 assert.match(code,/filterHref\(\{sort:value\}\)/);
 assert.match(code,/lg:grid-cols-\[240px_minmax\(0,1fr\)\]/);
});
