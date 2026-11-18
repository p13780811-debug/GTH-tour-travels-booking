import type { Metadata } from "next";
import Link from "next/link";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";
import { indexableMatch, matchSeoPath, sportSegment, upcomingMatchPages } from "@/lib/stadium-predictions/seo";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Sports Tickets & Match Predictions | GTH PRO",
  description: "Explore source-reviewed cricket, football and other upcoming match fixtures, informational analysis, official ticket sources and stadium trip planning.",
  alternates: { canonical: siteUrl("/sports-tickets-predictions") },
  robots: { index: isPublicLaunch(), follow: true },
};
const SPORTS = [
  { key: "all", name: "All sports" },
  { key: "cricket", name: "Cricket" },
  { key: "football", name: "Football" },
  { key: "tennis", name: "Tennis" },
  { key: "basketball", name: "Basketball" },
  { key: "baseball", name: "Baseball" },
] as const;
type Props = { searchParams: Promise<{ sport?: string }> };
export default async function SportsTicketsPredictions({ searchParams }: Props) {
  const requested = (await searchParams).sport;
  const active = SPORTS.some(x => x.key === requested) ? requested : "all";
  const matches = (await upcomingMatchPages()).filter(indexableMatch);
  const filtered = active === "all" ? matches : matches.filter(match => sportSegment(match.sport) === active);
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <TravelSectionNav />
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="gth-glass rounded-3xl border border-[var(--border)] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Match-day travel</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Sports tickets & match previews</h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">
          Discover verified event references and follow their exact-match ticket sources. Plan nearby stays, tours and transport.
          Predictions are informational, not guaranteed outcomes. Tickets, prices and seats are confirmed by the organizer or supplier.
        </p>
      </header>
      <nav aria-label="Filter by sport" className="my-6 flex flex-wrap gap-2">
        {SPORTS.map(item => <Link key={item.key}
          href={item.key === "all" ? "/sports-tickets-predictions" : "/sports-tickets-predictions?sport=" + item.key}
          aria-current={active === item.key ? "page" : undefined}
          className={(active === item.key ? "gth-btn-gold" : "gth-btn") +
            " inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold"}>
          {item.name} ({item.key === "all" ? matches.length : matches.filter(x => sportSegment(x.sport) === item.key).length})
        </Link>)}
      </nav>
      {filtered.length ? <section aria-labelledby="upcoming-matches-title">
        <h2 id="upcoming-matches-title" className="mb-4 text-2xl font-bold">Upcoming reviewed matches</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(match => <article key={match.id} className="gth-glass flex flex-col rounded-2xl border border-[var(--border)] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">{sportSegment(match.sport)}</p>
            <h3 className="mt-3 text-xl font-bold">{match.home} vs {match.away}</h3>
            <p className="mt-3 text-sm text-[var(--text-soft)]">{match.venue} · {match.city}, {match.countryCode}</p>
            <p className="mt-2 text-sm"><time dateTime={match.starts}>{match.starts.slice(0, 10)}</time>
              {match.ends ? " – " + match.ends.slice(0, 10) : ""}</p>
            <p className="mt-3 flex-1 text-xs text-[var(--text-soft)]">
              {match.analysis ? "Cached match analysis available" : "Reviewed fixture information; prediction pending verified match data"}
            </p>
            <Link href={matchSeoPath(match)!} prefetch={false}
              className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-center text-sm font-semibold">
              View match & ticket details
            </Link>
          </article>)}
        </div>
      </section> : <section className="gth-glass rounded-2xl border border-[var(--border)] p-6">
        <h2 className="text-xl font-bold">No verified {active === "all" ? "upcoming matches" : active + " matches"} published yet</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          We only publish individually confirmed fixture, sport and venue combinations. This does not mean tickets are sold out.
          Check our stadium directory and official event calendars for additional fixtures.
        </p>
        <Link href="/stadiums" className="gth-btn mt-4 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Browse stadium guides</Link>
      </section>}
      <p className="mt-6 text-sm leading-6 text-[var(--text-soft)]">
        Only independently reviewed matches become indexable landing pages. Cached odds and AI previews are optional:
        missing data is never replaced with invented probabilities or kickoff times. GTH PRO does not operate a betting service.
      </p>
      <nav aria-label="Related travel services" className="mt-5 flex flex-wrap gap-3">
        <Link href="/hotels" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4">Find stays</Link>
        <Link href="/tours" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4">Explore activities</Link>
        <Link href="/bus" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4">Plan bus travel</Link>
        <Link href="/train" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4">Plan rail travel</Link>
      </nav>
    </div>
  </main>;
}
