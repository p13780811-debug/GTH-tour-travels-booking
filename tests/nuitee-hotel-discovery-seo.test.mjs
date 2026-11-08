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
 assert.match(provider,/return "https:\/\/gthproglobal\.nuitee\.link\/\?language=en&currency=INR"/);
});

test("directory cards never fabricate an exact Nuitee hotel booking",()=>{
 assert.match(offers,/\/hotels\/stay\//);
 assert.match(offers,/HOTEL_WHITE_LABEL_ENTRY_URL/);
 assert.match(offers,/OpenStreetMap/);
 assert.match(offers,/image_attribution/);
 assert.match(offers,/No verified room price or availability/);
 assert.doesNotMatch(offers,/HOTEL_BOOKING_ORIGIN|hotelWhiteLabelUrl|\/hotels\/featured\/|getNuiteeMarketFeed/);
});

test("18 bounded hotel market guides preserve SEO and zero-rate-search scope",()=>{
 const slugs=[...markets.matchAll(/\{slug:"([^"]+)",city:/g)].map(v=>v[1]);
 assert.equal(slugs.length,18);
 assert.equal(new Set(slugs).size,slugs.length);
 for(const name of ["mumbai","kolkata","goa","delhi","chennai","hyderabad","ahmedabad","london","dubai","paris","tokyo","rome","new-york"])
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

test("homepage showcases one real sample per major Indian and global city with one batched read",()=>{
 const india=markets.match(/export const HOTEL_SHOWCASE_INDIA=\[([^\]]+)\] as const/);
 const global=markets.match(/export const HOTEL_SHOWCASE_WORLD=\[([^\]]+)\] as const/);
 assert.ok(india&&global,"Both market groups must be configured centrally");
 const decode=v=>[...v.matchAll(/"([^"]+)"/g)].map(x=>x[1]);
 const indiaCities=decode(india[1]),worldCities=decode(global[1]);
 assert.deepEqual(indiaCities,["mumbai","kolkata","delhi","chennai","hyderabad","ahmedabad"]);
 assert.deepEqual(worldCities,["london","paris","new-york","dubai","singapore","tokyo","bangkok","rome"]);
 assert.equal(new Set([...indiaCities,...worldCities]).size,14);
 assert.match(offers,/HOTEL_SHOWCASE_INDIA\.map\(slug=><ShowcaseCity/);
 assert.match(offers,/HOTEL_SHOWCASE_WORLD\.map\(slug=><ShowcaseCity/);
 assert.match(offers,/<EditorialExampleCard slug=\{slug\}\/>/);
 assert.doesNotMatch(offers,/fetch\("\/api\/hotels\/showcase"/);
 assert.match(offers,/IntersectionObserver/);
 assert.match(offers,/not Nuitee inventory or verified rankings/);
});
test("internal showcase endpoint is bounded, cache-backed, free, public-directory-only",()=>{
 const api=read("src/app/api/hotels/showcase/route.ts");
 assert.match(api,/import "server-only"/);
 assert.match(api,/unstable_cache/);
 assert.match(api,/HOTEL_SHOWCASE_INDIA,HOTEL_SHOWCASE_WORLD/);
 assert.match(api,/CACHE_SECONDS=12\*60\*60/);
 assert.match(api,/\.eq\("source","osm"\)/);
 assert.match(api,/\.eq\("category","hotel"\)/);
 assert.match(api,/\.limit\(8\)/);
 assert.match(api,/AbortSignal\.timeout\(8500\)/);
 assert.match(api,/source:"OpenStreetMap"/);
 assert.match(api,/hotelSourceImageUrl/);
 assert.doesNotMatch(api,/X-API-Key|NUITEE_PRODUCTION|NEXT_PUBLIC_NUITEE|service_role|rates\/book|prebook/i);
 assert.doesNotMatch(api,/insert\(|update\(|upsert\(|delete\(/);
});


test("global editorial examples are openly sourced and never represented as live inventory",()=>{
 const examples=read("src/lib/travel/hotel-editorial-examples.ts");
 const expected=["london","paris","new-york","dubai","singapore","tokyo","bangkok","rome"];
 for(const slug of expected){
   assert.ok(examples.includes(''+slug+':{name:')||examples.includes('"'+slug+'":{name:'),slug);
 }
 assert.equal((examples.match(/photo:\{file:/g)||[]).length,13);
 assert.match(offers,/getHotelEditorialExample\(slug\)/);
 assert.match(offers,/getHotelEditorialExample\(marketSlug\)/);
 assert.match(offers,/not verified Nuitee inventory/);
 assert.match(offers,/Hotel photograph awaiting verified reuse rights/);
 assert.doesNotMatch(examples,/hotelId\s*:|supplierId\s*:|booking_ready\s*:|NUITEE_PRODUCTION_API_KEY/);
});


test("all featured card booking links go to the Nuitee domain; details use a separate GTH page",()=>{
 const whitelabel=read("src/lib/travel/hotel-whitelabel.ts");
 const detail=read("src/app/hotels/stay/[id]/page.tsx");
 const editorial=read("src/app/hotels/example/[slug]/page.tsx");
 assert.match(whitelabel,/HOTEL_WHITE_LABEL_ENTRY_URL = \x60\$\{HOTEL_BOOKING_ORIGIN\}\/\?language=en&currency=INR\x60/);
 assert.match(offers,/href=\{HOTEL_WHITE_LABEL_ENTRY_URL\}/);
 assert.match(location,/href=\{HOTEL_WHITE_LABEL_ENTRY_URL\}/);
 assert.match(detail,/hotelProviderSearchUrl\(\[hotel\.name/);
 assert.match(editorial,/href=\{HOTEL_WHITE_LABEL_ENTRY_URL\}/);
 assert.match(offers,/\/hotels\/example\//);
 assert.doesNotMatch(offers+location,/href="\/hotels\?view=booking"/);
 assert.doesNotMatch(provider,/return "\/hotels\?view=booking"/);
});

test("photographed editorial hotel examples must provide exact-source licensed media metadata",()=>{
 const examples=read("src/lib/travel/hotel-editorial-examples.ts");
 const guide=read("src/app/hotels/example/[slug]/page.tsx");
 for(const name of ["mumbai","kolkata","delhi","chennai","hyderabad","ahmedabad","london","paris","new-york","singapore","tokyo","bangkok","rome"])
  assert.match(examples,new RegExp('(?:^|\\n)  "?'+name+'"?:\\{name:'));
 assert.match(examples,/commons\.wikimedia\.org\/wiki\/Special:FilePath/);
 assert.match(examples,/file:string;author:string;license:string;licenseUrl:string/);
 assert.match(offers,/editorialPhotoUrl\(example\.photo\)/);
 assert.match(offers,/editorialPhotoSource\(example\.photo\)/);
 assert.match(guide,/editorialPhotoUrl\(hotel\.photo\)/);
 assert.match(guide,/editorialPhotoSource\(hotel\.photo\)/);
 assert.match(guide,/index:false/);
 assert.doesNotMatch(guide,/booking\.com|price:\d|fake ratings|NUITEE_API_KEY/);
});
