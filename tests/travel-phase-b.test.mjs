import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("hotel landing page never manufactures hotel data or rates", () => {
  const page = read("src/app/hotels/page.tsx");
  assert.doesNotMatch(page, /Math\.random|generateHotels|price\.toLocaleString\(\)/);
  assert.match(page, /new URLSearchParams\(\{ page: "1" \}\)/);
  assert.match(page, /hotelParams\.set\("city", requestedCity\)/);
  assert.match(page, /hotelParams\.set\("name", nameFilter\)/);
});

test("hotel results route renders the real listings component", () => {
  const page = read("src/app/hotels/results/page.tsx");
  assert.match(page, /<HotelResults city=\{city\}/);
});

test("hotel API limits public projection and does not invent prices", () => {
  const route = read("src/app/api/hotels/route.ts");
  assert.doesNotMatch(route, /\.select\("\*"\)/);
  assert.doesNotMatch(route, /PEXELS_API_KEY|Math\.random/);
  assert.match(route, /safePartnerLink/);
});

test("hotel booking endpoint describes requests instead of confirmations", () => {
  const route = read("src/app/api/bookings/route.ts");
  assert.match(route, /request_received/);
  assert.match(route, /Check-in cannot be in the past/);
  assert.match(route, /enforceRateLimit/);
});

test("flight search fails closed and uses partner search safely", () => {
  const page = read("src/app/flights/page.tsx");
  const api = read("src/app/api/flights/route.ts");
  assert.match(page, /AbortController/);
  assert.doesNotMatch(page, /jet-tickets\.com/);
  assert.match(api, /X-Access-Token/);
  assert.doesNotMatch(api, /searchParams\.set\("token"/);
});

test("tour booking omits fake partner fallback and unsupported guarantees", () => {
  const page = read("src/app/tours/[slug]/page.tsx");
  assert.doesNotMatch(page, /partner-site\.com|Best price guarantee|No hidden charges/);
  assert.match(page, /rel="noopener noreferrer sponsored"/);
});
