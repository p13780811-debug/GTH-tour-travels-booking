import type { Metadata } from "next";
import Link from "next/link";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import { stadiums } from "@/lib/travel/stadiums";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";
import StadiumDirectory from "./StadiumDirectory";
import StadiumUpcomingEvents from "./StadiumUpcomingEvents";
import TicketPredictionFeed from "@/components/stadium/TicketPredictionFeed";
import StadiumEventDiscovery from "./StadiumEventDiscovery";
import StadiumTicketDestinations from "./StadiumTicketDestinations";
import { upcomingStadiumEvents } from "@/lib/travel/stadiums";

// Refresh editorial event visibility hourly; no live API, cron or DB traffic.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Stadium Tickets & Venue Guides | GTH PRO",
  description: "Source-reviewed cricket, football, tennis and basketball stadium fixtures with official ticket sources, match previews, hotels and match-day transport.",
  alternates: { canonical: siteUrl("/stadiums") },
  robots: { index: isPublicLaunch(), follow: true },
};

export default function StadiumsPage() {
  const reviewedEvents=stadiums.flatMap(venue=>upcomingStadiumEvents(venue).map(event=>({
    id:venue.slug+"-"+event.starts+"-"+event.label,
    title:event.label,starts:event.starts,ends:event.ends,
    venue:venue.name,city:venue.city,country:venue.country,
    sport:venue.sports[0],venueSlug:venue.slug,officialUrl:event.url,
  }))).sort((a,b)=>a.starts.localeCompare(b.starts));
  return <main className="min-h-screen min-w-0 bg-[var(--bg)] text-[var(--text)]">
    <TravelSectionNav/>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="gth-glass rounded-3xl border border-[var(--border)] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Sports & live events</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Your next stadium trip starts here.</h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">Find a venue, browse source-reviewed match dates and official organizer information, and plan your match-day journey. Ticket pages never substitute an unrelated tour for the fixture you want.</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Event organizers and suppliers confirm dates, available seats, final prices and ticket terms. Check whether your selected product includes event admission.</p>
      </header>
      <nav aria-label="Explore stadium tickets" className="mt-5 flex flex-wrap gap-3">
        <Link href="/tickets" className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Worldwide ticket finder</Link>
        <Link href="/sports-tickets-predictions" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Match predictions & sports tickets</Link>
        <a href="#stadium-event-discovery" className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Explore upcoming events</a>
        <a href="#stadium-directory" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Browse stadiums</a>
      </nav>
      <StadiumEventDiscovery events={reviewedEvents}/>
      <StadiumUpcomingEvents/>
      <TicketPredictionFeed/>
      <StadiumDirectory venues={stadiums}/>
      <StadiumTicketDestinations/>
      <footer className="mt-8 text-sm leading-6 text-[var(--text-soft)]">
        <p>GTH PRO links to official venue sources and independently reviewed event references. An organizer, club or ticket seller must confirm admission, dates and stock. Match-day travel bookings are separate from event tickets.</p>
        <Link href="/affiliate-disclosure" className="mt-2 inline-flex min-h-11 items-center underline">Read affiliate disclosure</Link>
      </footer>
    </div>
  </main>;
}
