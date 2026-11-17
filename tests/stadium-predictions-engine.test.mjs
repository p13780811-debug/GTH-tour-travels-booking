import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const engine = read("src/lib/stadium-predictions/refresh.ts");
const route = read("src/app/api/cron/stadium-predictions/route.ts");
const feed = read("src/components/stadium/TicketPredictionFeed.tsx");
const migration = read("supabase/migrations/20261118030000_stadium_ticket_predictions_engine.sql");
const cron = JSON.parse(read("vercel.json"));

test("GTH stadium odds are never fetched from visitor-facing pages", () => {
  assert.match(engine, /import "server-only"/);
  assert.match(engine, /process\.env\.ODDS_API_KEY/);
  assert.match(engine, /process\.env\.GEMINI_API_KEY/);
  assert.doesNotMatch(feed, /the-odds-api|generativelanguage\.googleapis|SERVICE_ROLE_KEY|className|style=/);
  assert.match(feed, /\.from\("stadium_tickets_predictions"\)/);
  assert.match(feed, /async function TicketPredictionFeed/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /Bearer /);
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /status: 401/);
});

test("The Odds Starter tier has a persistent atomic spending guard", () => {
  assert.match(engine, /MAX_ODDS_MONTH = 300/);
  assert.match(engine, /reserve\(db, "odds", month, 5, MAX_ODDS_MONTH\)/);
  assert.match(engine, /MAX_GEMINI_DAY = 4/);
  assert.match(engine, /STADIUM_GEMINI_FREE_TIER_CONFIRMED/);
  assert.match(engine, /stadium_prediction_refresh_claims/);
  assert.match(migration, /reserved_units.*EXCLUDED\.reserved_units/);
  assert.match(migration, /stadium_prediction_api_budget/);
  assert.match(migration, /SECURITY INVOKER/);
  assert.match(migration, /REVOKE ALL ON FUNCTION/);
});

test("Unverified event URLs and fuzzy team matching cannot generate ticket handoffs", () => {
  assert.match(engine, /safeSeatGeekUrl\(event\.url\)/);
  assert.match(engine, /seatgeek\.com/);
  assert.match(engine, /teams\.every\(team => a\.includes\(team\)\)/);
  assert.match(engine, /matches\.length === 1/);
  assert.match(engine, /Math\.abs\(Date\.parse\(date\)/);
  assert.match(engine, /onConflict: "match_id"/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /FOR SELECT TO anon, authenticated/);
  assert.match(migration, /GRANT SELECT, INSERT, UPDATE, DELETE ON public\.stadium_tickets_predictions TO service_role/);
});

test("Cron is daily and never modifies existing provider booking flows", () => {
  const schedule = cron.crons?.find(x => x.path === "/api/cron/stadium-predictions");
  assert.deepEqual(schedule, { path: "/api/cron/stadium-predictions", schedule: "0 3 * * *" });
  assert.match(read("src/app/stadiums/page.tsx"), /<TicketPredictionFeed\/>/);
  assert.doesNotMatch(engine, /NEXT_PUBLIC_ODDS|NEXT_PUBLIC_GEMINI|NEXT_PUBLIC_SEATGEEK/);
});
