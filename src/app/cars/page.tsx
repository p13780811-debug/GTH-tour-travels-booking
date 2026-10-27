import TravelSectionNav from "@/components/travel/TravelSectionNav";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BadgeInfo, BriefcaseBusiness, CalendarCheck, CarFront, CircleHelp, CreditCard, Fuel, Globe2, KeyRound, Luggage, MapPinned, Route, ShieldCheck, Users } from "lucide-react";
import CarRentalPlanner from "@/components/travel/CarRentalPlanner";
import TravelpayoutsCarWidget from "@/components/travel/TravelpayoutsCarWidget";
import TravelPartnerSearch from "@/components/travel/TravelPartnerSearch";

export const metadata: Metadata = {
  title: "Worldwide Car Rental & Self-Drive Booking | GTH PRO Travel",
  description: "Plan airport car hire, self-drive rentals, family cars and one-way rentals worldwide. Compare QEEQ and Localrent Travelpayouts partner widgets and confirm actual vehicle prices and booking terms with rental providers.",
  alternates: { canonical: "/cars" },
  openGraph: {
    title: "Global Car Rentals & Airport Pickup | GTH PRO",
    description: "Find car-rental providers, plan dates and pickup locations, and compare terms with trusted rental websites.",
    images: ["/images/mega/transfers.jpg"],
    type: "website",
  },
};

const rentalNeeds = [
  { name: "Airport car hire", note: "Pickup and return at major airports where offered.", Icon: Luggage },
  { name: "City self-drive", note: "Choose a pickup city, vehicle category and trip duration.", Icon: CarFront },
  { name: "One-way rentals", note: "Check whether pickup and return cities may differ, and any fees.", Icon: Route },
  { name: "Family & group cars", note: "Compare seat capacity, boot space and child-seat options.", Icon: Users },
  { name: "Business travel", note: "Review permitted drivers, deposit terms and invoicing.", Icon: BriefcaseBusiness },
  { name: "Longer trips", note: "Compare mileage limits, fuel and cross-border conditions.", Icon: Fuel },
] as const;
const bookingChecks = [
  {title:"Driver eligibility",info:"Check minimum age, licence requirements, international permit rules and extra driver fees.",Icon:KeyRound},
  {title:"Final payable amount",info:"Review the full rental total, currency, deposit or card hold, airport surcharges and applicable taxes.",Icon:CreditCard},
  {title:"Coverage and excess",info:"Read the excess/deductible, exclusions, fuel policy, mileage and collision-damage conditions.",Icon:ShieldCheck},
  {title:"Pickup and returns",info:"Confirm desk hours, flight delay process, late return fees, country restrictions and after-hours terms.",Icon:CalendarCheck},
] as const;
const providers = [
  {name:"DiscoverCars",website:"https://www.discovercars.com/",description:"Search available self-drive rental vehicles and confirm rates on the provider website."},
  {name:"Rentalcars.com",website:"https://www.rentalcars.com/",description:"Compare rental options where available, then review included fees and supplier conditions."},
  {name:"QEEQ",website:"https://www.qeeq.com/",description:"Explore available vehicle categories, pickup cities and one-way rental conditions."},
] as const;
const faqs = [
  {q:"Can I book a rental car directly with GTH PRO?",a:"No. GTH PRO provides a planning interface, affiliate partner widgets and links to independent booking suppliers. A rental provider confirms the vehicle and completes the reservation."},
  {q:"How does the destination search work?",a:"Find car rentals opens your destination's Klook search directly through our affiliate link. Choose dates, exact pickup and return details on the provider. The separate optional checklist stays in your browser and does not transfer dates or driving details."},
  {q:"Can I rent in a different country or city?",a:"The planner supports international locations. The Localrent widget has a preset country and city, while QEEQ has its own search form. Supported locations depend on the individual supplier."},
  {q:"Can I return the car at another location?",a:"Some suppliers allow one-way returns, subject to availability and possible additional charges. Confirm return location and fees on the supplier website."},
  {q:"Is airport transfer the same as car rental?",a:"No. A car rental generally involves driving yourself; an airport transfer typically includes a driver. You can explore both options through GTH PRO."},
] as const;

