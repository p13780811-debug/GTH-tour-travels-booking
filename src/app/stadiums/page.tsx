import type { Metadata } from "next";
import Link from "next/link";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import { stadiums } from "@/lib/travel/stadiums";
import { isPublicLaunch, siteUrl } from "@/lib/seo/site";
import StadiumDirectory from "./StadiumDirectory";
import StadiumPartnerDiscovery from "./StadiumPartnerDiscovery";

export const metadata: Metadata = {
  title: "Stadium Tickets & Venue Guides | GTH PRO",
  description: "Explore stadium event calendars, seating sources, partner tickets and venue tours. Plan hotels, flights and airport transfers for your trip.",
  alternates: { canonical: siteUrl("/stadiums") },
  robots: { index: isPublicLaunch(), follow: true },
};

export default function StadiumsPage() {
  return <main className="min-h-screen min-w-0 bg-[var(--bg)] text-[var(--text)]">
    <TravelSectionNav/>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="gth-glass rounded-3xl border border-[var(--border)] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Sports & live events</p>
        <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Your next stadium trip starts here.</h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--text-soft)]">Find a venue, explore its official calendar and seating information, then plan your journey. Selected venues also have partner links for game tickets or guided experiences.</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">Event organizers and suppliers confirm dates, available seats, final prices and ticket terms. Check whether your selected product includes event admission.</p>
      </header>
      <StadiumPartnerDiscovery/>
      <StadiumDirectory venues={stadiums}/>
      <footer className="mt-8 text-sm leading-6 text-[var(--text-soft)]">
        <p>Some experience links are affiliate links. GTH PRO may earn a commission when a qualifying booking is completed.</p>
        <Link href="/affiliate-disclosure" className="mt-2 inline-flex min-h-11 items-center underline">Read affiliate disclosure</Link>
      </footer>
    </div>
  </main>;
}
