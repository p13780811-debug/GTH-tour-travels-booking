import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("visual Transfer Hub keeps all existing supplier-facing functionality", () => {
  const page = read("src/app/transfers/page.tsx");
  assert.match(page, /<TravelServicePage\s+searchFirstLayout/);
  assert.match(page, /<TransferHubShowcase\s*\/>/);
  for (const component of [
    "TransferAirportFinder",
    "TransferProviderWidgets",
    "TravelPartnerSearch",
    "AirportJourneyServices",
    "TransportPlanner",
  ]) {
    assert.match(page, new RegExp("<" + component + "\\b"));
  }
  assert.ok(
    page.indexOf("<TransferHubShowcase") < page.indexOf("<TransferAirportFinder"),
    "Photo gallery should be encountered before the long supplier tools",
  );
  assert.match(page, /canonical: "\/transfers"/);
});

test("all visual Transfer Hub images are real local files", () => {
  const data = read("src/lib/travel/transferHubCatalog.ts");
  const filePaths = [...data.matchAll(/image:\s*"(\/images\/[^"]+)"/g)].map(match => match[1]);
  assert.ok(filePaths.length >= 17, "Expected local transfer images plus a credited original airport photograph");
  assert.ok(new Set(filePaths).size >= 12, "Not enough visual variation");
  for (const url of filePaths) {
    assert.ok(existsSync(resolve(root, "public", url.slice(1))), `Missing local image: ${url}`);
  }
  const airportCodes = [...data.matchAll(/code:\s*"([A-Z]{3})"/g)].map(match => match[1]);
  assert.equal(airportCodes.length, 12);
  assert.equal(new Set(airportCodes).size, 12);
});

test("transfer galleries never imply live inventory or fabricated prices", () => {
  const data = read("src/lib/travel/transferHubCatalog.ts");
  const component = read("src/components/travel/TransferHubShowcase.tsx");
  assert.doesNotMatch(data, /api\.liteapi\.travel|booking_id|book_now|(?:₹|\$|USD|EUR)\s*\d+/i);
  assert.match(component, /not supplier inventory or guaranteed vehicle classes/i);
  assert.match(component, /not photographed cars/i);
  assert.match(component, /destinations|airport/i);
  assert.match(component, /#transfer-provider-heading/);
  assert.match(component, /rel="noopener noreferrer sponsored"/);
  assert.doesNotMatch(component, /fetch\(|localStorage|process\.env|NEXT_PUBLIC_/);
});

test("partner URLs are preserved from existing GTH PRO affiliate modules", () => {
  const catalog = read("src/lib/travel/transferHubCatalog.ts");
  const widgets = read("src/components/travel/TransferProviderWidgets.tsx");
  assert.match(catalog, /https:\/\/tpo.lv\/GFuzmgYk/);
  assert.match(catalog, /https:\/\/gettransfer.tpo.lv\/jpv6nsqO/);
  assert.match(widgets, /campaign_id=22&promo_id=1504/);
  assert.match(widgets, /campaign_id=1&promo_id=3879/);
  assert.match(widgets, /campaign_id=627&promo_id=8951/);
  assert.match(catalog, /Kiwitaxi/);
  assert.match(catalog, /intui\.travel/);
});

test("Mumbai card shows an actual credited airport photo and no misleading Gateway of India", () => {
  const catalog = read("src/lib/travel/transferHubCatalog.ts");
  const view = read("src/components/travel/TransferHubShowcase.tsx");
  const fallback = read("src/components/travel/TransferSpotlightImage.tsx");
  assert.match(catalog, /MumbaiAirportT2\.JPG/);
  assert.match(catalog, /Bombaywallas.*CC BY-SA 3\.0/);
  assert.match(catalog, /commons\.wikimedia\.org\/wiki\/File:MumbaiAirportT2\.JPG/);
  assert.match(catalog, /Chhatrapati Shivaji Maharaj International Airport/);
  assert.doesNotMatch(catalog, /code: "BOM"[^\n]+\/images\/cities\/mumbai\.jpg/);
  assert.match(view, /<TransferSpotlightImage/);
  assert.match(view, /<TourCarousel/);
  assert.match(view, /Transfers in \{destination\.city\}/);
  assert.match(fallback, /\/images\/mega\/transfers\.jpg/);
  assert.match(fallback, /unoptimized=\{external && !failed\}/);
});

test("supplier cards choose the right already-connected widget and use neutral buttons", () => {
  const catalog = read("src/lib/travel/transferHubCatalog.ts");
  const panel = read("src/components/travel/TransferProviderWidgets.tsx");
  assert.match(catalog, /href: "#transfer-widget-options"/);
  assert.match(catalog, /href: "#transfer-widget-airport"/);
  assert.match(panel, /addEventListener\("hashchange", syncHash\)/);
  assert.match(panel, /id="transfer-widget-options"/);
  assert.match(panel, /id="transfer-widget-airport"/);
  assert.doesNotMatch(catalog, /action: "View on partner"/);
  assert.match(read("src/app/transfers/page.tsx"), /actionLabel: "Explore pickup options"/);
});
