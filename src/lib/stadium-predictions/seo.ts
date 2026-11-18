import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { stadiums } from "@/lib/travel/stadiums";

export type OddsSnapshot = {
  status?: string;
  retrieved_at?: string;
  region?: string;
  bookmakers?: Array<{ bookmaker: string; outcomes?: Array<{ name: string; price: number }> }>;
};
export type SportsSeoMatch = {
  id: string;
  source: "reviewed-calendar" | "verified-event-feed";
  sport: string;
  home: string;
  away: string;
  starts: string;
  ends?: string;
  venue: string;
  city?: string;
  countryCode?: string;
  officialUrl?: string;
  ticketUrl?: string;
  odds?: OddsSnapshot;
  analysis?: string;
  updated?: string;
};
const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
const dateOk = (value: unknown) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value.slice(0, 10);
const pathPart = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
export function sportSegment(value: string) {
  if (/cricket|twenty20|\bt20\b|\bipl\b|big bash|test matches/i.test(value)) return "cricket";
  if (/football|soccer|premier league|epl|uefa|la liga|bundesliga/i.test(value)) return "football";
  if (/tennis|\batp\b|\bwta\b|wimbledon|roland.garros/i.test(value)) return "tennis";
  if (/basketball|nba/i.test(value)) return "basketball";
  if (/baseball|mlb/i.test(value)) return "baseball";
  if (/rugby/i.test(value)) return "rugby";
  return "other-sports";
}
export function matchSeoPath(match: SportsSeoMatch): string | null {
  if (!dateOk(match.starts)) return null;
  const first = pathPart(match.home), second = pathPart(match.away);
  if (first.length < 2 || second.length < 2 || first === second) return null;
  return "/events/" + sportSegment(match.sport) + "/" + first + "-vs-" + second +
    "-tickets-prediction-" + match.starts.slice(0, 10);
}
export function matchedVenue(match: SportsSeoMatch) {
  const sport = sportSegment(match.sport);
  if (sport === "other-sports") return undefined;
  return stadiums.find(venue => venue.name.toLowerCase() === match.venue.toLowerCase() &&
    venue.sports.some(item => sportSegment(item) === sport));
}
function ticketUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 1024) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["seatgeek.com", "www.seatgeek.com"].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash ||
      !/^\/[a-zA-Z0-9/_%-]+$/.test(url.pathname)) return undefined;
    return url.origin + url.pathname;
  } catch { return undefined; }
}
// This list refers only to individually reviewed fixtures in the existing
// GTH stadium directory. Never infer a fixture from a stadium name.
const reviewedFixtures = [
  { venue: "melbourne-cricket-ground", title: "Australia vs England men’s T20I", home: "Australia", away: "England" },
  { venue: "melbourne-cricket-ground", title: "Australia vs New Zealand Boxing Day Test", home: "Australia", away: "New Zealand" },
  { venue: "melbourne-cricket-ground", title: "Australia vs England 150th Anniversary Test", home: "Australia", away: "England" },
] as const;
function calendarMatches(): SportsSeoMatch[] {
  return reviewedFixtures.flatMap(item => {
    const venue = stadiums.find(v => v.slug === item.venue);
    const event = venue?.events?.find(e => e.label === item.title);
    if (!venue || !event || !dateOk(event.starts)) return [];
    return [{
      id: venue.slug + ":" + event.starts + ":" + pathPart(event.label),
      source: "reviewed-calendar" as const, sport: "Cricket",
      home: item.home, away: item.away, starts: event.starts, ends: event.ends,
      venue: venue.name, city: venue.city, countryCode: venue.countryCode, officialUrl: event.url,
    }];
  });
}
const cachedDatabaseMatches = unstable_cache(async (day: string): Promise<SportsSeoMatch[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const until = new Date(Date.parse(day + "T00:00:00Z") + 90 * 86400000).toISOString();
    const { data, error } = await db.from("stadium_tickets_predictions")
      .select("match_id,sport_title,home_team,away_team,match_date,stadium_name,ticket_booking_link,live_odds_data,ai_prediction,last_updated_at")
      .gte("match_date", day + "T00:00:00Z").lt("match_date", until)
      .order("match_date", { ascending: true }).limit(100)
      .abortSignal(AbortSignal.timeout(4500));
    if (error || !Array.isArray(data)) return [];
    return data.flatMap((row): SportsSeoMatch[] => {
      const id = clean(row.match_id, 40), sport = clean(row.sport_title, 80);
      const home = clean(row.home_team, 110), away = clean(row.away_team, 110);
      const starts = clean(row.match_date, 50), venue = clean(row.stadium_name, 150);
      if (!/^seatgeek:[1-9][0-9]{0,18}$/.test(id) || !dateOk(starts) ||
          !sport || home.length < 2 || away.length < 2 || venue.length < 2) return [];
      const stadium = stadiums.find(s => s.name.toLowerCase() === venue.toLowerCase() &&
        s.sports.some(category => sportSegment(category) === sportSegment(sport)));
      const odds = row.live_odds_data && typeof row.live_odds_data === "object"
        ? row.live_odds_data as OddsSnapshot : undefined;
      return [{
        id, source: "verified-event-feed", sport, home, away, starts, venue,
        city: stadium?.city, countryCode: stadium?.countryCode,
        ticketUrl: ticketUrl(row.ticket_booking_link), odds,
        analysis: clean(row.ai_prediction, 1300) || undefined,
        updated: dateOk(row.last_updated_at) ? row.last_updated_at : undefined,
      }];
    });
  } catch { return []; }
}, ["gth-sports-match-seo-v1"], { revalidate: 3600 });

