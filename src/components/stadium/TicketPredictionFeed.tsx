import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { officialTicketSearchUrl } from "@/lib/stadium-predictions/ticket-search";

type TicketPrediction = {
  id: number;
  match_id: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stadium_name: string;
  ticket_booking_link: string | null;
  ticket_discovery_mode: "search_only" | "provider_verified";
  live_odds_data: {
    status?: string;
    retrieved_at?: string;
    bookmakers?: Array<{ bookmaker: string; outcomes?: Array<{ name: string; price: number }> }>;
  } | null;
  ai_prediction: string | null;
  last_updated_at: string;
};
function sourceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
const cachedPredictions = unstable_cache(async (): Promise<TicketPrediction[]> => {
  const db = sourceClient();
  if (!db) return [];
  try {
    // Bounded public-RLS read; no service key or paid APIs during visits.
    const { data, error } = await db.from("stadium_tickets_predictions")
      .select("id,match_id,sport_title,home_team,away_team,match_date,stadium_name,ticket_booking_link,ticket_discovery_mode,live_odds_data,ai_prediction,last_updated_at")
      .gte("match_date", new Date().toISOString())
      .order("match_date", { ascending: true })
      .limit(12).abortSignal(AbortSignal.timeout(4500));
    return !error && Array.isArray(data) ? data as TicketPrediction[] : [];
  } catch { return []; }
}, ["gth-stadium-prediction-feed-v2"], { revalidate: 3600 });

export default async function TicketPredictionFeed() {
  const records = await cachedPredictions();
  if (!records.length) return (
    <section aria-labelledby="ticket-prediction-feed-heading">
      <h2 id="ticket-prediction-feed-heading">Upcoming matches and analysis</h2>
      <p>Matches Currently Unavailable — check the reviewed stadium calendars or return later.</p>
    </section>
  );
  return (
    <section aria-labelledby="ticket-prediction-feed-heading">
      <h2 id="ticket-prediction-feed-heading">Upcoming matches and analysis</h2>
      <p>Match previews are informational. Odds are cached snapshots, not live prices or guaranteed outcomes. Ticket availability is verified at the provider.</p>
      <div>
        {records.map(match => {
          const link = (() => {
            try {
              if (match.ticket_discovery_mode !== "provider_verified" || !match.ticket_booking_link) return null;
              const url = new URL(match.ticket_booking_link);
              return url.protocol === "https:" && ["seatgeek.com", "www.seatgeek.com"].includes(url.hostname)
                && !url.username && !url.password && !url.search && !url.hash
                && /^\/[a-zA-Z0-9/_%-]+$/.test(url.pathname) ? url.origin + url.pathname : null;
            } catch { return null; }
          })();
          const fallback = officialTicketSearchUrl(
            match.home_team, match.away_team, match.stadium_name, match.sport_title, match.match_date
          );
          const odds = match.live_odds_data;
          return (
            <article key={match.match_id}>
              <h3>{match.home_team} vs {match.away_team}</h3>
              <p><span>{match.sport_title}</span> · <span>{match.stadium_name}</span></p>
              <p><time dateTime={match.match_date}>{new Date(match.match_date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</time></p>
              {match.ai_prediction ? <p>{match.ai_prediction}</p> : <p>Analytical preview is not currently available.</p>}
              {odds?.status === "snapshot" ? (
                <div>
                  <p>Odds snapshot: {odds.retrieved_at ? new Date(odds.retrieved_at).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC" : "time unavailable"}</p>
                  {(odds.bookmakers ?? []).slice(0, 2).map(bookmaker => (
                    <div key={bookmaker.bookmaker}>
                      <p>{bookmaker.bookmaker}</p>
                      {(bookmaker.outcomes ?? []).slice(0, 3).map(outcome => (
                        <p key={outcome.name}><span>{outcome.name}</span>: <span>{Number(outcome.price).toFixed(2)}</span></p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : <p>Odds snapshot unavailable.</p>}
              {link ? <a href={link} target="_blank" rel="noopener noreferrer sponsored">Check exact-match ticket listing</a>
                : fallback ? <>
                  <p>Official tickets not currently listed on GTH PRO for this exact match.</p>
                  <a href={fallback} target="_blank" rel="noopener noreferrer nofollow">Search web for official tickets</a>
                  <p>Search results are not verified ticket inventory. Confirm match date and seller.</p>
                </> : <p>Matches Currently Unavailable — official ticket search could not be built.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
