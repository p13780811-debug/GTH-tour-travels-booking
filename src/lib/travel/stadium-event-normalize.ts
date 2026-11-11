/**
 * Strict, unprivileged event normalization shared by the server feed and tests.
 * Event discovery does NOT prove ticket availability, pricing, admission or affiliate rights.
 * No private keys, browser providers, HTML or unverified external redirects are accepted.
 */
export type StadiumFeedEvent = {
  id: string;
  title: string;
  sport: string;
  venue: string;
  city: string;
  country: string;
  countryCode: string;
  day: string; // verified YYYY-MM-DD in source locality, not an invented start time
  startsAt: string | null; // provider UTC time; null for date-only official notices
  source: "Official venue" | "Ticketmaster Discovery";
  sellerStatus: "Check official source" | "On sale per provider" | "Ask provider";
  url: string;
};

export const SPORTS_SEGMENT_ID = "KZFzniwnSyZfZ7v7nE";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function safeText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max && !/[<>\u0000-\u001f\u007f]/.test(text) ? text : null;
}
function safeCountryCode(value: unknown): string | null {
  return typeof value === "string" && /^[A-Z]{2}$/.test(value) ? value : null;
}
/** Only permit the official provider's own website. No consumer-controlled redirects. */
export function safeTicketmasterEventUrl(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 2048) return null;
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password ||
        url.port || url.hash || !/^(?:[a-z0-9-]+\.)?ticketmaster\.(?:com|ca|co\.uk|com\.au|co\.nz|de|fr|es|nl|be|ie|at|mx)$/i.test(host)) return null;
    return url.href;
  } catch { return null; }
}
/** Source controlled official links are HTTPS-only; never derive them from user filters. */
export function safeOfficialStadiumUrl(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 2048) return null;
  try {
    const u = new URL(input);
    return u.protocol === "https:" && !u.username && !u.password && !u.port
      && !u.hash && !u.hostname.endsWith(".invalid") && u.hostname.includes(".")
      ? u.href : null;
  } catch { return null; }
}

export function normalizeTicketmasterSportsEvent(input: unknown, nowMs: number): StadiumFeedEvent | null {
  const event = record(input);
  if (!event) return null;
  const id = safeText(event.id, 100);
  const title = safeText(event.name, 180);
  const url = safeTicketmasterEventUrl(event.url);
  const dates = record(event.dates), start = record(dates?.start), status = record(dates?.status);
  const datetime = typeof start?.dateTime === "string" ? start.dateTime : "";
  const timeMs = Date.parse(datetime);
  // Never synthesize midnight or a match start time for TBD/TBA events.
  if (!Number.isFinite(timeMs) || timeMs < nowMs || timeMs > nowMs + 370 * 86400_000 ||
      start?.dateTBA === true || start?.dateTBD === true || start?.timeTBA === true) return null;

  const state = safeText(status?.code, 32);
  if (state === "canceled" || state === "cancelled" || state === "postponed") return null;

  const classes = Array.isArray(event.classifications) ? event.classifications : [];
  const sportClass = classes.map(record).find(c => record(c?.segment)?.id === SPORTS_SEGMENT_ID);
  if (!sportClass) return null;
  const genre = safeText(record(sportClass.genre)?.name, 48) ?? "Sports";

  const embedded = record(event._embedded);
  const venues = Array.isArray(embedded?.venues) ? embedded.venues : [];
  const venue = record(venues[0]), city = record(venue?.city), country = record(venue?.country);
  const venueName = safeText(venue?.name, 160);
  const cityName = safeText(city?.name, 100);
  const countryName = safeText(country?.name, 100);
  const countryCode = safeCountryCode(country?.countryCode);
  if (!id || !title || !url || !venueName || !cityName || !countryName || !countryCode) return null;
  return {
    id: "tm:" + id,
    title, sport: genre, venue: venueName, city: cityName, country: countryName,
    countryCode,
    day: new Date(timeMs).toISOString().slice(0, 10),
    startsAt: new Date(timeMs).toISOString(),
    source: "Ticketmaster Discovery",
    sellerStatus: state === "onsale" ? "On sale per provider" : "Ask provider",
    url,
  };
}

export function normalizeOfficialStadiumEvent(
  input: {slug:string;title:string;sport:string;venue:string;city:string;country:string;countryCode:string;day:string;url:string},
  today: string,
): StadiumFeedEvent | null {
  const day = input.day;
  const url = safeOfficialStadiumUrl(input.url);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day+"T00:00:00Z")) ||
      day < today || !url || !safeText(input.title, 180) || !safeText(input.venue, 160) ||
      !safeCountryCode(input.countryCode)) return null;
  return {
    id: "venue:"+input.slug+":"+day,
    title: input.title, sport: input.sport, venue:input.venue,
    city:input.city, country:input.country, countryCode:input.countryCode,
    day, startsAt:null, source:"Official venue", sellerStatus:"Check official source", url,
  };
}
