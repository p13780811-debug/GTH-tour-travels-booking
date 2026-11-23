import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("destination index preserves curated places when provider is offline", () => {
  const page = read("src/app/destinations/page.tsx");
  const data = read("src/data/destinations.ts");
  assert.match(page, /curatedDestinations\.map/);
  assert.doesNotMatch(page, /select\("\*"\)/);
  assert.match(data, /slug: "new-york"/);
  assert.match(data, /slug: "mumbai"/);
  assert.doesNotMatch(data, /Math\.random|price:/);
});

test("destination detail keeps complete multi-word slug", () => {
  const page = read("src/app/destinations/[slug]/page.tsx");
  assert.match(page, /\.eq\("slug", slug\)/);
  assert.doesNotMatch(page, /slug\.split\("-"\)\[0\]/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /generateStaticParams/);
});

test("destination detail renders only exact-city supplier cards, no demo or DB inventory", () => {
  const page = read("src/app/destinations/[slug]/page.tsx");
  const panels=read("src/components/destination/DestinationSupplierPicks.tsx");
  assert.match(page, /<DestinationSupplierPicks city=\{destination\.name\} country=\{destination\.country\} countryCode=\{destination\.countryCode\}\/>/);
  assert.match(panels, /getSupplierCatalog\(/);
  assert.match(panels, /loadPersistedSupplierProducts\(parsed\.filters, mode, country\)/);
  assert.match(panels, /getSupplierAttractions\(/);
  assert.match(panels, /getFreeHotelProfiles\(/);
  assert.match(panels, /stadiums\.filter\(/);
  assert.match(panels, /\.slice\(0,3\)/);
  assert.match(panels, /cityName\(p\.city\)===cityName\(city\)/);
  assert.doesNotMatch(page, /<HotelResults|getTours\(|<OSMAttractionsRail|<OpenAttractionsRail/);
  assert.doesNotMatch(panels, /\.from\(["'](?:hotels|tours|destinations|activities)["']\)|Math\.random|guaranteed availability/);
});

test("destination detail offers connected planning articles", () => {
  const page = read("src/app/destinations/[slug]/page.tsx");
  assert.ok(page.includes("href={flightsHref}"));
  assert.match(page, /"\/blog\/"\s*\+\s*article\.slug/);
  assert.ok(page.includes("href={hotelsHref}"));
  assert.ok(page.includes("href={toursHref}"));
});


test("destination marketplace has real GET search, bounded pagination and bundled city imagery", () => {
  const list = read("src/app/destinations/page.tsx");
  const data = read("src/data/destinations.ts");
  assert.match(list, /action="\/destinations\/search" method="get"/);
  assert.match(list, /name="search"/);
  assert.match(list, /const perPage = 18/);
  assert.match(list, /\.range\(first, first \+ perPage - 1\)/);
  assert.match(list, /pageLink\(search,\s*page\s*\+\s*1,\s*country,\s*region,\s*sort,\s*view\)/);
  assert.match(list, /destinationImageForSlug\(item\.slug\)/);
  assert.match(data, /availableCityImages/);
  assert.match(data, /\/images\/default-city\.jpg/);
});

test("legacy Digha route reuses source-aware guide, never mock room prices", () => {
  const legacy = read("src/app/destinations/digha/page.tsx");
  assert.match(legacy, /DestinationPage params=\{params\}/);
  assert.doesNotMatch(legacy, /Digha Elite Coast|Marine Azure Resort|GTH Verified|\$450/);
  assert.doesNotMatch(legacy, /redirect\("\/destinations\/digha"\)/);
});


test("worldwide directory uses source-backed active rows, geographic filters and URL-stable pagination",()=>{
 const listing=read("src/app/destinations/page.tsx");
 const geography=read("src/lib/destinations/geography.ts");
 assert.match(listing,/\.is\("is_active", true\)/);
 assert.match(listing,/\.range\(first, first \+ perPage - 1\)/);
 assert.match(listing,/count: "exact", head: true/);
 assert.match(listing,/const countDirectory = unstable_cache/);
 assert.match(listing,/const readDirectoryPage = unstable_cache/);
 assert.doesNotMatch(listing,/offset < 1200/);
 assert.match(listing,/destinationGeography\(item\.slug, item\.country\)/);
 assert.match(listing,/name="region"/);
 assert.match(listing,/name="country"/);
 assert.match(listing,/name="sort"/);
 assert.match(listing,/role="search"/);
 assert.match(listing,/params\.set\("country", country\)/);
 assert.match(listing,/params\.set\("region", region\)/);
 assert.match(listing,/pageLink\(search,\s*page\s*\+\s*1,\s*country,\s*region,\s*sort,\s*view\)/);
 const card=read("src/components/destination/DestinationCard.tsx");
 assert.match(card,/Country information unavailable/);
 assert.match(listing,/editorial references/);
 assert.match(geography,/const cityGroups/);
 assert.match(geography,/const regionGroups/);
 assert.match(geography,/destinationGeography/);
 assert.doesNotMatch(listing,/SELECT \*|Math\.random|guaranteed room availability|mock price/i);
});
test("destination briefing shows accurate country context and valid existing hotel, tour and flight handoffs",()=>{
 const detail=read("src/app/destinations/[slug]/page.tsx");
 assert.match(detail,/\.eq\("is_active", true\)/);
 assert.match(detail,/destinationGeography\(slug, data\.country\)/);
 assert.match(detail,/destination\.country/);
 assert.match(detail,/aria-label="Destination page sections"/);
 assert.ok(detail.includes("href={hotelsHref}"));
 assert.ok(detail.includes("href={toursHref}"));
 assert.ok(detail.includes("href={flightsHref}"));
 assert.match(detail,/<DestinationSupplierPicks city=\{destination\.name\} country=\{destination\.country\} countryCode=\{destination\.countryCode\}\/>/);
 assert.doesNotMatch(detail,/<HotelResults|getTours\(/);
 assert.doesNotMatch(detail,/reserve now|confirmed booking|guaranteed cheapest/i);
});

test("destination search opens a separate results page and an exact city detail", () => {
  const directory = read("src/app/destinations/page.tsx");
  const search = read("src/app/destinations/search/page.tsx");
  const geo = read("src/components/destination/GeoCityIntro.tsx");
  assert.match(directory, /redirect\("\/destinations\/search\?" \+ query\.toString\(\)\)/);
  assert.match(directory, /action="\/destinations\/search" method="get"/);
  assert.match(geo, /action="\/destinations\/search"/);
  assert.match(search, /redirect\(destinationDetailHref\(exact\[0\]\)\)/);
  assert.match(search, /\.is\("is_active", true\)/);
  assert.match(search, /\.limit\(MAX_RESULTS\)/);
  assert.match(search, /const searchDirectory = unstable_cache/);
  assert.match(search, /country && geography\.country !== country/);
  assert.match(search, /exactLookupSucceeded && exact.length === 1/);
  assert.doesNotMatch(search, /Math\.random|guaranteed availability/);
});
