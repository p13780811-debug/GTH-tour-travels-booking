import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/hotels/page.tsx","utf8");
const card=readFileSync("src/components/hotel/NuiteeHotelOffers.tsx","utf8");
const api=readFileSync("src/app/api/hotels/nuitee-featured/route.ts","utf8");
const config=JSON.parse(readFileSync("vercel.json","utf8"));
test("Native GTH cards follow existing Nuitee search and use centralized theme",()=>{
 assert.match(page,/<HotelBookingExperience\s*\/>[\s\S]*<NuiteeHotelOffers\s*\/>/);
 assert.match(card,/HotelPropertyImage/);
 assert.match(card,/bg-\[var\(--card\)\]/);
 assert.match(card,/text-\[var\(--text\)\]/);
 assert.match(card,/gth-btn-gold/);
 assert.doesNotMatch(card,/iframe|srcDoc|HotelsList\.create|dark:invert/);
});
test("Supplier data is server-only, bounded, cached and sandbox-gated",()=>{
 assert.match(api,/api\.liteapi\.travel\/v3\.0\/data\/hotels/);
 assert.match(api,/NUITEE_SANDBOX_API_KEY/);
 assert.match(api,/NUITEE_PRODUCTION_API_KEY/);
 assert.match(api,/GTH_NUITEE_PRODUCTION_ENABLED/);
 assert.match(api,/process\.env\.VERCEL_ENV==="production"/);
 assert.match(api,/s-maxage=3600/);
 assert.match(api,/hotels\.slice\(0,6\)/);
 assert.doesNotMatch(card,/NUITEE_SANDBOX_API_KEY|X-API-Key/);
 assert.match(card,/no real transactions or verified live rates/);
});
test("Supplier IDs are preserved and no fabricated prices are shown",()=>{
 assert.match(card,/encodeURIComponent\(id\)/);
 assert.match(card,/HOTEL_BOOKING_ORIGIN/);
 assert.doesNotMatch(card,/₹|fakePrice|bookNow|prebook/);
 assert.equal(config.git.deploymentEnabled["feat/hotels-global-source-cards-20261106"],false);
});
