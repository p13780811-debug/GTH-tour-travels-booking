import "server-only";
import { createClient } from "@supabase/supabase-js";

type JsonObject = Record<string, unknown>;
type OddsEvent = {
  id: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    markets?: Array<{
      key: string;
      outcomes?: Array<{ name: string; price: number }>;
    }>;
  }>;
};
type SeatGeekEvent = {
  id: number;
  title?: string;
  type?: string;
  url?: string;
  datetime_utc?: string;
  venue?: { name?: string };
  performers?: Array<{ name?: string }>;
};
type VerifiedMatch = {
  matchId: string;
  sport: string;
  home: string;
  away: string;
  date: string;
  venue: string;
  ticketUrl: string;
  odds: OddsEvent;
};
const ODDS_SPORTS = ["soccer_epl", "basketball_nba"] as const;
const MAX_ODDS_MONTH = 300; // reserve 200 of the 500 monthly Starter credits for other GTH use
const MAX_GEMINI_DAY = 4;
const MAX_MATCHES = 4;
const REQUEST_TIMEOUT_MS = 9000;
const scrub = (input: unknown, max: number) =>
  typeof input === "string"
    ? input.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
const canonical = (s: string) => s.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]/gu, "");
const safeDate = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT/.test(value)) return null;
  const ms = Date.parse(value.endsWith("Z") ? value : value + "Z");
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
};
const safeSeatGeekUrl = (value: unknown) => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["seatgeek.com", "www.seatgeek.com"].includes(url.hostname)) return null;
    if (url.username || url.password || url.search || url.hash || !/^\/[a-zA-Z0-9/_%-]+$/.test(url.pathname) || url.href.length > 1024) return null;
    return url.origin + url.pathname;
  } catch { return null; }
};
const timedFetch = (url: string, init?: RequestInit) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: "no-store" });

function serverDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
    throw new Error("Stadium refresh requires verified Supabase server configuration");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
