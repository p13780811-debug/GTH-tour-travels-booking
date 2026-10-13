import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("tour API never exposes raw database rows", () => {
  const api = read("src/app/api/tours/route.ts");
  const helper = read("src/lib/tours.ts");
  assert.doesNotMatch(api + helper, /select\("\*"\)/);
  assert.match(helper, /price_numeric/);
  assert.match(helper, /Invalid tour filters/);
  assert.match(api, /Cache-Control/);
});

test("tour listing cards are linked to unique records, not the city only", () => {
  const page = read("src/app/tours/page.tsx");
  assert.match(page, /String\(tour\.id\)/);
  assert.doesNotMatch(page, /<MapWrapper/);
  assert.doesNotMatch(page, /BEST DEAL|Instant Booking|Guaranteed Price/);
  assert.match(page, /href: "\/hotels"/);
  assert.match(page, /href: "\/flights"/);
});

test("tour detail validates partner links and rejects invented reservations", () => {
  const page = read("src/app/tours/[slug]/page.tsx");
  assert.match(page, /publicPartnerLink/);
  assert.match(page, /rel="noopener noreferrer sponsored"/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /\.eq\("id", slug\)/);
  assert.doesNotMatch(page, /partner-site\.com|Best price guarantee|No hidden charges|Limited seats/);
});

test("related tour cards use unique item identifiers", () => {
  const component = read("src/components/RelatedCarousel.tsx");
  assert.match(component, /item\.id \?\? item\.city_slug/);
  assert.doesNotMatch(component, /rating \?\? "4\.5"/);
});