export default function CarsPage() {
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="relative isolate overflow-hidden border-b border-[var(--border)]" data-travel-hero="true">
      <Image src="/images/mega/transfers.jpg" alt="" fill priority sizes="100vw"
        className="absolute inset-0 -z-20 object-cover opacity-25"/>
      <div className="absolute inset-0 -z-10 bg-[var(--bg)]/80"/>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-16 sm:px-6 md:py-24">
        <p className="hidden sm:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
          <Globe2 size={16}/> GTH PRO · Worldwide Travel
        </p>
        <h1 className="mt-1 sm:mt-5 max-w-4xl text-2xl sm:text-4xl font-bold tracking-tight md:text-6xl">Rent a car. Explore more of the world.</h1>
        <p className="hidden sm:block mt-5 max-w-3xl text-base leading-8 text-[var(--text-soft)]">
          Plan airport pickup, self-drive holidays, city car hire and one-way journeys.
          Switch between QEEQ and Localrent partner tools and confirm actual vehicle availability, full prices and policies directly with the booking partner.
        </p>
        <nav aria-label="Car rental quick links" className="hidden sm:flex mt-8 flex-wrap gap-3">
          <a href="#rental-planner-heading" className="gth-btn-gold inline-flex min-h-12 items-center gap-2 rounded-xl px-5 font-semibold">Plan your rental <ArrowRight size={16}/></a>
          <a href="#car-rental-offers" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 font-semibold">Partner car offers <ArrowUpRight size={16}/></a>
          <Link href="/transfers" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 font-semibold">Chauffeured airport transfers</Link>
        </nav>
      </div>
    </section>
      <TravelSectionNav />

    <div className="mx-auto max-w-7xl space-y-12 px-4 py-3 sm:py-12 sm:px-6 md:py-16">
      <TravelPartnerSearch kind="cars" />
      <TravelpayoutsCarWidget />
      <CarRentalPlanner />

      <section aria-labelledby="worldwide-search-heading">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Global rental provider handoff</p>
        <h2 id="worldwide-search-heading" className="mt-3 text-2xl font-semibold">Search rentals worldwide</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          If a featured partner widget is unavailable or has the wrong location, open one of these independent rental websites
          for a location-specific search. These are direct provider links, not guaranteed commission-generating affiliate links.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {providers.map(provider=><article key={provider.name} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-xl font-semibold">{provider.name}</h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-[var(--text-soft)]">{provider.description}</p>
            <a href={provider.website} target="_blank" rel="noopener noreferrer"
              className="gth-btn-gold mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold">
              Open rental search <ArrowUpRight size={16}/>
            </a>
          </article>)}
        </div>
      </section>

      <section aria-labelledby="rental-services-heading">
        <h2 id="rental-services-heading" className="text-2xl font-semibold">Rentals for every type of journey</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rentalNeeds.map(({name,note,Icon})=><article key={name} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <Icon size={25} className="text-[var(--gold)]" aria-hidden="true"/>
            <h3 className="mt-3 text-lg font-semibold">{name}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{note}</p>
          </article>)}
        </div>
      </section>

      <section aria-labelledby="booking-checklist-heading">
        <h2 id="booking-checklist-heading" className="text-2xl font-semibold">Before you confirm a rental</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {bookingChecks.map(({title,info,Icon})=><div key={title} className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <Icon size={23} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
            <div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{info}</p></div>
          </div>)}
        </div>
      </section>

      <section aria-label="Related ground transportation" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="flex items-start gap-3"><MapPinned size={26} className="mt-1 text-[var(--gold)]"/>
          <div><h2 className="text-2xl font-semibold">Need a driver instead?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              For airport pickup with a driver, explore our separate Transfers page and the existing tracked Welcome Pickups partner link.
              Unlike self-drive rentals, a transfer is normally a booked passenger journey.
            </p></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/transfers" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 font-semibold">Plan airport transfer <ArrowRight size={16}/></Link>
          <a href="https://tpo.lv/GFuzmgYk" rel="sponsored noopener noreferrer" target="_blank"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 font-semibold">
            Welcome Pickups · affiliate partner <ArrowUpRight size={16}/>
          </a>
        </div>
      </section>

      <section aria-labelledby="rental-faq-heading">
        <h2 id="rental-faq-heading" className="flex items-center gap-2 text-2xl font-semibold"><CircleHelp className="text-[var(--gold)]"/> Car rental FAQs</h2>
        <div className="mt-5 space-y-3">{faqs.map(({q,a})=><details key={q} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <summary className="cursor-pointer font-semibold">{q}</summary>
          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{a}</p>
        </details>)}</div>
      </section>
      <p className="flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <BadgeInfo size={17} className="mt-1 shrink-0"/> GTH PRO is a discovery and referral platform. It does not operate rental fleets, confirm bookings,
        collect rental payments or guarantee vehicle availability. <Link href="/affiliate-disclosure" className="underline">Affiliate disclosure</Link>.
      </p>
      <nav aria-label="Continue planning your journey" className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/flights" className="underline">Flights</Link><Link href="/hotels" className="underline">Hotels</Link>
        <Link href="/transfers" className="underline">Airport Transfers</Link><Link href="/bus" className="underline">Bus</Link>
        <Link href="/train" className="underline">Rail</Link><Link href="/destinations" className="underline">Destinations</Link>
      </nav>
    </div>
  </main>;
}
