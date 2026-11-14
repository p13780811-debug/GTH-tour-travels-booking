import Link from "next/link";
import ShareFeedbackActions from "@/components/engagement/ShareFeedbackActions";
import ShareTripPlanButton from "@/components/engagement/ShareTripPlanButton";
import {ArrowUpRight, CalendarDays, ShieldCheck} from "lucide-react";
import {stadiums,upcomingStadiumEvents} from "@/lib/travel/stadiums";

/**
 * Carefully sourced editorial event previews; not a commercial ticket feed.
 * The parent route revalidates every hour, dropping expired local-date records
 * without cron, database queries, provider requests or event API credentials.
 */
export default function StadiumUpcomingEvents(){
  const events=stadiums.flatMap(venue=>upcomingStadiumEvents(venue).map(event=>({venue,event})))
    .sort((a,b)=>a.event.starts.localeCompare(b.event.starts)||a.venue.name.localeCompare(b.venue.name))
    .slice(0,9);
  return <section aria-labelledby="stadium-upcoming-heading" className="mt-8 scroll-mt-24">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Official-source research</p>
        <h2 id="stadium-upcoming-heading" className="mt-2 text-2xl font-bold sm:text-3xl">Selected upcoming stadium events</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
          Only individually reviewed published fixtures appear here. This is not a worldwide live event
          feed or evidence of ticket stock. Organizers may change dates and venues.
        </p>
      </div>
      <a href="#stadium-directory" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm">
        Browse official venue calendars
      </a>
    </div>
    {events.length? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map(({venue,event})=><article key={venue.slug+"-"+event.url}
        className="gth-glass flex min-w-0 flex-col rounded-2xl border border-[var(--border)] p-5">
        <p className="flex items-center gap-2 text-xs font-semibold text-[var(--gold)]">
          <CalendarDays size={16} aria-hidden="true"/> Source-recorded dates
        </p>
        <h3 className="mt-3 text-lg font-bold">{event.label}</h3>
        <p className="mt-2 text-sm text-[var(--text-soft)]">{venue.name} · {venue.city}, {venue.country}</p>
        <p className="mt-2 text-sm">
          <time dateTime={event.starts}>{event.starts}</time>
          {event.ends&&<> – <time dateTime={event.ends}>{event.ends}</time></>}
          <span className="ml-1 text-xs text-[var(--text-soft)]">venue-local date(s)</span>
        </p>
        <div className="mt-auto flex flex-wrap gap-3 pt-5">
          <a href={event.url} target="_blank" rel="noopener noreferrer"
            className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            Official event details <ArrowUpRight size={15} aria-hidden="true"/>
          </a>
          <Link href={"/stadiums/"+venue.slug} prefetch={false}
            className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm">
            Venue & ticket sources
          </Link>
        </div>
        <ShareFeedbackActions title={event.label} path={"/stadiums/"+encodeURIComponent(venue.slug)}/>
        <ShareTripPlanButton title={event.label} venue={venue.name} city={venue.city} countryCode={venue.countryCode} eventDate={event.starts} path={"/stadiums/"+encodeURIComponent(venue.slug)}/>
      </article>)}
    </div>:<div className="gth-glass mt-5 rounded-2xl border border-[var(--border)] p-5">
      <p className="font-semibold">No future dated events in our reviewed shortlist.</p>
      <p className="mt-2 text-sm text-[var(--text-soft)]">Use the official venue calendars below for current fixtures and ticket releases.</p>
    </div>}
    <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
      <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true"/>
      Event links go to official organizer sources. Ticket sales, seating, final dates, prices
      and eligibility are independently controlled by event organizers and suppliers.
    </p>
  </section>;
}
