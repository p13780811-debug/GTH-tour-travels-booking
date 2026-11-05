import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("airport transfers use the existing GTH PRO full-width layout", () => {
  const page = read("src/app/transfers/page.tsx");
  assert.match(page, /<TravelServicePage\s+searchFirstLayout/);
  assert.match(page, /<TransferAirportFinder\s*\/>/);
  assert.match(page, /<TransferProviderWidgets\s*\/>/);
  assert.match(page, /<AirportJourneyServices\s*\/>/);
  assert.match(page, /<TransportPlanner mode="transfer"/);
  assert.match(page, /<details[\s\S]*<TravelPartnerSearch kind="transfers"/);
  assert.match(page, /href="\/travel\/airports"/);
});

test("existing supplier identifiers and tracked partner URLs remain intact", () => {
  const widget = read("src/components/travel/TransferProviderWidgets.tsx");
  assert.match(widget, /campaign_id=22&promo_id=1504/);
  assert.match(widget, /campaign_id=1&promo_id=3879/);
  assert.match(widget, /campaign_id=627&promo_id=8951/);
  assert.match(widget, /useState<WidgetType>\("options"\)/);
  assert.match(widget, /MutationObserver/);
  assert.match(widget, /setLoadState\("error"\)/);
  assert.match(widget, /https:\/\/tpo.lv\/GFuzmgYk/);
  assert.match(widget, /https:\/\/gettransfer.tpo.lv\/jpv6nsqO/);
  const planner = read("src/components/travel/TransportPlanner.tsx");
  assert.match(planner, /https:\/\/tpo.lv\/GFuzmgYk/);
  assert.doesNotMatch(planner, /https:\/\/www\.welcomepickups\.com\//);
});

test("Airport Explorer has an accessible shared Travel tab and provider context", () => {
  const nav = read("src/components/travel/TravelSectionNav.tsx");
  const flights = nav.indexOf('href:"/flights"');
  const explorer = nav.indexOf('href:"/travel/airports"');
  assert.ok(flights !== -1 && explorer > flights, "Airport Explorer must follow Flights in top tabs");
  const explorerPage = read("src/app/travel/airports/page.tsx");
  const guide = read("src/app/travel/airports/[iata]/page.tsx");
  assert.match(explorerPage, /<TravelSectionNav\s*\/>/);
  assert.match(guide, /<TravelSectionNav\s*\/>/);
  const lookup = read("src/components/travel/TransferAirportFinder.tsx");
  assert.match(lookup, /airportIndex/);
  assert.match(lookup, /href="#transfer-provider-heading"/);
  assert.match(lookup, /does not prefill a provider reservation/);
});

test("transfers integration never exposes credentials or creates paid bookings", () => {
  const files = [
    "src/app/transfers/page.tsx",
    "src/components/travel/TransferAirportFinder.tsx",
    "src/components/travel/TransferProviderWidgets.tsx",
  ];
  const source = files.map(read).join("\n");
  assert.doesNotMatch(source, /(?:process\.env\.[A-Z_]*SECRET|service_role|post_flights_bookings|prebookExperienceTour|api\.liteapi\.travel)/i);
});
