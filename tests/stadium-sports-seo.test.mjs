import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const source = read("src/lib/stadium-predictions/seo.ts");
const hub = read("src/app/sports-tickets-predictions/page.tsx");
const detail = read("src/app/events/[sport]/[slug]/page.tsx");
const venue = read("src/components/stadium/StadiumVerifiedMatchLinks.tsx");
const stadium = read("src/app/stadiums/[slug]/page.tsx");
const sitemap = read("src/app/sitemap.ts");
const refresh = read("src/lib/stadium-predictions/refresh.ts");

test("Each match gets a sport-scoped canonical URL, without fuzzy sport mixing", () => {
  assert.match(source, /"\/events\/" \+ sportSegment\(match\.sport\)/);
  assert.match(source, /"-vs-" \+ second/);
  assert.match(source, /venue\.sports\.some\(item => sportSegment\(item\) === sport\)/);
  assert.match(venue, /matchedVenue\(match\)\?\.slug === venueSlug/);
  assert.match(stadium, /<StadiumVerifiedMatchLinks venueSlug=\{venue\.slug\}\/>/);
  assert.match(refresh, /sportTagsMatch\(e, sport\)/);
  assert.match(refresh, /event\.taxonomies/);
  assert.match(refresh, /return false;/);
  for (const sport of ["cricket", "football", "tennis", "basketball", "baseball"]) {
    assert.match(hub, new RegExp('key: "' + sport + '"'));
  }
});
test("Pages use verified event IDs and scoped public RLS reads, never live provider requests", () => {
  assert.match(source, /unstable_cache/);
  assert.match(source, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(source, /\.limit\(100\)/);
  assert.match(source, /AbortSignal\.timeout\(4500\)/);
  assert.match(source, /calendar:/);
  assert.match(source, /reviewedSportsFixtures\(\)/);
  assert.match(source, /id\.startsWith\("calendar:"\)/);
  assert.doesNotMatch(source + hub + detail + venue, /SUPABASE_SERVICE_ROLE_KEY|ODDS_API_KEY|GEMINI_API_KEY|api\.the-odds-api\.com|api\.seatgeek\.com|fetch\(/);
});
test("Only verified upcoming, source-backed match URLs enter the sitemap", () => {
  assert.match(sitemap, /upcomingMatchPages\(\)/);
  assert.match(sitemap, /sportsMatches\.filter\(indexableMatch\)\.slice\(0, 100\)/);
  assert.match(source, /matchedVenue\(match\)/);
  assert.match(source, /match\.officialUrl \|\| match\.ticketUrl/);
  assert.match(detail, /robots: \{ index: isPublicLaunch\(\) && indexableMatch\(match\)/);
  assert.match(detail, /alternates: \{ canonical: siteUrl\(matchSeoPath\(match\)!\) \}/);
});
test("SportsEvent markup describes facts, not fake ticket prices or inventory", () => {
  assert.match(detail, /"@type": "SportsEvent"/);
  assert.match(detail, /"@type": "BreadcrumbList"/);
  assert.match(detail, /<JsonLd data=/);
  assert.match(detail, /match\.ticketUrl\) event\.offers/);
  assert.doesNotMatch(detail, /availability:|priceCurrency:|lowPrice:|ratingValue:/);
  assert.match(detail, /normalized market-implied probabilities/i);
  assert.match(detail, /No guessed win percentage will be shown/);
});
test("Affiliate handoffs preserve existing route and date validation flows", () => {
  assert.match(detail, /safeHotelHandoff\(venue\)/);
  assert.match(detail, /href="\/bus"/);
  assert.match(detail, /href="\/train"/);
  assert.doesNotMatch(detail, /href=\{toursHref\}/);
  assert.match(detail, /href="\/transfers"/);
  assert.doesNotMatch(detail, /\/go\/transport\/search\?/);
  assert.match(source, /seatgeek\.com/);
  assert.match(source, /url\.username \|\| url\.password \|\| url\.search \|\| url\.hash/);
});


test("Sports hub remains useful without third-party API approval or live ticket stock", () => {
  assert.match(hub, /import \{ stadiums \} from "@\/lib\/travel\/stadiums"/);
  assert.match(hub, /venue\.sports\.some\(sport => sportSegment\(sport\) === active\)/);
  assert.match(hub, /"\/stadiums\/" \+ venue\.slug/);
  assert.match(hub, /Stadium &amp; official-calendar guides/);
  assert.match(hub, /Stadium information is not confirmation of an upcoming match or ticket inventory/);
  assert.doesNotMatch(hub, /href="\/tours"|affiliate key|ODDS_API_KEY|SEATGEEK_CLIENT_ID|GEMINI_API_KEY/);
});
