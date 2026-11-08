import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");
const layout=read("src/app/hotels/layout.tsx");
const original=read("src/app/hotels/page.tsx");
const markets=read("src/lib/travel/nuitee-hotel-markets.ts");
const offers=read("src/components/hotel/NuiteeHotelOffers.tsx");
const placement=read("src/components/hotel/HotelsDiscoveryPlacement.tsx");
const location=read("src/app/hotels/explore/[slug]/page.tsx");
const sitemap=read("src/app/sitemap.ts");
const provider=read("src/lib/travel/hotel-provider-search.ts");

test("hotel booking and original global styling remain protected",()=>{
 assert.match(original,/<HotelBookingExperience\s*\/>/);
 assert.match(original,/HotelCatalogPulse/);
 assert.match(layout,/\{children\}<HotelsDiscoveryPlacement\s*\/>/);
 assert.match(placement,/pathname==="\/hotels"/);
 assert.doesNotMatch(placement,/startsWith\(/);
 assert.match(offers,/gth-btn-gold/);
 assert.match(offers,/bg-\[var\(--card\)\]/);
 assert.doesNotMatch(offers+placement,/style=\{|<iframe|srcDoc|document\.head|!important/);
});

test("no new API subscription, Nuitee supplier feed or private production key needed",()=>{
 for(const path of [
  "src/app/api/hotels/nuitee-featured/route.ts",
  "src/lib/travel/nuitee-hotel-catalog.ts",
  "src/app/hotels/featured/[market]/[id]/page.tsx",
  "src/components/hotel/NuiteeHotelCard.tsx"
 ])assert.equal(existsSync(path),false,path);
 assert.match(offers,/fetch\("\/api\/hotels\?"/);
 assert.match(offers,/source:"directory"/);
 assert.match(offers,/IntersectionObserver/);
 assert.match(offers,/cache:"no-store"/);
 assert.doesNotMatch(offers+location,/api\.liteapi\.travel|NUITEE_PRODUCTION_API_KEY|GTH_NUITEE_PRODUCTION_ENABLED|\/api\/hotels\/nuitee-featured/);
 assert.match(provider,/return "\/hotels\?view=booking"/);
});

test("directory cards never fabricate an exact Nuitee hotel booking",()=>{
 assert.match(offers,/\/hotels\/stay\//);
 assert.match(offers,/\/hotels\?view=booking/);
 assert.match(offers,/OpenStreetMap/);
 assert.match(offers,/image_attribution/);
 assert.match(offers,/No verified room price or availability/);
 assert.doesNotMatch(offers,/HOTEL_BOOKING_ORIGIN|hotelWhiteLabelUrl|\/hotels\/featured\/|getNuiteeMarketFeed/);
});

test("15 bounded hotel market guides preserve SEO and zero-rate-search scope",()=>{
 const slugs=[...markets.matchAll(/\{slug:"([^"]+)",city:/g)].map(v=>v[1]);
 assert.equal(slugs.length,15);
 assert.equal(new Set(slugs).size,slugs.length);
 for(const name of ["mumbai","kolkata","goa","delhi","london","dubai","paris","tokyo","rome","new-york"])
  assert.ok(slugs.includes(name));
 assert.match(location,/getHotelMarket\(slug\)/);
 assert.match(location,/if\(!market\)notFound\(\)/);
 assert.match(location,/market\.areas\.map/);
 assert.match(location,/FreeHotelDirectoryCards/);
 assert.doesNotMatch(location,/NuiteeHotelCard|getNuiteeMarketFeed/);
 assert.match(location,/isPublicLaunch\(\)/);
 assert.match(location,/alternates:\{canonical\}/);
 assert.match(sitemap,/HOTEL_MARKETS\.map\(market=>\(\{url:base\+"\/hotels\/explore\/"/);
 assert.doesNotMatch(sitemap,/getNuiteeMarketFeed|nuitee-featured/);
});