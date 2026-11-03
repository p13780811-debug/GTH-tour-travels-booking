import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BusFront, CalendarDays, CircleHelp,
  ClipboardCheck, Globe2, Hotel, MapPin, Plane, Search, ShieldCheck,
  Ticket, TrainFront, Trophy, Users, XCircle,
} from "lucide-react";
import type { PublicSportsEvent } from "@/lib/sports-tickets/providers";
import { SPORT_CATEGORIES, type SportsTicketFilters } from "@/lib/sports-tickets/validation";

const sportLabels: Record<(typeof SPORT_CATEGORIES)[number], string> = {
  cricket: "Cricket", football: "Football", basketball: "Basketball", tennis: "Tennis",
  motorsport: "Motorsport / F1", baseball: "Baseball", hockey: "Hockey",
  rugby: "Rugby", other: "Other sports",
};

const travelLinks = [
  { href: "/flights", title: "Flights", caption: "Plan your journey", Icon: Plane },
  { href: "/hotels", title: "Hotels", caption: "Stay near the venue", Icon: Hotel },
  { href: "/bus", title: "Buses", caption: "Explore connections", Icon: BusFront },
  { href: "/train", title: "Trains", caption: "Compare rail options", Icon: TrainFront },
] as const;

const checklist = [
  { title: "Authorized ticket seller", detail: "Use official organizers or licensed resale partners. Verify event, seating and venue terms.", Icon: BadgeCheck },
  { title: "Final price and fees", detail: "Review currency, taxes, service charges, resale value and ticket-transfer restrictions.", Icon: Ticket },
  { title: "Entry and refund policies", detail: "Check identity requirements, age limits, ticket delivery, cancellation and postponed-match terms.", Icon: ClipboardCheck },
  { title: "Match-day travel", detail: "Allow time for stadium security, local transfers, entry queues and getting home after the event.", Icon: MapPin },
] as const;

const fieldClass = "mt-2 min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--gold)]";

function humanDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-GB", {
    timeZone: "UTC", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }) + " UTC";
}

type Props = {
  filters: SportsTicketFilters;
  events: readonly PublicSportsEvent[];
  providerConnected: boolean;
  publiclyEnabled: boolean;
};

