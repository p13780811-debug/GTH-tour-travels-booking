import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import JsonLd from "@/components/seo/JsonLd";
import { safeHotelHandoff } from "@/lib/travel/stadium-concierge";
import { officialTicketSearchUrl } from "@/lib/stadium-predictions/ticket-search";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";
import {
  indexableMatch, matchMarketEstimates, matchedVenue, matchSeoPath, sportSegment,
  upcomingMatchPages, type SportsSeoMatch,
} from "@/lib/stadium-predictions/seo";

export const revalidate = 3600;
type Props = { params: Promise<{ sport: string; slug: string }> };
async function findMatch(params: Props["params"]) {
  const { sport, slug } = await params;
  if (!/^[a-z0-9-]{2,110}$/.test(sport) || !/^[a-z0-9-]{10,250}$/.test(slug)) notFound();
  const path = "/events/" + sport + "/" + slug;
  const match = (await upcomingMatchPages()).find(item => matchSeoPath(item) === path);
  if (!match || sportSegment(match.sport) !== sport) notFound();
  return match;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await findMatch(params);
  const title = match.home + " vs " + match.away + " Tickets, Match Preview & Prediction | GTH PRO";
  return {
    title,
    description: "Verified " + match.sport + " fixture at " + match.venue +
      ". Review the schedule, available analysis, official event links, travel, hotels and transport.",
    alternates: { canonical: siteUrl(matchSeoPath(match)!) },
    robots: { index: isPublicLaunch() && indexableMatch(match), follow: true },
    openGraph: { title, url: siteUrl(matchSeoPath(match)!), type: "article" },
  };
}
function MatchJsonLd({ match }: { match: SportsSeoMatch }) {
  if (!indexableMatch(match)) return null;
  const path = matchSeoPath(match)!;
  const event: Record<string, unknown> = {
    "@type": "SportsEvent",
    name: match.home + " vs " + match.away,
    sport: match.sport,
    startDate: match.starts,
    ...(match.ends ? { endDate: match.ends } : {}),
    url: siteUrl(path),
    location: {
      "@type": "Place", name: match.venue,
      address: { "@type": "PostalAddress", addressLocality: match.city, addressCountry: match.countryCode },
    },
  };
  // Never invent ticket prices, availability, resale status or seller identity.
  if (match.ticketUrl) event.offers = { "@type": "Offer", url: match.ticketUrl };
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@graph": [
      event,
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Sports", item: siteUrl("/sports-tickets-predictions") },
        { "@type": "ListItem", position: 2, name: match.home + " vs " + match.away, item: siteUrl(path) },
      ] },
    ],
  }} />;
}
export default async function MatchDetails({ params }: Props) {
  const match = await findMatch(params);
  const venue = matchedVenue(match);
  const market = matchMarketEstimates(match);
  const hotelHref = venue
    ? safeHotelHandoff(venue)
    : "/hotels?" + new URLSearchParams({ view: "booking", city: match.city || "" });
  const toursHref = "/tours?" + new URLSearchParams({ city: match.city || "" });
  const ticketDiscoveryHref = officialTicketSearchUrl(match.home, match.away, match.venue, match.sport, match.starts);
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <MatchJsonLd match={match} />
    <TravelSectionNav />
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-sm">
        <Link href="/sports-tickets-predictions" className="underline">Sports tickets & previews</Link>
        <span aria-hidden="true">/</span>
        <span>{sportSegment(match.sport)}</span>
      </nav>
      <header className="gth-glass rounded-3xl border border-[var(--border)] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">{match.sport} · Match-day guide</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{match.home} vs {match.away}</h1>
        <p className="mt-4 text-base text-[var(--text-soft)]">{match.venue}{match.city ? " · " + match.city : ""}{match.countryCode ? ", " + match.countryCode : ""}</p>
        <p className="mt-2 font-semibold">
          <time dateTime={match.starts}>
            {new Date(match.starts).toLocaleString("en-GB", venue?.timeZone
              ? { dateStyle: "long", ...(match.starts.includes("T") ? { timeStyle: "short" as const } : {}), timeZone: venue.timeZone }
              : { dateStyle: "long", timeZone: "UTC" })}
          </time>
          {venue && match.starts.includes("T") ? " (" + venue.timeZone + ")" : ""}
          {match.ends ? " – " + match.ends.slice(0, 10) : ""}
        </p>
        <p className="mt-3 text-sm text-[var(--text-soft)]">
          Fixture details are source-reviewed. Confirm exact start time, changes and admission with the organizer.
        </p>
        {match.ticketUrl ? <a href={match.ticketUrl} target="_blank" rel="noopener noreferrer sponsored"
          className="gth-btn-gold mt-5 inline-flex min-h-12 items-center rounded-xl px-5 font-semibold">
          Check exact-match ticket listing
        </a> : ticketDiscoveryHref ? <a href={ticketDiscoveryHref} target="_blank"
          rel="noopener noreferrer nofollow"
          className="gth-btn-gold mt-5 inline-flex min-h-12 items-center rounded-xl px-5 font-semibold">
          Search web for official tickets
        </a> : <p className="mt-5 text-sm">Match-ticket discovery is currently unavailable.</p>}
        {match.officialUrl ? <a href={match.officialUrl} target="_blank"
          rel="noopener noreferrer" className="ml-3 mt-5 inline-flex min-h-12 items-center underline">
          Check organizer fixture calendar
        </a> : null}
        {!match.ticketUrl && <p className="mt-3 text-sm text-[var(--text-soft)]">
          This opens a Google search, not a ticket seller or verified booking. Confirm the organizer,
          fixture date and seat availability independently.
        </p>}
      </header>

      <section className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-6" aria-labelledby="prediction-heading">
        <h2 id="prediction-heading" className="text-2xl font-bold">Match prediction & analysis</h2>
        {market.length ? <>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            Normalized market-implied probabilities from a cached odds snapshot. These are not independently validated
            AI win forecasts, betting recommendations or guaranteed match outcomes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {market[0].teams.map(team => <div key={team.name} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
              <p className="text-sm text-[var(--text-soft)]">{team.name}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--gold)]">{team.implied.toFixed(1)}%</p>
            </div>)}
          </div>
        </> : <p className="mt-3 text-sm text-[var(--text-soft)]">
          A verified probability snapshot is not available for this exact match.
          No guessed win percentage will be shown.
        </p>}
        {match.analysis ? <>
          <h3 className="mt-6 font-semibold">Pre-match analytical preview</h3>
          <p className="mt-2 whitespace-pre-line leading-7 text-[var(--text-soft)]">{match.analysis}</p>
        </> : <p className="mt-4 text-sm text-[var(--text-soft)]">
          No verified tactical analysis is published yet. Team form, injuries and head-to-head records are
          never inferred from a fixture title.
        </p>}
      </section>

      <section className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-6" aria-labelledby="market-heading">
        <h2 id="market-heading" className="text-2xl font-bold">Available international market comparison</h2>
        {market.length ? <>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Cached provider snapshots, not real-time quotes. Only regions actually returned by the source are displayed.
            Last retrieved: {match.odds?.retrieved_at || "time unavailable"}.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead><tr className="border-b border-[var(--border)]">
                <th scope="col" className="p-3">Region</th><th scope="col" className="p-3">Market source</th>
                <th scope="col" className="p-3">Outcome</th><th scope="col" className="p-3">Normalized estimate</th>
              </tr></thead>
              <tbody>{market.flatMap(row => row.teams.map(outcome => <tr key={row.bookmaker + outcome.name}
                className="border-b border-[var(--border)]">
                <td className="p-3">{row.region}</td><td className="p-3">{row.bookmaker}</td>
                <td className="p-3">{outcome.name}</td><td className="p-3">{outcome.implied.toFixed(1)}%</td>
              </tr>))}</tbody>
            </table>
          </div>
        </> : <p className="mt-3 text-sm text-[var(--text-soft)]">
          UK, EU, US and AU comparison is not currently verified for this match. No synthetic regional data is displayed.
        </p>}
      </section>

      <section className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-6" aria-labelledby="trip-heading">
        <h2 id="trip-heading" className="text-2xl font-bold">Plan your trip to {match.venue}</h2>
        <p className="mt-3 leading-7 text-[var(--text-soft)]">
          Travelling to {match.city || "the match"}? Explore hotels and attractions and plan bus or rail transport.
          Booking partners confirm dates, exact routes, property availability and payment terms.
        </p>
        <nav aria-label="Match-day travel services" className="mt-5 flex flex-wrap gap-3">
          <a href={hotelHref} target={venue ? "_blank" : undefined}
            rel={venue ? "noopener noreferrer sponsored" : undefined}
            className="gth-btn-gold inline-flex min-h-12 items-center rounded-xl px-4 font-semibold">
            Check stays in {match.city || "this city"}
          </a>
          <Link href={toursHref} className="gth-btn inline-flex min-h-12 items-center rounded-xl px-4">Explore local tours</Link>
          <Link href="/bus" className="gth-btn inline-flex min-h-12 items-center rounded-xl px-4">Find bus journeys</Link>
          <Link href="/train" className="gth-btn inline-flex min-h-12 items-center rounded-xl px-4">Find train journeys</Link>
          {venue ? <Link href={"/stadiums/" + venue.slug} className="gth-btn inline-flex min-h-12 items-center rounded-xl px-4">Venue & transit guide</Link> : null}
        </nav>
        <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
          Ground transport uses the existing GTH booking journey; exact alternate supplier routes appear only when separately verified.
          Some outbound links may earn GTH PRO a commission.
        </p>
      </section>
      <p className="mt-6 text-xs leading-6 text-[var(--text-soft)]">
        GTH PRO publishes informational match previews and ticket research, not gambling or in-platform ticket inventory.
        We do not guarantee any prediction, event schedule, seller inventory or search-result placement.
      </p>
      <Link href="/affiliate-disclosure" className="mt-2 inline-flex min-h-11 items-center underline">Affiliate disclosure</Link>
    </div>
  </main>;
}
