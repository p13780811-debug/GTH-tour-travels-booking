import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const resolver = read("src/lib/stadium-predictions/ticket-sources.ts");
const layers = read("src/components/stadium/StadiumTicketDiscovery.tsx");
const stadium = read("src/app/stadiums/[slug]/page.tsx");
const hub = read("src/app/stadiums/page.tsx");
const event = read("src/app/events/[sport]/[slug]/page.tsx");
const venues = read("src/lib/travel/stadiums.ts");
const fixtures = read("src/lib/stadium-predictions/fixtures.ts");
const registry = read("src/lib/travel/stadium-ticket-destinations.ts");

test("Official-first venue ticket sources must be organizer-reviewed, never fake live stock", () => {
  assert.match(resolver, /export function organizerTicketSources/);
  assert.match(resolver, /event\.url === match\.officialUrl/);
  assert.match(resolver, /sameDay\(event\.starts, match\.starts\)/);
  assert.match(resolver, /sameMatch\(venue\.name, match\.venue\)/);
  assert.match(resolver, /event\.label\.toLocaleLowerCase/);
  assert.match(resolver, /verifiedForMatch: false/);
  assert.match(layers, /Official tickets not currently listed on GTH PRO/);
  assert.match(layers, /A schedule is not proof that tickets are on sale/);
  assert.match(stadium, /<StadiumTicketDiscovery venue=\{venue\}\/>/);
  assert.match(event, /<StadiumTicketDiscovery venue=\{venue\} match=\{match\} \/>/);
});

test("Marketplaces cannot get generic event CTAs without exact match validation", () => {
  for (const marketplace of ["ticketmaster", "axs", "seatgeek", "ticketek"])
    assert.match(resolver, new RegExp(marketplace + ': \\['));
  assert.match(resolver, /reviewedMarketplaceSources: readonly ExactMarketplaceSource\[\] = \[\]/);
  assert.match(resolver, /item\.matchId === match\.id/);
  assert.match(resolver, /item\.venueSlug === venue\.slug/);
  assert.match(resolver, /sameMatch\(item\.home, match\.home\)/);
  assert.match(resolver, /sameMatch\(item\.away, match\.away\)/);
  assert.match(resolver, /sameDay\(item\.date, match\.starts\)/);
  assert.match(resolver, /url\.protocol !== "https:"/);
  assert.match(resolver, /url\.username \|\| url\.password/);
  assert.match(resolver, /!allowed\.includes\(url\.hostname\)/);
  assert.match(resolver, /seatgeek:\[1-9\]/);
  assert.doesNotMatch(resolver, /\/api\/|fetch\(|SUPABASE_SERVICE_ROLE_KEY|ODDS_API_KEY|NEXT_PUBLIC_SECRET/);
  assert.match(layers, /No exact-match Ticketmaster, AXS, SeatGeek or authorized resale listing is currently verified/);
});

test("Country and sport scoped directories cannot masquerade as verified match tickets", () => {
  assert.match(resolver, /venue\.countryCode === "IN"/);
  assert.match(resolver, /venue\.countryCode === "AU"/);
  assert.match(resolver, /venue\.city === "Kolkata"/);
  assert.match(resolver, /category === "cricket"/);
  assert.match(registry, /id:"bookmyshow-cricket"/);
  assert.match(registry, /id:"district-kolkata-sports"/);
  assert.match(registry, /id:"ticketek-au-sports"/);
  assert.match(registry, /kind:"regional-discovery"/);
  assert.match(layers, /the organizer has NOT confirmed them as sellers/);
  assert.doesNotMatch(event, /href=\{toursHref\}/);
});

test("Lord's official MCC fixture is sport-scoped, and venue tours are not a match-ticket fallback", () => {
  assert.match(venues, /slug: "lords-cricket-ground"/);
  assert.match(venues, /url: "https:\/\/tickets\.lords\.org\/"/);
  assert.match(venues, /starts: "2027-06-30", ends: "2027-07-04"/);
  assert.match(fixtures, /slug: "lords-cricket-ground"/);
  assert.match(fixtures, /horizonDays = 365/);
  assert.doesNotMatch(stadium, /stadiumPartnerSearchLinks\(|partnerSearch\.klook|partnerSearch\.getyourguide/);
  assert.doesNotMatch(hub, /<StadiumPartnerDiscovery\/>|stadiumAffiliateHref|View venue experience/);
  assert.match(event, /href="\/transfers"/);
  assert.match(layers, /GTH Match-Day Concierge/);
});
