import Link from "next/link";
import { indexableMatch, matchedVenue, matchSeoPath, upcomingMatchPages } from "@/lib/stadium-predictions/seo";

/** Only links matches verified for this exact stadium AND its supported sport. */
export default async function StadiumVerifiedMatchLinks({ venueSlug }: { venueSlug: string }) {
  const matches = (await upcomingMatchPages())
    .filter(match => indexableMatch(match) && matchedVenue(match)?.slug === venueSlug)
    .slice(0, 12);
  if (!matches.length) return null;
  return <section aria-labelledby="stadium-matches-title"
    className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-6">
    <h2 id="stadium-matches-title" className="text-2xl font-bold">Verified upcoming matches at this venue</h2>
    <p className="mt-2 text-sm text-[var(--text-soft)]">
      These are source-reviewed fixtures for this exact stadium. Other sports and unrelated stadium tickets are excluded.
    </p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {matches.map(match => <article key={match.id} className="rounded-xl border border-[var(--border)] p-4">
        <p className="text-xs font-bold text-[var(--gold)]">{match.sport}</p>
        <h3 className="mt-2 font-semibold">{match.home} vs {match.away}</h3>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          <time dateTime={match.starts}>{match.starts.slice(0, 10)}</time>
        </p>
        <Link href={matchSeoPath(match)!} prefetch={false}
          className="gth-btn-gold mt-3 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
          Match details & tickets
        </Link>
      </article>)}
    </div>
  </section>;
}
