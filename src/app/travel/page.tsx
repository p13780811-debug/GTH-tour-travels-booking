import TravelSectionNav from "@/components/travel/TravelSectionNav";
import ConnectedTravelEntry from "@/components/travel/ConnectedTravelEntry";
import {Suspense} from "react";
import workspaceStyles from "@/components/travel/ConnectedTravelWorkspace.module.css";
import styles from "./TravelLanding.module.css";
import {HOTEL_COUNTRIES} from "@/lib/travel/hotel-audience";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, BusFront, CarFront, Compass, Globe2, Hotel, MapPinned, Plane, ShieldCheck, Sparkles, Ticket, TrainFront, Ship } from "lucide-react";

export const metadata: Metadata = {
  title: "Global Travel | Flights, Hotels, Tours & More | GTH PRO",
  description: "GTH PRO Travel connects international flight search, hotels, tours, destinations, ground transport, insurance and travel guides in a single destination.",
  alternates: { canonical: "/travel" },
  openGraph: { title: "GTH PRO Travel — Explore the World", description: "One connected travel destination for flights, hotels and experiences.", images: ["/maldives-bg.jpg"] },
};

const services = [
  { name: "Cruises", label: "CRUISE HOLIDAYS & DAY SAILINGS", href: "/cruises", img: "/images/cities/singapore.jpg", Icon: Ship, detail: "Explore cruise holidays, harbour sailings and dinner cruises, with detailed itineraries and booking options." },
  { name: "Flights", label: "FARES & FLIGHT SEARCH", href: "/flights", img: "/images/mega/flights.jpg", Icon: Plane, detail: "Find international routes, compare travel dates and choose the flight that works for your journey." },
  { name: "Hotels", label: "HOTEL SEARCH & BOOKING", href: "/hotels", img: "/images/mega/hotels.jpg", Icon: Hotel, detail: "Search stays worldwide and review current room options, prices and booking terms." },
  { name: "Tours & Activities", label: "GLOBAL EXPERIENCES", href: "/tours", img: "/images/mega/tours.jpg", Icon: Ticket, detail: "Browse travel experiences by destination and compare important operator and booking conditions." },
  { name: "Destinations", label: "EXPLORE THE WORLD", href: "/destinations", img: "/images/cities/paris.jpg", Icon: Globe2, detail: "Discover international destinations, city highlights and helpful planning information." },
  { name: "Airport Transfers", label: "GROUND TRANSPORT", href: "/transfers", img: "/images/mega/transfers.jpg", Icon: CarFront, detail: "Plan a journey from airport to accommodation and verify pickup terms with external providers." },
  { name: "Car Rentals", label: "SELF-DRIVE TRAVEL", href: "/cars", img: "/images/mega/transfers.jpg", Icon: CarFront, detail: "Plan car hire, pickup dates and vehicle requirements worldwide with booking partner handoff." },
  { name: "Travel Insurance", label: "SAFER TRAVEL PLANNING", href: "/insurance", img: "/images/mega/insurance.jpg", Icon: ShieldCheck, detail: "Review medical coverage, exclusions, claims and cancellation terms before considering a policy." },
] as const;
const additional = [
  { name: "Stadium Tickets", href: "/stadiums", Icon: Ticket, detail: "Official event calendars, seating sources and selected partner tickets or venue experiences." },
  { name: "Bus Travel", href: "/bus", Icon: BusFront, detail: "Road connections and operator booking handoffs." },
  { name: "Train Travel", href: "/train", Icon: TrainFront, detail: "Rail journey planning and connected operator bookings." },
  { name: "Ferry Travel", href: "/ferry", Icon: Ship, detail: "Ferries, speedboats and island connections across supported routes." },
  { name: "Airport Explorer", href: "/travel/airports", Icon: Plane, detail: "Explore airport codes, city connections and onward journey planning." },
  { name: "Experiences", href: "/activities", Icon: Sparkles, detail: "Destination activities and discovery." },
  { name: "Deals & offers", href: "/travel/deals", Icon: Sparkles, detail: "Browse destination experiences and provider-managed deals, without invented discount claims." },
  { name: "Travel Guides", href: "/guides", Icon: BookOpen, detail: "Research and booking checklists." },
  { name: "Travel Blog", href: "/blog", Icon: Compass, detail: "Articles for thoughtful travel planning." },
  { name: "Global Marketplace", href: "/mega-aggregator", Icon: MapPinned, detail: "The GTH PRO travel aggregator and providers." },
] as const;

