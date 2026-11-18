import Link from "next/link";
import type { Stadium } from "@/lib/travel/stadiums";
import type { SportsSeoMatch } from "@/lib/stadium-predictions/seo";
import {
  organizerTicketSources, regionalTicketDiscovery, matchTicketDiscovery,
  type TicketSourceLink,
} from "@/lib/stadium-predictions/ticket-sources";

function SourceLinks({ items }: { items: TicketSourceLink[] }) {
  return items.length ? <ul className="mt-3 flex flex-wrap gap-3">
    {items.map(item => <li key={item.kind + ":" + item.url}>
      <a href={item.url} target="_blank" rel="noopener noreferrer nofollow"
        className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
        {item.label}
      </a>
    </li>)}
  </ul> : null;
}

/**
 * Three-layer traffic-first stadium discovery: organizer, exact ticket seller,
 * then first-party match-day planning. No live stock, pricing or partner APIs.
 */
export default function StadiumTicketDiscovery({
  venue, match,
}: { venue: Stadium; match?: SportsSeoMatch }) {
  const discovery = match ? matchTicketDiscovery(match, venue) : null;
  const official = discovery?.official ?? organizerTicketSources(venue);
  const regional = discovery?.regional ?? regionalTicketDiscovery(venue);
  const exactMarketplace = discovery?.exactMarketplace ?? [];
  const hasVerified = discovery?.hasVerifiedTicketListing === true;
  return <section aria-labelledby="stadium-official-ticket-discovery"
    className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-5 sm:p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Ticket research desk</p>
    <h2 id="stadium-official-ticket-discovery" className="mt-2 text-2xl font-bold">
      Official-first ticket discovery
    </h2>
    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
      {hasVerified
        ? "This event has an individually verified marketplace listing. Admission details remain the seller's responsibility."
        : "Official tickets not currently listed on GTH PRO for this exact match. This is not a claim that the event is sold out."}
    </p>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-[var(--border)] p-4">
        <h3 className="font-bold">1. Official organizer first</h3>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          Official venue calendar and ticket guidance. A schedule is not proof that tickets are on sale.
        </p>
        <SourceLinks items={official}/>
        {regional.length > 0 && <>
          <h4 className="mt-5 text-sm font-semibold">Regional channels to check</h4>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
            These are general cricket/sports directories; the organizer has NOT confirmed them as sellers for this fixture.
          </p>
          <SourceLinks items={regional}/>
        </>}
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4">
        <h3 className="font-bold">2. Exact-event marketplace only</h3>
        {exactMarketplace.length ? <>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Match, sport, teams, venue and event date were checked against the reviewed record.
            Confirm resale rules, identity requirements and admission with the seller.
          </p>
          <SourceLinks items={exactMarketplace}/>
        </> : <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          No exact-match Ticketmaster, AXS, SeatGeek or authorized resale listing is currently verified.
          Unrelated events and generic checkout links are not displayed.
        </p>}
        {match && discovery?.search && !hasVerified && <div className="mt-4">
          <a href={discovery.search.url} target="_blank" rel="noopener noreferrer nofollow"
            className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
            Search web for official tickets
          </a>
          <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">
            Google search only—not a ticketing partner, official seller or verified booking.
          </p>
        </div>}
      </div>
    </div>
    <div className="mt-4 rounded-xl border border-[var(--border)] p-4">
      <h3 className="font-bold">3. GTH Match-Day Concierge</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Stay on GTH PRO to plan hotels, transport and venue access for {venue.name} in {venue.city}.
        Search dates, available rooms, exact transport journeys and checkout remain subject to the existing booking services.
      </p>
      <nav aria-label="Match-day concierge services" className="mt-3 flex flex-wrap gap-2">
        {match && <Link href={"/stadiums/" + venue.slug} prefetch={false}
          className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
          Venue &amp; local travel guide
        </Link>}
        <Link href={"/hotels?" + new URLSearchParams({ view: "booking", city: venue.city, country: venue.countryCode })}
          prefetch={false} className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
          Search {venue.city} stays
        </Link>
        <Link href="/transfers" prefetch={false}
          className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">
          Airport transfers
        </Link>
      </nav>
    </div>
    <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
      No ticket inventory, seat status, prices or commissions are asserted here.
      Ticket, travel and venue providers operate their own booking and payment processes.
    </p>
  </section>;
}
