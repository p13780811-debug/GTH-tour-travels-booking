import { createClient } from "@supabase/supabase-js";

type TicketPrediction = {
  id: number;
  match_id: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stadium_name: string;
  ticket_booking_link: string | null;
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
export default async function TicketPredictionFeed() {
  const db = sourceClient();
  if (!db) return null;
  // Public RLS controls visibility. No service role, no live odds or AI calls on visitor requests.
  const { data, error } = await db.from("stadium_tickets_predictions")
    .select("id,match_id,sport_title,home_team,away_team,match_date,stadium_name,ticket_booking_link,live_odds_data,ai_prediction,last_updated_at")
    .gte("match_date", new Date().toISOString())
    .order("match_date", { ascending: true })
    .limit(12);
  if (error || !Array.isArray(data) || data.length === 0) return null;
  const records = data as TicketPrediction[];
  return (
    <section aria-labelledby="ticket-prediction-feed-heading">
      <h2 id="ticket-prediction-feed-heading">Upcoming matches and analysis</h2>
      <p>Match previews are informational. Odds are cached snapshots, not live prices or guaranteed outcomes. Ticket availability is verified at the provider.</p>
      <div>
        {records.map(match => {
          const link = (() => {
            try {
              if (!match.ticket_booking_link) return null;
              const url = new URL(match.ticket_booking_link);
              return url.protocol === "https:" && ["seatgeek.com", "www.seatgeek.com"].includes(url.hostname)
                && !url.username && !url.password ? url.toString() : null;
            } catch { return null; }
          })();
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
              {link ? <a href={link} target="_blank" rel="noopener noreferrer">Check match tickets at provider</a> : <p>Verified exact-match ticket link unavailable.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