export default function TravelHomePage() {
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className={styles.hero} data-travel-hero="true">
      <div className={styles.copy}>
        <p className={styles.eyebrow}><Globe2 size={14} aria-hidden="true"/> GTH PRO · YOUR WORLD, CONNECTED</p>
        <h1>Your next journey,<br/><span>beautifully connected.</span></h1>
        <p className={styles.description}>Find a stay you love, a flight that fits and experiences you’ll remember. Your next adventure starts here.</p>
        <div className={styles.heroLinks}><span><ShieldCheck size={14} aria-hidden="true"/>Explore. Compare. Book with confidence.</span><Link prefetch={false} href="/destinations">Discover destinations <ArrowUpRight size={13} aria-hidden="true"/></Link></div>
      </div>
      <div className={styles.visual} aria-label="Destination inspiration">
        <div className={styles.mainPhoto}><Image src="/maldives-bg.jpg" fill priority sizes="(max-width:760px) 1px, 310px" alt="Tropical island scenery in the Maldives"/><div className={styles.photoCaption}><span>A little inspiration</span>Somewhere you’ve always wanted to go.</div></div>
        <div className={styles.smallPhoto}><Image src="/images/cities/paris.jpg" fill sizes="(max-width:760px) 1px, 210px" alt="Paris destination scenery"/></div>
        <div className={styles.smallPhoto}><Image src="/images/mega/flights.jpg" fill sizes="(max-width:760px) 1px, 210px" alt="Flight journey inspiration"/></div>
      </div>
    </section>
      <Suspense fallback={<section className={workspaceStyles.workspace} aria-label="Travel search"><div className={workspaceStyles.searchCard}><div className={workspaceStyles.searchTop}><h2>Where will you go next?</h2></div><nav aria-label="Open a travel search" className={workspaceStyles.categoryLinks}><Link prefetch={false} href="/hotels?view=booking">Search hotels</Link><Link prefetch={false} href="/flights">Search flights</Link><Link prefetch={false} href="/activities">Find experiences</Link></nav><p role="status" className={workspaceStyles.loading}>Preparing your connected search. You can also open a travel search above.</p></div></section>}><ConnectedTravelEntry countries={HOTEL_COUNTRIES}/></Suspense>
      <TravelSectionNav />

    <section aria-labelledby="travel-services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">Explore GTH PRO Travel</p><h2 id="travel-services" className="mt-3 text-3xl font-bold md:text-5xl">Every journey starts here.</h2></div>
        <p className="max-w-md text-sm leading-7 text-[var(--text-soft)]">Discover every updated travel section from this dedicated homepage. Prices and availability must be confirmed with booking providers.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(({name,label,href,img,Icon,detail})=><Link prefetch={false} key={href} href={href} className="group min-w-0 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] transition-transform hover:-translate-y-1">
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image src={img} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white"><Icon size={15}/> {label}</span>
          </div>
          <div className="p-5 md:p-6"><h3 className="flex items-center justify-between gap-2 text-xl font-bold">{name}<ArrowUpRight size={20}/></h3><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{detail}</p><span className="gold-text mt-5 inline-flex items-center gap-2 text-sm font-semibold">Open {name} <ArrowRight size={16}/></span></div>
        </Link>)}
      </div>
    </section>
    <section aria-labelledby="more-travel" className="border-y border-[var(--border)] bg-[var(--card)]/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">Beyond the booking search</p><h2 id="more-travel" className="mt-3 text-3xl font-bold md:text-4xl">Explore the full Travel ecosystem.</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {additional.map(({name,href,Icon,detail})=><Link prefetch={false} key={href} href={href} className="gth-glass group flex min-h-32 items-start gap-4 rounded-2xl border border-[var(--border)] p-5 transition-transform hover:-translate-y-1"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]"><Icon size={22}/></span><span className="min-w-0 flex-1"><span className="flex justify-between gap-2 font-bold">{name}<ArrowRight size={17}/></span><span className="mt-2 block text-sm leading-6 text-[var(--text-soft)]">{detail}</span></span></Link>)}
        </div>
      </div>
    </section>
    <section className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between md:py-16">
      <div className="max-w-2xl"><h2 className="text-2xl font-bold md:text-3xl">One ecosystem. Independent experiences.</h2><p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">GTH PRO Travel has its own home and services. Real Estate remains on its separate approved homepage. Hotel discovery records are not live room inventory, and airline fare observations are not guaranteed booking prices.</p></div>
      <Link prefetch={false} href="/real-estate" className="gth-glass inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-6 text-sm font-bold">Real Estate <ArrowUpRight size={17}/></Link>
    </section>
  </main>;
}