type DB = ReturnType<typeof serverDb>;
async function reserve(db: DB, scope: "odds" | "gemini", period: string, units: number, limit: number) {
  const { data, error } = await db.rpc("reserve_stadium_prediction_budget", {
    p_scope: scope, p_period: period, p_units: units, p_limit: limit,
  });
  if (error) throw new Error("Stadium quota guard unavailable");
  return data === true;
}
function validateOdds(raw: unknown): OddsEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 40).flatMap(value => {
    if (!value || typeof value !== "object") return [];
    const o = value as JsonObject;
    const home = scrub(o.home_team, 110), away = scrub(o.away_team, 110);
    const date = safeDate(o.commence_time);
    if (!home || !away || !date || canonical(home) === canonical(away) || !scrub(o.id, 100)) return [];
    const bookmakers = Array.isArray(o.bookmakers) ? o.bookmakers.slice(0, 2).flatMap(b => {
      if (!b || typeof b !== "object") return [];
      const v = b as JsonObject;
      const key = scrub(v.key, 40);
      const markets = Array.isArray(v.markets) ? v.markets.filter(m =>
        m && typeof m === "object" && (m as JsonObject).key === "h2h"
      ).slice(0, 1).flatMap(m => {
        const items = (m as JsonObject).outcomes;
        const outcomes = Array.isArray(items) ? items.slice(0, 3).flatMap(x => {
          if (!x || typeof x !== "object") return [];
          const y = x as JsonObject, name = scrub(y.name, 110);
          const price = y.price;
          return name && typeof price === "number" && Number.isFinite(price) && price >= 1.01 && price <= 1000
            ? [{ name, price: Number(price.toFixed(3)) }] : [];
        }) : [];
        return outcomes.length ? [{ key: "h2h", outcomes }] : [];
      }) : [];
      return key && markets.length ? [{ key, markets }] : [];
    }) : [];
    return [{
      id: scrub(o.id, 100), sport_title: scrub(o.sport_title, 80) || "Sports",
      home_team: home, away_team: away, commence_time: date, bookmakers,
    }];
  });
}
function verifiedMatch(event: SeatGeekEvent, odd: OddsEvent): VerifiedMatch | null {
  if (!Number.isSafeInteger(event.id) || event.id <= 0 || !event.venue || !Array.isArray(event.performers)) return null;
  const date = safeDate(event.datetime_utc);
  const venue = scrub(event.venue.name, 150), title = scrub(event.title, 200);
  const url = safeSeatGeekUrl(event.url);
  if (!date || !venue || !url || !title || !/^(sports|sport|soccer|basketball|football|baseball|hockey)$/i.test(scrub(event.type, 30))) return null;
  const a = event.performers.map(p => canonical(scrub(p.name, 110))).filter(Boolean);
  if (a.length !== 2 || a[0] === a[1]) return null;
  const teams = [canonical(odd.home_team), canonical(odd.away_team)];
  if (!teams.every(team => a.includes(team))) return null;
  // Never infer an exact ticket from a similar venue name or one matching team.
  if (!teams.every(team => canonical(title).includes(team))) return null;
  if (Math.abs(Date.parse(date) - Date.parse(odd.commence_time)) > 3 * 60 * 60 * 1000) return null;
  const ms = Date.parse(date);
  if (ms <= Date.now() || ms > Date.now() + 31 * 86400000) return null;
  return {
    matchId: "seatgeek:" + event.id, sport: odd.sport_title, home: odd.home_team,
    away: odd.away_team, date, venue, ticketUrl: url, odds: odd,
  };
}
async function eventsFromSeatGeek(clientId: string) {
  if (!/^[A-Za-z0-9_-]{12,128}$/.test(clientId) || clientId === "NOT_CONFIGURED_SEATGEEK") return [] as SeatGeekEvent[];
  const endpoint = new URL("https://api.seatgeek.com/2/events");
  endpoint.searchParams.set("client_id", clientId);
  endpoint.searchParams.set("type", "sports");
  endpoint.searchParams.set("datetime_utc.gte", new Date().toISOString());
  endpoint.searchParams.set("per_page", "75");
  endpoint.searchParams.set("sort", "datetime_utc.asc");
  const response = await timedFetch(endpoint.toString());
  if (!response.ok) return [] as SeatGeekEvent[];
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as JsonObject).events)) return [];
  return ((payload as { events: SeatGeekEvent[] }).events).slice(0, 75);
}
async function aiExplanation(db: DB, match: VerifiedMatch, snapshot: JsonObject, day: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  // This is deliberately opt-in: a Google AI Pro app subscription is NOT API billing.
  // Never call Gemini unless the API project free tier has been explicitly confirmed.
  if (process.env.STADIUM_GEMINI_FREE_TIER_CONFIRMED !== "true" || !apiKey) return null;
  if (!await reserve(db, "gemini", day, 1, MAX_GEMINI_DAY)) return null;
  const instruction = [
    "Write a short, factual 80-140 word sports preview for ticket research only.",
    "Use only the provided teams, schedule, stadium and numerical odds snapshot.",
    "Never invent results, form, injuries, betting tips, win guarantees, or odds not supplied.",
    "Explain uncertainty and that prices/odds may change. Do not advise gambling.",
    "End with: This is informational analysis, not a guaranteed outcome.",
  ].join(" ");
  const payload = {
    contents: [{ role: "user", parts: [{ text: instruction + "\n" + JSON.stringify({
      sport: match.sport, home: match.home, away: match.away,
      match_date: match.date, stadium: match.venue, odds: snapshot,
    }) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 240 },
  };
  try {
    const modelUrl = new URL("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    const response = await timedFetch(modelUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;
    const text = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
      .candidates?.[0]?.content?.parts?.map(p => p.text ?? "").join(" ") ?? "";
    return scrub(text, 1300) || null;
  } catch { return null; }
}
export async function refreshStadiumPredictions() {
  const db = serverDb();
  const day = new Date().toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  // One claimed run per UTC day. DB unique key prevents duplicated Cron and concurrent consumers.
  const claim = await db.from("stadium_prediction_refresh_claims").insert({ run_day: day }).select("run_day").single();
  if (claim.error) {
    if (claim.error.code === "23505") return { status: "already-refreshed" as const };
    throw new Error("Stadium run lock unavailable");
  }
  const seatGeekKey = process.env.SEATGEEK_CLIENT_ID ?? "";
  const oddsKey = process.env.ODDS_API_KEY;
  // No ticket-provider identity => no attempt to spend a single Odds API credit.
  if (!/^[A-Za-z0-9_-]{12,128}$/.test(seatGeekKey) || seatGeekKey === "NOT_CONFIGURED_SEATGEEK" || !oddsKey) {
    return { status: "waiting-for-provider" as const };
  }
  let events: SeatGeekEvent[];
  try { events = await eventsFromSeatGeek(seatGeekKey); } catch { return { status: "ticket-source-unavailable" as const }; }
  if (!events.length) return { status: "no-verified-events" as const };
  let saved = 0, oddsRequests = 0;
  for (const sport of ODDS_SPORTS) {
    // Up to 2 calls/day, fixed 1 region x 1 market: at most ~62 requests in a 31-day month.
    if (!events.some(e => e.datetime_utc && /sports|soccer|basketball/i.test(e.type ?? ""))) break;
    if (!await reserve(db, "odds", month, 1, MAX_ODDS_MONTH)) break;
    oddsRequests++;
    const endpoint = new URL("https://api.the-odds-api.com/v4/sports/" + sport + "/odds");
    endpoint.searchParams.set("apiKey", oddsKey);
    endpoint.searchParams.set("regions", "us");
    endpoint.searchParams.set("markets", "h2h");
    endpoint.searchParams.set("oddsFormat", "decimal");
    let odds: OddsEvent[] = [];
    try {
      const response = await timedFetch(endpoint.toString());
      if (response.status === 401 || response.status === 402 || response.status === 429) break;
      if (!response.ok) continue;
      odds = validateOdds(await response.json());
    } catch { continue; }
    for (const odd of odds) {
      if (saved >= MAX_MATCHES) break;
      const match = events.map(e => verifiedMatch(e, odd)).find(Boolean) as VerifiedMatch | undefined;
      if (!match) continue;
      const bookmakers = (odd.bookmakers ?? []).map(b => ({
        bookmaker: b.key,
        outcomes: b.markets?.[0]?.outcomes ?? [],
      }));
      const snapshot: JsonObject = {
        status: bookmakers.length ? "snapshot" : "unavailable",
        source: "licensed-odds-provider",
        retrieved_at: new Date().toISOString(),
        bookmakers,
        note: "Odds snapshot is not live betting advice, guaranteed pricing, or ticket availability.",
      };
      const prediction = await aiExplanation(db, match, snapshot, day);
      const row = {
        match_id: match.matchId,
        sport_title: scrub(match.sport, 80),
        home_team: scrub(match.home, 110),
        away_team: scrub(match.away, 110),
        match_date: match.date,
        stadium_name: scrub(match.venue, 150),
        ticket_booking_link: match.ticketUrl,
        live_odds_data: snapshot,
        ai_prediction: prediction,
        last_updated_at: new Date().toISOString(),
      };
      const { error } = await db.from("stadium_tickets_predictions").upsert(row, { onConflict: "match_id" });
      if (error) throw new Error("Stadium prediction data write failed");
      saved++;
    }
  }
  return { status: "completed" as const, saved, oddsRequests };
}
