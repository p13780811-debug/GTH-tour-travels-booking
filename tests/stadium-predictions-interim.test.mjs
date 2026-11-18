import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const workflow = read(".github/workflows/gth-osm-attractions-sync.yml");
const sports = read("src/lib/stadium-predictions/sports.ts");
const fixtures = read("src/lib/stadium-predictions/fixtures.ts");
const engine = read("src/lib/stadium-predictions/refresh.ts");
const ticketSearch = read("src/lib/stadium-predictions/ticket-search.ts");
const detail = read("src/app/events/[sport]/[slug]/page.tsx");
const feed = read("src/components/stadium/TicketPredictionFeed.tsx");
const originalMigration = read("supabase/migrations/20261118030000_stadium_ticket_predictions_engine.sql");
const followUpMigration = read("supabase/migrations/20261118163000_stadium_ticket_safe_discovery.sql");

test("Old hourly OSM imports must remain completely disabled during the database I/O incident", () => {
  assert.doesNotMatch(workflow, /cron: "[^"]+"/);
  assert.match(workflow, /if: \$\{\{ false \}\}/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^  schedule:|^  push:/m);
  assert.doesNotMatch(workflow, /cron: "37 \* \* \* \*"/);
});

test("Odds keys use real provider sport IDs and active tournament-specific tennis IDs", () => {
  for (const key of [
    "cricket_test_match", "cricket_odi", "cricket_international_t20",
    "soccer_epl", "basketball_nba"
  ]) assert.ok(sports.includes('"' + key + '"'), key);
  assert.match(sports, /tennis_\(\?:atp\|wta\)_/);
  assert.match(sports, /row\.active !== true/);
  assert.doesNotMatch(sports, /"cricket_t20_intl"|"tennis_atp"|"tennis_wta"/);
  assert.match(engine, /discoverActiveSports\(oddsKey\)/);
  assert.match(engine, /activeOddsKeys\(await response\.json\(\)\)/);
  assert.match(engine, /"matches-currently-unavailable"/);
});

test("Odds may run without SeatGeek only for exact organizer-reviewed cricket fixtures", () => {
  assert.match(engine, /const fixtures = reviewedSportsFixtures\(new Date\(\), 31\)/);
  assert.match(engine, /verifiedCalendarMatch\(f, odd\)/);
  assert.match(engine, /fixture\.timeZone/);
  assert.match(engine, /localDate !== fixture\.starts/);
  assert.match(engine, /sportTagsMatch\(e, sport\)/);
  assert.match(fixtures, /APPROVED/);
  assert.match(fixtures, /item\.label === entry\.label/);
  assert.match(fixtures, /venue\.sports\.includes\("Cricket"\)/);
  assert.match(engine, /MAX_ODDS_REQUESTS_PER_RUN = 2/);
  assert.match(engine, /reserve\(db, "odds", month, 5, MAX_ODDS_MONTH\)/);
  assert.match(engine, /MAX_ODDS_MONTH = 300/);
  assert.match(engine, /MAX_GEMINI_DAY = 4/);
});

test("Schema follow-up is forward only and does not change public grants or original RLS", () => {
  assert.match(originalMigration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(followUpMigration, /ADD COLUMN IF NOT EXISTS ticket_discovery_mode/);
  assert.match(followUpMigration, /calendar:/);
  assert.match(followUpMigration, /ticket_booking_link IS NULL AND ticket_discovery_mode = 'search_only'/);
  assert.match(followUpMigration, /ticket_booking_link IS NOT NULL AND ticket_discovery_mode = 'provider_verified'/);
  assert.doesNotMatch(followUpMigration, /DISABLE ROW LEVEL SECURITY|GRANT ALL|SERVICE_ROLE_KEY|DROP TABLE/);
});

test("Google search fallback is separate from official inventory and cannot be disguised as an Offer", () => {
  assert.match(ticketSearch, /https:\/\/www\.google\.com\/search/);
  assert.match(ticketSearch, /url\.searchParams\.set\("q", query\)/);
  assert.match(ticketSearch, /normalize\("NFKC"\)/);
  assert.match(detail, /Search web for official tickets/);
  assert.match(detail, /Check official organizer event information/);
  assert.match(detail, /Official tickets not currently listed on GTH PRO/);
  assert.match(feed, /Search web for official tickets/);
  assert.match(feed, /Matches Currently Unavailable/);
  assert.match(feed, /unstable_cache/);
  assert.match(feed, /AbortSignal\.timeout\(4500\)/);
  assert.match(detail, /if \(match\.ticketUrl\) event\.offers/);
  assert.doesNotMatch(ticketSearch.replace(/\/\*[\s\S]*?\*\//g, ""), /affiliate|seatgeek\.com|ticket_booking_link|availability|price:/i);
  for (const path of ["src/lib/travel/stadium-concierge.ts", "src/app/events/[sport]/[slug]/page.tsx"]) {
    assert.doesNotMatch(read(path), /NEXT_PUBLIC_ODDS_API_KEY|NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  }
});

test("Unapplied prediction schema cannot generate ANY Supabase reads or paid API refreshes", () => {
  const seo = read("src/lib/stadium-predictions/seo.ts");
  assert.match(seo, /GTH_STADIUM_PREDICTIONS_DB_ENABLED !== "true"/);
  assert.match(feed, /GTH_STADIUM_PREDICTIONS_DB_ENABLED !== "true"/);
  assert.match(engine, /GTH_STADIUM_PREDICTIONS_DB_ENABLED !== "true"/);
  assert.match(engine, /"database-activation-pending"/);
  const vercel = JSON.parse(read("vercel.json"));
  assert.equal(vercel.crons?.some(x => x.path === "/api/cron/stadium-predictions") ?? false, false);
});