export function indexableMatch(match: SportsSeoMatch) {
  return Boolean(matchSeoPath(match) && matchedVenue(match) && match.city && match.countryCode &&
    (match.officialUrl || match.ticketUrl));
}
export async function upcomingMatchPages(now = new Date()): Promise<SportsSeoMatch[]> {
  const fromDb = await cachedDatabaseMatches(now.toISOString().slice(0, 10));
  const valid = [...calendarMatches(), ...fromDb].filter(match =>
    matchSeoPath(match) && (match.source === "reviewed-calendar"
      ? (match.ends || match.starts).slice(0, 10) >= now.toISOString().slice(0, 10)
      : Date.parse(match.starts) > now.getTime()));
  const byPath = new Map<string, SportsSeoMatch | null>();
  for (const match of valid) {
    const path = matchSeoPath(match)!;
    if (!byPath.has(path)) { byPath.set(path, match); continue; }
    const existing = byPath.get(path);
    if (existing && existing.venue.toLowerCase() === match.venue.toLowerCase() &&
        existing.home.toLowerCase() === match.home.toLowerCase() &&
        existing.away.toLowerCase() === match.away.toLowerCase()) {
      byPath.set(path, match.source === "verified-event-feed"
        ? { ...match, officialUrl: existing.officialUrl || match.officialUrl }
        : { ...existing, officialUrl: match.officialUrl || existing.officialUrl });
    } else {
      // Same sport/teams/day at multiple venues: don't send a visitor to the wrong event.
      byPath.set(path, null);
    }
  }
  return [...byPath.values()].filter((match): match is SportsSeoMatch => match !== null)
    .sort((a, b) => a.starts.localeCompare(b.starts));
}
export type MarketEstimate = { bookmaker: string; region: string; teams: Array<{ name: string; price: number; implied: number }> };
export function matchMarketEstimates(match: SportsSeoMatch): MarketEstimate[] {
  if (match.odds?.status !== "snapshot" || !Array.isArray(match.odds.bookmakers)) return [];
  return match.odds.bookmakers.slice(0, 4).flatMap(bookmaker => {
    if (!Array.isArray(bookmaker.outcomes) || !clean(bookmaker.bookmaker, 50)) return [];
    const outcomes = bookmaker.outcomes.filter(row =>
      row && typeof row.name === "string" && typeof row.price === "number" &&
      Number.isFinite(row.price) && row.price >= 1.01 && row.price <= 1000 &&
      [match.home.toLowerCase(), match.away.toLowerCase(), "draw"].includes(row.name.toLowerCase()));
    if (outcomes.length < 2 || outcomes.length > 3 ||
        !outcomes.some(x => x.name.toLowerCase() === match.home.toLowerCase()) ||
        !outcomes.some(x => x.name.toLowerCase() === match.away.toLowerCase())) return [];
    const total = outcomes.reduce((sum, row) => sum + 1 / row.price, 0);
    if (!Number.isFinite(total) || total <= 0) return [];
    return [{ bookmaker: clean(bookmaker.bookmaker, 50),
      region: match.odds?.region || "US region snapshot",
      teams: outcomes.map(row => ({ name: clean(row.name, 110), price: row.price,
        implied: Math.round(1000 / row.price / total) / 10 })) }];
  });
}
