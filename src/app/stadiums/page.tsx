import type { Metadata } from "next";
import Link from "next/link";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import { stadiums } from "@/lib/travel/stadiums";
import { stadiumAffiliateHref } from "@/lib/travel/stadium-affiliates";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";
import StadiumDirectory from "./StadiumDirectory";
import StadiumPartnerDiscovery from "./StadiumPartnerDiscovery";
import StadiumUpcomingEvents from "./StadiumUpcomingEvents";
import StadiumEventDiscovery from "./StadiumEventDiscovery";
import { upcomingStadiumEvents } from "@/lib/travel/stadiums";

// Refresh editorial event visibility hourly; no live API, cron or DB traffic.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Stadium Tickets & Venue Guides | GTH PRO",
  description: "Explore stadium event calendars, seating sources, partner tickets and venue tours. Plan hotels, flights and airport transfers for your trip.",
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
        <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">Find a venue, explore its official calendar and seating information, then plan your journey. Selected venues also have partner links for game tickets or guided experiences.</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Event organizers and suppliers confirm dates, available seats, final prices and ticket terms. Check whether your selected product includes event admission.</p>
      </header>
      <nav aria-label="Explore stadium tickets" className="mt-5 flex flex-wrap gap-3">
        <a href="#stadium-event-discovery" className="gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Explore upcoming events</a>
        <a href="#stadium-directory" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Browse stadiums</a>
        <a href="#stadium-exact-offers-heading" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold">Reviewed ticket experiences</a>
      </nav>
      <StadiumPartnerDiscovery/>
      <StadiumEventDiscovery events={reviewedEvents}/>
      <StadiumUpcomingEvents/>
      <section className="mt-8" aria-labelledby="stadium-exact-offers-heading">
        <header>
          <h2 id="stadium-exact-offers-heading" className="text-2xl font-bold sm:text-3xl">Reviewed event & club experiences</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-soft)]">
            These are specific, source-reviewed listings with their existing GTH PRO affiliate tracking.
            A stadium tour is not a match ticket. Select the correct experience and verify all dates,
            seats, prices and included admission with the provider before paying.
          </p>
        </header>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stadiums.flatMap(venue=>(venue.products??[]).flatMap(product=>{
            const href=stadiumAffiliateHref(product,venue.slug);
            return href?[{venue,product,href}]:[];
          })).map(({venue,product,href})=><article key={venue.slug+product.url}
            className="gth-glass flex min-w-0 flex-col rounded-2xl border border-[var(--border)] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">{product.kind}</p>
            <h3 className="mt-3 text-lg font-bold">{product.label}</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">{venue.city}, {venue.country}</p>
            <p className="mt-3 flex-1 text-xs leading-5 text-[var(--text-soft)]">
              {product.kind==="Event tickets"?"Event admission listing. Confirm the scheduled game and eligible seats with the seller.":
               "Venue experience. Stadium tours do not imply entry to a live match."}
            </p>
            <a href={href} target="_blank" rel="noopener noreferrer sponsored"
              className="gth-btn-gold mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-center text-sm font-semibold">
              {product.kind==="Event tickets"?"Check match tickets":"View venue experience"} <span aria-hidden="true">↗</span>
            </a>
            <Link href={"/stadiums/"+venue.slug} prefetch={false} className="mt-3 text-center text-xs font-semibold underline">
              Venue details & official event calendar
            </Link>
          </article>)}
        </div>
      </section>
      <StadiumDirectory venues={stadiums}/>
      <footer className="mt-8 text-sm leading-6 text-[var(--text-soft)]">
        <p>Some experience links are affiliate links. GTH PRO may earn a commission when a qualifying booking is completed.</p>
        <Link href="/affiliate-disclosure" className="mt-2 inline-flex min-h-11 items-center underline">Read affiliate disclosure</Link>
      </footer>
    </div>
  </main>;
}
