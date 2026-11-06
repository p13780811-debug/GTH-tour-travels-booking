import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("bus and train never generate artificial seat inventory or fares", () => {
  for (const path of ["src/app/bus/page.tsx", "src/app/train/page.tsx"]) {
    const source = read(path);
    assert.match(source, /TravelServicePage/);
    assert.match(source, /GTHTransportSearchWidget/);
    assert.doesNotMatch(source, /Math\.random|YOUR_API_KEY|select seat|Booked Seat|availableSeats/gi);
  }
});

test("travel planner validates local route and date without pretending to book", () => {
  const source = read("src/components/travel/TransportPlanner.tsx");
  assert.match(source, /todayLocal/);
  assert.match(source, /event\.preventDefault/);
  assert.match(source, /origin\.toLocaleLowerCase\(\) === destination\.toLocaleLowerCase\(\)/);
  assert.match(source, /Journey summary — not booked/);
  assert.match(source, /not sent to the provider/);
  assert.doesNotMatch(source, /fetch\(|localStorage|NEXT_PUBLIC_.*SECRET|YOUR_API_KEY/);
});

test("ground transport connects separate car rental and airport transfer pages", () => {
  const directory = read("src/app/mega-aggregator/EcosystemHub.tsx");
  const shared = read("src/components/travel/TravelServicePage.tsx");
  const legacy = read("src/app/cars/page.tsx");
  assert.match(directory, /href: "\/transfers"/);
  assert.match(directory, /href: "\/cars"/);
  assert.match(shared, /href: "\/bus"/);
  assert.match(shared, /href: "\/train"/);
  assert.match(shared, /href: "\/transfers"/);
  assert.match(legacy, /CarRentalPlanner/);
  assert.match(legacy, /TravelpayoutsCarWidget/);
});

test("global rail search uses GTH branding and does not imply railway API access", () => {
  const train = read("src/app/train/page.tsx");
  assert.match(train, /Global Train & Rail Journey Planning/);
  assert.match(train, /official railway PNR services are not integrated/);
  assert.match(train, /GTHTransportSearchWidget/);
  assert.doesNotMatch(train, /indianrailapi|Math\.random|YOUR_API_KEY|IRCTC|12Go|Busbud/);
});


test("car rental widget keeps exact markers and verified provider routes without fake offers", () => {
  const page = read("src/app/cars/page.tsx");
  const widget = read("src/components/travel/TravelpayoutsCarWidget.tsx");
  const planner = read("src/components/travel/CarRentalPlanner.tsx");
  const transfers = read("src/app/transfers/page.tsx");
  const oldCard = read("src/components/hotel/CarRental.tsx");
  const footer = read("src/components/sections/EcosystemFooter.tsx");
  assert.match(widget,/trs=504342&shmarker=417668/);
  assert.match(widget,/country=153&city=68511/);
  assert.match(widget,/campaign_id=87&promo_id=2466/);
  assert.match(widget,/document.createElement\("script"\)/);
  assert.match(widget,/mount.appendChild\(script\)/);
  assert.match(page,/alternates: \{ canonical: "\/cars" \}/);
  assert.match(page,/TravelpayoutsCarWidget/);
  assert.match(page,/CarRentalPlanner/);
  assert.match(page,/https:\/\/tpo.lv\/GFuzmgYk/);
  assert.match(transfers,/https:\/\/tpo.lv\/GFuzmgYk/);
  assert.match(planner,/localToday\(\)/);
  assert.match(planner,/Return the vehicle at a different location/);
  assert.match(planner,/not an inventory or price search/);
  assert.match(oldCard,/href="\/cars"/);
  assert.match(footer,/\["Car Rentals","\/cars"\]/);
  assert.doesNotMatch(page,/Math\.random|mockCars|fakePrice|guaranteed cheapest|NEXT_PUBLIC_.*KEY/);
});
