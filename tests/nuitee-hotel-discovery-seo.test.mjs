import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const file=path=>readFileSync(path,"utf8");
const layout=file("src/app/hotels/layout.tsx");
const original=file("src/app/hotels/page.tsx");
const markets=file("src/lib/travel/nuitee-hotel-markets.ts");
const supplier=file("src/lib/travel/nuitee-hotel-catalog.ts");
const api=file("src/app/api/hotels/nuitee-featured/route.ts");
const card=file("src/components/hotel/NuiteeHotelCard.tsx");
const offers=file("src/components/hotel/NuiteeHotelOffers.tsx");
const placement=file("src/components/hotel/HotelsDiscoveryPlacement.tsx");
const location=file("src/app/hotels/explore/[slug]/page.tsx");
const detail=file("src/app/hotels/featured/[market]/[id]/page.tsx");
const sitemap=file("src/app/sitemap.ts");

test("original hotel booking remains untouched; only exact /hotels gets appended discovery",()=>{
 assert.match(original,/<HotelBookingExperience\s*\/>/);
 assert.match(original,/HotelCatalogPulse/);
 assert.match(layout,/\{children\}<HotelsDiscoveryPlacement\s*\/>/);
 assert.match(placement,/pathname==="\/hotels"/);
 assert.doesNotMatch(placement,/startsWith\(/);
 assert.match(card,/gth-btn-gold/);
 assert.match(card,/bg-\[var\(--card\)\]/);
 assert.doesNotMatch(offers+card+placement,/style=\{|<iframe|srcDoc|document\.head|!important/);
});

test("worldwide guide scope is fixed and not derived from arbitrary user input",()=>{
 const slugs=[...markets.matchAll(/\{slug:"([^"]+)",city:/g)].map(v=>v[1]);
 assert.equal(slugs.length,15);
 assert.equal(new Set(slugs).size,slugs.length);
 for(const expected of ["mumbai","kolkata","goa","delhi","london","dubai","paris","tokyo","rome","new-york"])assert.ok(slugs.includes(expected));
 assert.match(location,/getHotelMarket\(slug\)/);
 assert.match(location,/if\(!market\)notFound\(\)/);
 assert.match(location,/market\.areas\.map/);
});

test("supplier requests are server-only, cached, narrow and production-key-gated",()=>{
 assert.match(supplier,/import "server-only"/);
 assert.match(supplier,/GTH_NUITEE_PRODUCTION_ENABLED/);
 assert.match(supplier,/NUITEE_PRODUCTION_API_KEY/);
 assert.match(supplier,/NUITEE_SANDBOX_API_KEY/);
 assert.match(supplier,/GTH_NUITEE_MEDIA_RIGHTS_APPROVED/);
 assert.match(supplier,/HOTEL_FEED_REVALIDATE_SECONDS=7\*24\*60\*60/);
 assert.match(supplier,/signal:AbortSignal\.timeout\(8500\)/);
 assert.match(supplier,/\.slice\(0,24\)/);
 assert.match(supplier,/hotels\.slice\(0,MAX_HOTELS\)/);
 assert.doesNotMatch(supplier+api,/createClient|\.from\(|service_role|NEXT_PUBLIC_NUITEE|rates\/book|prebook/i);
 assert.doesNotMatch(offers+card,/NUITEE_PRODUCTION_API_KEY|NUITEE_SANDBOX_API_KEY|X-API-Key/);
 assert.match(api,/s-maxage=86400/);
 assert.match(api,/getHotelMarket\(market\)/);
});

test("hotel cards and GTH hotel detail link to the exact supplier White Label ID",()=>{
 assert.match(card,/\/hotels\/featured\//);
 assert.match(card,/new URL\("\/hotels\/"\+encodeURIComponent\(hotel\.id\),HOTEL_BOOKING_ORIGIN\)/);
 assert.match(detail,/new URL\("\/hotels\/"\+encodeURIComponent\(hotel\.id\),HOTEL_BOOKING_ORIGIN\)/);
 assert.match(detail,/validNuiteeHotelId\(id\)/);
 assert.match(detail,/robots:\{index:false,follow:true\}/);
 assert.match(detail,/feed\.hotels\.find\(value=>value\.id===id\)/);
 assert.match(card,/rel="noopener noreferrer sponsored"/);
 assert.doesNotMatch(detail,/setBooking|createBooking|service_role|rateId|paymentIntent/);
});

test("sitemap expands approved original city guides without dynamic supplier queries",()=>{
 assert.match(sitemap,/HOTEL_MARKETS\.map\(market=>\(\{url:base\+"\/hotels\/explore\/"/);
 assert.match(location,/isPublicLaunch\(\)/);
 assert.match(location,/alternates:\{canonical\}/);
 assert.match(detail,/index:false/);
 assert.doesNotMatch(sitemap,/getNuiteeMarketFeed|nuitee-featured/);
});
