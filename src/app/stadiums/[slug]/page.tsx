import EventShockwave from "@/components/intelligence/EventShockwave";
import ViralCardGenerator from "@/components/share/ViralCardGenerator";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Ticket } from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import ShareTripPlanButton from "@/components/engagement/ShareTripPlanButton";
import MatchDayConcierge from "@/components/travel/MatchDayConcierge";
import StadiumVerifiedMatchLinks from "@/components/stadium/StadiumVerifiedMatchLinks";
import StadiumTicketDiscovery from "@/components/stadium/StadiumTicketDiscovery";
import {safeHotelHandoff} from "@/lib/travel/stadium-concierge";
import { findStadium, stadiums, upcomingStadiumEvents } from "@/lib/travel/stadiums";
import { destinationFlightHref } from "@/lib/destinations/ecosystem";
import { isPublicLaunch, safeStructuredData, siteUrl } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() { return stadiums.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const venue = findStadium((await params).slug);
  if (!venue) notFound();
  return {
    title: `${venue.name} Tickets, Events & Visitor Guide | GTH PRO`,
    description: venue.overview,
    alternates: { canonical: siteUrl(`/stadiums/${venue.slug}`) },
    robots: { index: isPublicLaunch(), follow: true },
  };
}

function ExternalLink({ href, children, sponsored = false }: { href: string; children: React.ReactNode; sponsored?: boolean }) {
  return <a href={href} target="_blank" rel={sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"}
    className="gth-btn-gold inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
    <span>{children}</span><ArrowUpRight size={16} className="shrink-0" aria-hidden="true"/>
  </a>;
}

export default async function StadiumPage({ params }: Props) {
  const venue = findStadium((await params).slug);
  if (!venue) notFound();
  const upcoming = upcomingStadiumEvents(venue);
  const flightCity = venue.flightCity ?? venue.city;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [{
      "@type": venue.sports.includes("Motorsport") ? "SportsActivityLocation" : "StadiumOrArena",
      name: venue.name, url: siteUrl(`/stadiums/${venue.slug}`), description: venue.overview,
      address: { "@type": "PostalAddress", addressLocality: venue.city, addressCountry: venue.countryCode },
    }, {
      "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Travel", item: siteUrl("/travel") },
        { "@type": "ListItem", position: 2, name: "Stadiums", item: siteUrl("/stadiums") },
        { "@type": "ListItem", position: 3, name: venue.name, item: siteUrl(`/stadiums/${venue.slug}`) },
      ],
    }],
  };
  return <main className="min-h-screen min-w-0 bg-[var(--bg)] text-[var(--text)]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeStructuredData(schema) }}/>
    <TravelSectionNav/>
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-2 text-sm">
        <Link href="/travel" className="underline">Travel</Link><span aria-hidden="true">/</span>
        <Link href="/stadiums" className="underline">Stadiums</Link><span aria-hidden="true">/</span><span>{venue.name}</span>
      </nav>
      <header className="gth-glass rounded-3xl border border-[var(--border)] p-6 sm:p-8">
        <Ticket size={30} className="text-[var(--gold)]" aria-hidden="true"/>
        <p className="mt-4 text-sm font-semibold text-[var(--gold)]">{venue.city}, {venue.country} · {venue.sports.join(" · ")}</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{venue.name}</h1>
        <ViralCardGenerator kind="stadium" title={venue.name} subtitle={venue.city+" · "+venue.country} path={"/stadiums/"+venue.slug}/>
        <ShareTripPlanButton title={venue.name+" stadium visit"} venue={venue.name} city={venue.city} countryCode={venue.countryCode} path={"/stadiums/"+venue.slug}/>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">{venue.overview}</p>
      </header>
      <EventShockwave target={{kind:"stadium",id:venue.slug}}/>
      <StadiumVerifiedMatchLinks venueSlug={venue.slug}/>
      <StadiumTicketDiscovery venue={venue}/>
      <MatchDayConcierge slug={venue.slug} name={venue.name} bookingUrl={safeHotelHandoff(venue)}/>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="gth-glass rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-2xl font-bold">Events & official sources</h2>
          <p className="my-4 text-sm leading-6 text-[var(--text-soft)]">Confirm the venue, event date and ticket release in the organizer’s calendar. Follow the organizer’s approved ticket links.</p>
          <ExternalLink href={venue.schedule.url}>{venue.schedule.label}</ExternalLink>
          {venue.tickets && <div className="mt-3"><ExternalLink href={venue.tickets.url}>{venue.tickets.label}</ExternalLink></div>}
          {upcoming.length > 0 && <div className="mt-6">
            <h3 className="font-bold">Selected upcoming events</h3>
            <ul className="mt-3 space-y-4">{upcoming.map(event => <li key={event.url} className="rounded-xl border border-[var(--border)] p-4">
              <h4 className="font-semibold">{event.label}</h4>
              <p className="my-2 text-sm text-[var(--text-soft)]"><time dateTime={event.starts}>{event.starts}</time>{event.ends && <> – <time dateTime={event.ends}>{event.ends}</time></>} · Venue local dates</p>
              <ExternalLink href={event.url}>Official event details</ExternalLink>
            </li>)}</ul>
            <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">Selected dates from official announcements. Check the current event page for changes and availability.</p>
          </div>}
        </section>
        <section className="gth-glass rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-2xl font-bold">Seats & entry</h2>
          <p className="my-4 text-sm leading-7 text-[var(--text-soft)]">{venue.seating}</p>
          {venue.seatMap && <ExternalLink href={venue.seatMap.url}>{venue.seatMap.label}</ExternalLink>}
          <h3 className="mt-6 font-bold">Before you book</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-soft)]">
            <li>Confirm event admission, the seat section and any restricted view.</li>
            <li>Check mobile ticket delivery, ID requirements and age rules.</li>
            <li>Review cancellation, transfer and postponement terms with the seller.</li>
            <li>Check accessible seating and companion requirements with the organizer.</li>
          </ul>
        </section>
      </div>
      <section className="gth-glass mt-6 rounded-2xl border border-[var(--border)] p-6">
        <h2 className="text-2xl font-bold">Plan your trip</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">Explore stays in {venue.city}, flights to {flightCity} and airport transfers. Choose your dates and airport in each service, then check the journey to the venue.</p>
        <nav aria-label="Plan your stadium trip" className="mt-4 flex flex-wrap gap-3">
          <Link prefetch={false} href={"/hotels?" + new URLSearchParams({ view:"booking", city: venue.city, country: venue.countryCode })} className="gth-btn-gold inline-flex min-h-12 items-center rounded-xl px-4">Explore {venue.city} stays</Link>
          <Link prefetch={false} href={destinationFlightHref(flightCity)} className="gth-btn-gold inline-flex min-h-12 items-center rounded-xl px-4">Flights to {flightCity}</Link>
          <Link prefetch={false} href="/transfers" className="gth-btn-gold inline-flex min-h-12 items-center rounded-xl px-4">Choose airport transfer</Link>
        </nav>
      </section>
      <footer className="mt-6 text-sm leading-6 text-[var(--text-soft)]">Event schedules and ticket sellers are controlled by the organizers. GTH PRO does not sell match admission. Hotel and transport services maintain their own terms. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link></footer>
    </div>
  </main>;
}
