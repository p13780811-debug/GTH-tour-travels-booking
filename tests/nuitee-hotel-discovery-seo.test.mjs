import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");
const layout=read("src/app/hotels/layout.tsx");
const original=read("src/app/hotels/page.tsx");
const markets=read("src/lib/travel/nuitee-hotel-markets.ts");
const offers=read("src/components/hotel/NuiteeHotelOffers.tsx");
const widget=read("src/components/hotel/NuiteeHotelsListWidget.tsx");
const placement=read("src/components/hotel/HotelsDiscoveryPlacement.tsx");
const guide=read("src/app/hotels/explore/[slug]/page.tsx");
const sitemap=read("src/app/sitemap.ts");
const provider=read("src/lib/travel/hotel-provider-search.ts");

test("original booking experience, exact hotel route and central theme are retained",()=>{
 assert.match(original,/<HotelBookingExperience key=\{currency\} currency=\{currency\}/);
 assert.match(original,/HotelCatalogPulse/);
 assert.doesNotMatch(layout,/HotelsDiscoveryPlacement/);
 assert.match(original,/<HotelsDiscoveryPlacement currency=\{currency\}/);
 assert.ok(original.indexOf('<HotelBookingExperience key=')<original.indexOf('<HotelsDiscoveryPlacement currency='));
 assert.ok(original.indexOf('<HotelsDiscoveryPlacement currency=')<original.indexOf('aria-labelledby="hotel-inspiration-title"'));
 assert.match(placement,/pathname==="\/hotels"/);
 assert.doesNotMatch(placement,/startsWith\(/);
 assert.match(offers,/bg-\[var\(--card\)\]/);
 assert.match(offers,/gth-btn-gold/);
 assert.doesNotMatch(offers+placement,/style=\{|<iframe|srcDoc|!important/);
});

test("official supplier list supplies authentic photos and its own exact White Label click",()=>{
 assert.match(offers,/NuiteeHotelsListWidget/);
 assert.match(offers,/placeId="ChIJwe1EZjDG5zsRaYxkjY_tpF0"/);
 assert.match(offers,/placeId="ChIJdd4hrwug2EcRmSrV3Vo6llI"/);
 assert.match(widget,/HOTEL_BOOKING_ORIGIN,HOTEL_WIDGET_SCRIPT/);
 assert.match(widget,/LiteAPI/);
 assert.match(widget,/HotelsList\.create\(options\)/);
 assert.match(widget,/domain:DOMAIN/);
 assert.match(widget,/hasSearchBar:false/);
 assert.match(widget,/deepLinkParams:`language=en&currency=\$\{displayCurrency\}`/);
 assert.match(widget,/getPropertyValue\("--gold"\)/);
 assert.doesNotMatch(widget,/onHotelClick:/);
 assert.doesNotMatch(widget,/NUITEE_PRODUCTION_API_KEY|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_NUITEE/);
});

test("unmapped directory hotel booking CTA goes direct to supplier domain, not in-app search",()=>{
 assert.match(provider,/https:\/\/gthproglobal\.nuitee\.link\/hotels\?language=en&currency=INR/);
 assert.doesNotMatch(provider,/\/hotels\?view=booking/);
 assert.match(offers,/HOTEL_BOOKING_ORIGIN\+"\/hotels\?language=en&currency=INR"/);
 assert.doesNotMatch(offers,/href="\/hotels\?view=booking"/);
 assert.match(guide,/gthproglobal\.nuitee\.link\/hotels\?language=en&currency=INR/);
 assert.doesNotMatch(guide,/href="\/hotels\?view=booking"/);
});

test("18 bounded city guides and SEO sitemap stay unchanged",()=>{
 const slugs=[...markets.matchAll(/\{slug:"([^"]+)",city:/g)].map(v=>v[1]);
 assert.equal(slugs.length,18);
 assert.equal(new Set(slugs).size,18);
 for(const name of ["mumbai","kolkata","delhi","chennai","hyderabad","ahmedabad","london","paris","new-york","tokyo"]){
  assert.ok(slugs.includes(name));
 }
 assert.match(guide,/getHotelMarket\(slug\)/);
 assert.match(guide,/if\(!market\)notFound\(\)/);
 assert.match(guide,/market\.areas\.map/);
 assert.match(guide,/FreeHotelDirectoryCards/);
 assert.match(sitemap,/HOTEL_MARKETS\.map\(market=>\(\{url:base\+"\/hotels\/explore\/"/);
});

test("no new paid hotel-data API, secret or unlicensed hotel photo claim",()=>{
 for(const path of [
 "src/app/api/hotels/nuitee-featured/route.ts",
 "src/lib/travel/nuitee-hotel-catalog.ts",
 "src/app/hotels/featured/[market]/[id]/page.tsx",
 "src/components/hotel/NuiteeHotelCard.tsx"
 ])assert.equal(existsSync(path),false,path);
 assert.doesNotMatch(widget+offers+guide,/api\.liteapi\.travel|NUITEE_PRODUCTION_API_KEY|GTH_NUITEE_PRODUCTION_ENABLED|\/api\/hotels\/nuitee-featured/);
 assert.match(offers,/Original property photo not available|Property photograph not available|source-backed hotel/i);
 assert.match(offers,/OpenStreetMap/);
 assert.match(widget,/No catalogue API key/);
});