export default function SportsTicketsExperience({ filters, events, providerConnected, publiclyEnabled }: Props) {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/travel" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold">
            <Globe2 size={19} className="text-[var(--gold)]" aria-hidden="true" /> GTH PRO Travel
          </Link>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text-soft)]">
            {publiclyEnabled ? "Authorized partner discovery" : "Staged · Not open for ticket sales"}
          </span>
        </div>
      </header>

      <section className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.65fr)]">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
              <Trophy size={16} aria-hidden="true" /> Global sports · Stadium access
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find the match. Know the stadium. Plan the trip.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              {publiclyEnabled
                ? "Explore events supplied by authorized ticket partners. Final availability, seat rules and payments are confirmed by the seller."
                : "A worldwide stadium-ticket discovery experience in preparation. Match listings and booking options will appear only after authorized providers are connected."}
            </p>
            <a href="#match-search" className="gth-btn-gold mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
              Explore match search <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="gth-glass rounded-3xl border border-[var(--border)] p-5 shadow-[var(--shadow)] sm:p-7" aria-label="Sports ticket discovery flow">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--gold)]">
                <Ticket size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-semibold">Sports & Stadium Tickets</p>
                <p className="text-xs text-[var(--text-soft)]">Partner-ready booking structure</p>
              </div>
            </div>
            <ol className="mt-6 space-y-3 text-sm">
              {[
                ["01", "Country & city"], ["02", "Match date"], ["03", "Sport & team"],
                ["04", "Stadium"], ["05", "Authorized tickets"],
              ].map(([number, label]) => (
                <li key={number} className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2">
                  <span className="font-bold text-[var(--gold)]">{number}</span><span>{label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {publiclyEnabled ? "Only verified supplier listings can appear here." : "No simulated tickets, paid APIs or unapproved sellers are connected."}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-9 sm:px-6 sm:py-12">
        <section id="match-search" aria-labelledby="search-heading" className="scroll-mt-24">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Worldwide discovery</p>
          <h2 id="search-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Find sports by match, location and stadium</h2>
          <p className="mt-2 mb-5 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
            {providerConnected
              ? "Search listings sourced from authorized ticket suppliers, subject to real provider coverage."
              : "Search controls are prepared for future authorized inventory; they do not currently search any ticket seller."}
          </p>
          <form action="/sports-tickets" method="get" className="grid gap-4 md:grid-cols-2" aria-label="Sports and stadium search">
            <fieldset className="gth-glass min-w-0 rounded-2xl border border-[var(--border)] p-5">
              <legend className="sr-only">Country and city</legend>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Globe2 size={19} className="text-[var(--gold)]" aria-hidden="true" /> Country & City
              </h3>
              <label className="mt-4 block text-xs font-semibold" htmlFor="sports-country">Country
                <input id="sports-country" name="country" type="text" autoComplete="country-name" maxLength={80} defaultValue={filters.country}
                  placeholder="Any country" className={fieldClass} />
              </label>
              <label className="mt-3 block text-xs font-semibold" htmlFor="sports-city">City
                <input id="sports-city" name="city" type="text" autoComplete="address-level2" maxLength={100} defaultValue={filters.city}
                  placeholder="Any city" className={fieldClass} />
              </label>
            </fieldset>

            <fieldset className="gth-glass min-w-0 rounded-2xl border border-[var(--border)] p-5">
              <legend className="sr-only">Match date</legend>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <CalendarDays size={19} className="text-[var(--gold)]" aria-hidden="true" /> Match Date
              </h3>
              <label className="mt-4 block text-xs font-semibold" htmlFor="sports-date">Event date
                <input id="sports-date" name="date" type="date" defaultValue={filters.date} className={fieldClass} />
              </label>
              <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]">
                Event dates and times will be verified against the actual ticket source.
              </p>
            </fieldset>

            <fieldset className="gth-glass min-w-0 rounded-2xl border border-[var(--border)] p-5">
              <legend className="sr-only">Sport and team</legend>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Trophy size={19} className="text-[var(--gold)]" aria-hidden="true" /> Sport & Team
              </h3>
              <label className="mt-4 block text-xs font-semibold" htmlFor="sports-sport">Sport
                <select id="sports-sport" name="sport" defaultValue={filters.sport} className={fieldClass}>
                  <option value="">All sports</option>
                  {SPORT_CATEGORIES.map((sport) => <option key={sport} value={sport}>{sportLabels[sport]}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-xs font-semibold" htmlFor="sports-team">Team / competitor
                <input id="sports-team" name="team" type="text" maxLength={100} defaultValue={filters.team}
                  placeholder="Optional" className={fieldClass} />
              </label>
            </fieldset>

            <fieldset className="gth-glass min-w-0 rounded-2xl border border-[var(--border)] p-5">
              <legend className="sr-only">Stadium</legend>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <MapPin size={19} className="text-[var(--gold)]" aria-hidden="true" /> Stadium
              </h3>
              <label className="mt-4 block text-xs font-semibold" htmlFor="sports-stadium">Stadium / venue
                <input id="sports-stadium" name="stadium" type="text" maxLength={120} defaultValue={filters.stadium}
                  placeholder="Any stadium or arena" className={fieldClass} />
              </label>
              <p className="mt-4 text-xs leading-5 text-[var(--text-soft)]">
                Venue names and inventory will come exclusively from authorized event listings.
              </p>
            </fieldset>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" className="gth-btn-gold inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold sm:flex-none">
                <Search size={18} aria-hidden="true" /> Review search
              </button>
              <Link href="/sports-tickets#match-search" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold">
                Clear filters
              </Link>
            </div>
          </form>
        </section>

        <section id="matches" aria-labelledby="matches-heading" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Verified ticket listings only</p>
          <h2 id="matches-heading" className="mt-2 mb-5 text-2xl font-bold sm:text-3xl">Available Matches & Tickets</h2>
          {events.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {events.map((event) => (
                <article key={event.id} className="gth-glass rounded-2xl border border-[var(--border)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">
                    {sportLabels[event.sport]} · {event.providerName}
                  </p>
                  <h3 className="mt-2 text-lg font-bold">{event.title}</h3>
                  <p className="mt-2 flex items-start gap-2 text-sm text-[var(--text-soft)]">
                    <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {event.stadium} · {event.city}, {event.country}
                  </p>
                  <p className="mt-2 flex items-start gap-2 text-sm text-[var(--text-soft)]">
                    <CalendarDays size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {humanDate(event.startsAt)}
                  </p>
                  {event.price && <p className="mt-3 text-sm font-semibold">
                    Provider listed: {new Intl.NumberFormat("en", { style: "currency", currency: event.price.currency }).format(event.price.amount)}
                  </p>}
                  <p className="mt-3 text-xs text-[var(--text-soft)]">
                    Ticket status: {event.availability.replace("_", " ")}. Verify final terms on partner checkout.
                  </p>
                  {event.availability !== "sold_out" && (
                    <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer sponsored"
                      className="gth-btn-gold mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
                      Continue to authorized seller <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="gth-glass rounded-3xl border border-[var(--border)] px-5 py-10 text-center sm:px-12">
              <XCircle size={34} className="mx-auto text-[var(--gold)]" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-bold">
                {providerConnected ? "No verified events found for these filters" : "Ticket inventory is not connected yet"}
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">
                {providerConnected
                  ? "Try another city, date, sport or stadium. We only show authorized seller inventory and never invent availability."
                  : "This is a preparation-only module. No official ticketing or resale provider is connected. We do not display fabricated matches, seats, prices or confirmations."}
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="provider-heading" className="gth-glass rounded-3xl border border-[var(--border)] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--gold)]">
              <ShieldCheck size={23} aria-hidden="true" />
            </span>
            <div>
              <h2 id="provider-heading" className="text-xl font-bold sm:text-2xl">Authorized Ticketing Partner</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
                Approved suppliers will own event availability, checkout, ticket delivery and support. GTH PRO
                will act only within each partner&apos;s written referral and branding permissions.
              </p>
              <p className="mt-3 text-sm font-semibold">
                {providerConnected
                  ? "Authorized provider adapters configured. Payments and ticket issuance remain with the provider."
                  : "Partner authorization: pending. Ticket sales: disabled."}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="match-travel-heading">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Match-day travel planning</p>
          <h2 id="match-travel-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Plan the journey around the match</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
            Existing GTH PRO travel services can help plan transport and stays; none provides automatic access to match tickets.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {travelLinks.map(({ href, title, caption, Icon }) => (
              <Link href={href} key={href} className="gth-glass flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4">
                <Icon size={23} className="shrink-0 text-[var(--gold)]" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{title}</strong>
                  <span className="mt-1 block text-xs text-[var(--text-soft)]">{caption}</span>
                </span>
                <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="ticket-checklist-heading">
          <h2 id="ticket-checklist-heading" className="flex items-center gap-2 text-2xl font-bold">
            <Users size={22} className="text-[var(--gold)]" aria-hidden="true" /> Before you book a match
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {checklist.map(({ title, detail, Icon }) => (
              <div key={title} className="gth-glass flex items-start gap-3 rounded-2xl border border-[var(--border)] p-5">
                <Icon size={21} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true" />
                <div><h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
            <CircleHelp size={16} className="mt-1 shrink-0" aria-hidden="true" />
            {publiclyEnabled
              ? "GTH PRO is a discovery and referral platform. External sellers handle payments, ticket fulfilment and after-sales support."
              : "Sports tickets are not currently offered by GTH PRO. When enabled, every booking link must disclose its provider and affiliate relationship."}
          </p>
        </section>
      </div>
    </main>
  );
}
