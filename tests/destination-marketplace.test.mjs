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

test("destination page integrates real hotel and tour inventory without fake prices", () => {
  const page = read("src/app/destinations/[slug]/page.tsx");
  assert.match(page, /<HotelResults city=\{destination\.name\}/);
  assert.match(page, /getTours\(\{ city: slug \}\)/);
  assert.match(page, /String\(tour\.id\)/);
  assert.doesNotMatch(page, /₹4,999|AI selected|guaranteed availability|<ActivitySection/);
});

test("destination detail offers connected planning articles", () => {
  const page = read("src/app/destinations/[slug]/page.tsx");
  assert.match(page, /href="\/flights"/);
  assert.match(page, /"\/blog\/" \+ article\.slug/);
  assert.match(page, /\/hotels\?city=/);
  assert.match(page, /\/tours\?city=/);
});


test("destination marketplace has real GET search, bounded pagination and bundled city imagery", () => {
  const list = read("src/app/destinations/page.tsx");
  const data = read("src/data/destinations.ts");
  assert.match(list, /action="\/destinations" method="get"/);
  assert.match(list, /name="search"/);
  assert.match(list, /const perPage = 18/);
  assert.match(list, /filtered\.slice\(/);
  assert.match(list, /pageLink\(search, page \+ 1\)/);
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
