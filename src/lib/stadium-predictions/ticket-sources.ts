import type { Stadium } from "@/lib/travel/stadiums";
import type { SportsSeoMatch } from "./seo";
import { officialTicketSearchUrl } from "./ticket-search";
import { sportSegment } from "./seo";

export type TicketSourceLink = {
  label: string;
  url: string;
  kind: "organizer-event" | "organizer-calendar" | "organizer-ticket-guide" |
    "regional-discovery" | "verified-marketplace" | "web-search";
  verifiedForMatch: boolean;
};
type Marketplace = "ticketmaster" | "axs" | "seatgeek" | "ticketek";
type ExactMarketplaceSource = {
  matchId: string; venueSlug: string; sport: string; home: string;
  away: string; date: string; marketplace: Marketplace;
  url: string; reviewed: true;
};
const VERIFIED_MARKETPLACE_HOSTS: Record<Marketplace, readonly string[]> = {
  ticketmaster: ["www.ticketmaster.com", "ticketmaster.com", "www.ticketmaster.co.uk", "www.ticketmaster.com.au"],
  axs: ["www.axs.com", "axs.com"],
  seatgeek: ["seatgeek.com", "www.seatgeek.com"],
  ticketek: ["premier.ticketek.com.au", "www.ticketek.com.au"],
};
// Exact-event marketplace URLs only, approved and manually matched to a
// reviewed fixture's sport, both teams, venue and day. Never guess a slug,
// construct a checkout URL or present a generic marketplace as live stock.
const reviewedMarketplaceSources: readonly ExactMarketplaceSource[] = [];

function safeHttps(raw: string, allowed: readonly string[]): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        url.hash || url.href.length > 1024 || !allowed.includes(url.hostname) ||
        /\/(?:search|results?)(?:\/|$)/i.test(url.pathname)) return null;
    return url.toString();
  } catch { return null; }
}
function organizerLink(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password ||
        url.port || url.hash || url.href.length > 1024) return null;
    return url.toString();
  } catch { return null; }
}
function sameDay(date: string, eventDate: string): boolean {
  return date.slice(0, 10) === eventDate.slice(0, 10);
}
function sameMatch(a: string, b: string) {
  return a.normalize("NFKC").trim().toLocaleLowerCase("en") ===
    b.normalize("NFKC").trim().toLocaleLowerCase("en");
}
export function exactMarketplaceSources(match: SportsSeoMatch, venue: Stadium): TicketSourceLink[] {
  if (sportSegment(match.sport) === "other-sports" ||
      !venue.sports.some(s => sportSegment(s) === sportSegment(match.sport)) ||
      !sameMatch(venue.name, match.venue)) return [];
  const matched = reviewedMarketplaceSources.filter(item =>
    item.reviewed === true && item.matchId === match.id &&
    item.venueSlug === venue.slug && sameMatch(item.sport, match.sport) &&
    sameMatch(item.home, match.home) && sameMatch(item.away, match.away) &&
    sameDay(item.date, match.starts))
    .flatMap(item => {
      const url = safeHttps(item.url, VERIFIED_MARKETPLACE_HOSTS[item.marketplace]);
      return url ? [{ label: item.marketplace.toUpperCase() + " exact event", url,
        kind: "verified-marketplace" as const, verifiedForMatch: true }] : [];
    });
  if (match.ticketUrl && /^seatgeek:[1-9][0-9]{0,18}$/.test(match.id)) {
    const url = safeHttps(match.ticketUrl, VERIFIED_MARKETPLACE_HOSTS.seatgeek);
    if (url && !matched.some(item => item.url === url)) matched.push({
      label: "SeatGeek exact event", url,
      kind: "verified-marketplace", verifiedForMatch: true,
    });
  }
  return matched;
}
export function organizerTicketSources(venue: Stadium, match?: SportsSeoMatch): TicketSourceLink[] {
  const result: TicketSourceLink[] = [];
  // Direct organizer event URL only if tied to this exact venue's reviewed
  // calendar entry; never elevate an arbitrary URL or bookmaker to "official".
  const reviewedEvent = match && venue.events?.find(event =>
    event.url === match.officialUrl && sameDay(event.starts, match.starts) &&
    sameMatch(venue.name, match.venue) &&
    venue.sports.some(s => sportSegment(s) === sportSegment(match.sport)) &&
    event.label.toLocaleLowerCase("en").includes(match.home.toLocaleLowerCase("en")) &&
    event.label.toLocaleLowerCase("en").includes(match.away.toLocaleLowerCase("en")));
  const exact = reviewedEvent ? organizerLink(reviewedEvent.url) : null;
  if (exact) result.push({ label: "Official organizer event details", url: exact,
    kind: "organizer-event", verifiedForMatch: true });
  const tickets = organizerLink(venue.tickets?.url);
  if (tickets) result.push({ label: venue.tickets?.label || "Official venue ticket information",
    url: tickets, kind: "organizer-ticket-guide", verifiedForMatch: false });
  const schedule = organizerLink(venue.schedule.url);
  if (schedule && !result.some(item => item.url === schedule)) {
    result.push({ label: venue.schedule.label, url: schedule,
      kind: "organizer-calendar", verifiedForMatch: false });
  }
  return result;
}
export function regionalTicketDiscovery(venue: Stadium, match?: SportsSeoMatch): TicketSourceLink[] {
  // Country + sport are only discovery hints: these channels are NOT marked
  // official for this individual match unless the organizer explicitly says so.
  const category = match ? sportSegment(match.sport) : null;
  if (venue.countryCode === "IN" && (!category || category === "cricket")) {
    const links: TicketSourceLink[] = [
      { label: "BookMyShow cricket directory (check match)", url: "https://in.bookmyshow.com/explore/cricket",
        kind: "regional-discovery", verifiedForMatch: false },
    ];
    if (venue.city === "Kolkata") links.push({
      label: "District Kolkata sports directory (check match)",
      url: "https://www.district.in/events/sports-events-in-kolkata-book-tickets",
      kind: "regional-discovery", verifiedForMatch: false,
    });
    return links;
  }
  if (venue.countryCode === "AU" && (!category || category === "cricket")) {
    return [
      { label: "Cricket Australia ticket guidance", url: "https://www.cricket.com.au/tickets",
        kind: "regional-discovery", verifiedForMatch: false },
      { label: "Ticketek sports directory (check match)", url: "https://premier.ticketek.com.au/shows/genre.aspx?c=2053&langpref=en",
        kind: "regional-discovery", verifiedForMatch: false },
    ];
  }
  return [];
}
export function matchTicketDiscovery(match: SportsSeoMatch, venue: Stadium) {
  const official = organizerTicketSources(venue, match);
  const exactMarketplace = exactMarketplaceSources(match, venue);
  const regional = regionalTicketDiscovery(venue, match);
  const search = officialTicketSearchUrl(match.home, match.away, venue.name, match.sport, match.starts);
  return { official, exactMarketplace, regional,
    search: search ? { label: "Search web for official tickets", url: search,
      kind: "web-search" as const, verifiedForMatch: false } : null,
    hasVerifiedTicketListing: exactMarketplace.length > 0,
  };
}
