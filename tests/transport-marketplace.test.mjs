import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("bus and train never generate artificial seat inventory or fares", () => {
  for (const path of ["src/app/bus/page.tsx", "src/app/train/page.tsx"]) {
    const source = read(path);
    assert.match(source, /TravelServicePage/);
    assert.match(source, /TransportPlanner/);
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

test("ground transport is connected and old car path redirects", () => {
  const mega = read("src/app/mega-aggregator/page.tsx");
  const shared = read("src/components/travel/TravelServicePage.tsx");
  const legacy = read("src/app/cars/page.tsx");
  assert.match(mega, /link: "\/transfers"/);
  assert.doesNotMatch(mega, /link: "\/cars"/);
  assert.match(shared, /href: "\/bus"/);
  assert.match(shared, /href: "\/train"/);
  assert.match(shared, /href: "\/transfers"/);
  assert.match(legacy, /redirect\("\/transfers"\)/);
});

test("train referral stays with official railway service, not mocked API", () => {
  const train = read("src/app/train/page.tsx");
  assert.match(train, /irctc\.co\.in/);
  assert.match(train, /enquiry\.indianrail\.gov\.in/);
  assert.doesNotMatch(train, /indianrailapi|Math\.random|YOUR_API_KEY/);
});
