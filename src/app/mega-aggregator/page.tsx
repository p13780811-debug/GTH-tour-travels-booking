// File: src/app/mega-aggregator/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import EcosystemUnifiedSearch from "./EcosystemUnifiedSearch";
import FeaturedDestinationsSlider from "@/components/home/FeaturedDestinationsSlider"
import GTHNetwork from "@/components/sections/GTHNetwork";
import HeroSlider from "@/components/HeroSlider";
import EcosystemPillars from "@/components/sections/EcosystemPillars";
import EcosystemHub from "./EcosystemHub";


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
export const revalidate = 3600
export const metadata = {
    title: "GTH PRO | Global Travel, Real Estate & Tender Ecosystem",
    description: "GTH PRO connects international travel discovery, real estate intelligence and tender opportunity research in one three-pillar global ecosystem.",
    alternates: { canonical: "/mega-aggregator" },
    keywords: ["GTH PRO", "global travel", "flights", "hotels", "tours", "real estate", "tender intelligence"],
    openGraph: {
        title: "GTH PRO — One Ecosystem. Three Global Pillars.",
        description: "Explore travel, real estate and tender intelligence through one connected global gateway.",
        images: ["/images/og/gth-travel.jpg"],
    },
};

const partners = [
    { name: "GetYourGuide · Kolkata Cruise", reward: "", description: "Owner-authorized Kolkata Hooghly River cruise. Verify supplier dates and final prices.", image: "/images/mega/tours.jpg", link: "https://www.getyourguide.com/kolkata-l275/kolkata-hooghly-river-sunset-cruise-with-snacks-drinks-t1250175/?partner_id=DF3NBKA&utm_medium=online_publisher&cmp=gthpro_cruises_kolkata" },
    { name: "Klook Experiences", original: "Klook", reward: "", description: "Discover Klook experiences and confirm real prices with the provider", image: "/images/mega/klook.jpg", link: "https://klook.tpo.lv/IKb6eSUe" },
    { name: "Welcome Pickups", original: "Welcome Pickups", reward: "", description: "Explore airport transfer availability and supplier pickup terms", image: "/images/mega/welcome.jpg", link: "https://tpo.lv/GFuzmgYk" },
    { name: "AirHelp", original: "AirHelp", reward: "", description: "Check independent flight-disruption eligibility and claim services", image: "/images/mega/airhelp.jpg", link: "https://airhelp.tpo.lv/W9baN8JY" },
    { name: "EKTA Travel Insurance", original: "EKTA", reward: "", description: "Review independent travel insurance terms, coverage and exclusions", image: "/images/mega/ekta.jpg", link: "https://ektatraveling.tpo.lv/zRNsrOPf" },
];

const categories = [
    { name: "Flights", link: "/flights", description: "Explore fare observations and verify final prices", image: "/images/mega/flights.jpg" },
    { name: "Hotels", link: "/hotels", description: "Discover stays and check availability with providers", image: "/images/mega/hotels.jpg" },
    { name: "Tours & Activities", link: "/tours", description: "Explore curated experiences", image: "/images/mega/tours.jpg" },
    { name: "Airport Transfers", link: "/transfers", description: "Plan pickups through external providers", image: "/images/mega/transfers.jpg" },
    { name: "Car Rentals", link: "/cars", description: "Explore worldwide car hire and self-drive options", image: "/images/mega/transfers.jpg" },
    { name: "Insurance", link: "/insurance", description: "Research policy exclusions and provider coverage", image: "/images/mega/insurance.jpg" },
];

const featuredCities = [
    { name: "Paris", slug: "paris", image_url: "/images/cities/paris.jpg" },
    { name: "Goa", slug: "goa", image_url: "/images/cities/goa.jpg" },
    { name: "Bali", slug: "bali", image_url: "/images/cities/bali.jpg" },
    { name: "Dubai", slug: "dubai", image_url: "/images/cities/dubai.jpg" },
    { name: "Tokyo", slug: "tokyo", image_url: "/images/cities/tokyo.jpg" },
];

export default async function MegaAggregator() {
    const { data: destinations } = await supabase
        .from("destinations")
        .select("name, slug, image_url")
        .order("name")
        .limit(5).abortSignal(AbortSignal.timeout(5_000))



    const allCities = [...featuredCities, ...(destinations || [])]

    const citiesToShow = Array.from(
        new Map(allCities.map(city => [city.slug, city])).values()
    )

    return (
        <div className="gth-master-home w-full bg-[var(--bg)] transition-colors duration-300">
            <div className="gth-master-intro border-b border-[var(--border)] bg-[var(--card)]/70">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-soft)]">
                        GTH PRO <span className="mx-2 text-[var(--gold)]">•</span> Global Technical Hub
                    </p>
                    <Link href="#ecosystem-pillars" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--text)] transition-colors hover:border-[var(--gold)]">
                        Explore the three pillars <span aria-hidden="true">↓</span>
                    </Link>
                </div>
            </div>
            {/* Page-scoped suppression of the shared hero's nonfunctional search bar.
                The shared HeroSlider itself and global CSS remain unchanged. */}
            <div className="relative z-0 [&_.gth-master-hero-shell>div:nth-child(2)]:hidden [&_.gth-master-hero-shell>div:last-child]:hidden">
                <HeroSlider />
            </div>
            <div className="relative z-40 mx-auto -mt-48 w-full max-w-7xl px-3 pb-8 sm:-mt-36 sm:px-6 xl:-mt-20">
                <EcosystemUnifiedSearch />
            </div>

            <EcosystemPillars />
            <EcosystemHub />
            <section aria-label="Join GTH PRO business ecosystem" className="border-y border-[var(--border)] bg-[var(--card)]/60 py-10">
              <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">Business onboarding</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Have properties, inventory or a distribution programme?</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">
                    Property developers, agents and travel partners can introduce genuine projects and services for review.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/real-estate/post-property" className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-5 text-sm font-semibold text-[var(--text)]">Submit a property</Link>
                  <Link href="/partners/apply" className="gth-btn-gold inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold">Become a partner →</Link>
                </div>
              </div>
            </section>



            {/* RIGHT CONTENT */}
            <div className="flex-1 min-w-0">

                {/* Source-backed destination discovery, no fixed hotel price claims. */}


                <FeaturedDestinationsSlider cities={citiesToShow} />







                <section id="providers" aria-label="Connected and approved provider programmes">
                    <GTHNetwork partners={partners} discoveryOnly />
                </section>




                {/* Connected Travel Services */}
                <section id="travel-services" aria-labelledby="travel-services-heading" className="border-y border-[var(--border)] bg-[var(--card)]/35 py-14 md:py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Pillar 01 · Tours & Travels</p>
                                <h2 id="travel-services-heading" className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)] md:text-4xl">
                                    Travel services, clearly connected.
                                </h2>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">
                                    From search to discovery, choose a service and verify booking details with its provider.
                                </p>
                            </div>
                            <Link href="/travel" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--gold)]">
                                All Travel Services <span className="ml-2" aria-hidden="true">↗</span>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {categories.map((category) => (
                                <Link key={category.link} href={category.link}
                                    className="gth-glass group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] transition-colors hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                                    <div className="relative h-40 w-full shrink-0 overflow-hidden">
                                        <Image src={category.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 p-4 text-[var(--text)]">
                                        <h3 className="text-lg font-semibold tracking-tight">{category.name}</h3>
                                        <p className="flex-1 text-sm leading-6 text-[var(--text-soft)]">{category.description}</p>
                                        <span className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold">
                                            Explore <span aria-hidden="true">↗</span>
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <nav aria-label="Additional travel services" className="mt-7 flex flex-wrap gap-2">
                            {[
                                {name:"Destinations",href:"/destinations"},
                                {name:"Flights",href:"/flights"},
                                {name:"Hotels",href:"/hotels"},
                                {name:"Guides",href:"/guides"},
                                {name:"Articles",href:"/blog"},
                                {name:"Bus",href:"/bus"},
                                {name:"Rail",href:"/train"},
                                {name:"Ferries",href:"/ferry"},
                                {name:"Activities",href:"/activities"},
                                {name:"Insurance",href:"/insurance"},
                                {name:"Airport Transfers",href:"/transfers"},
                                {name:"Car Rentals",href:"/cars"},
                                {name:"Cruises",href:"/cruises"},
                                {name:"12Go Bus",href:"/bus"},
                                {name:"12Go Train",href:"/train"},
                                {name:"AI Planner",href:"/ai-trip"},
                                {name:"Property discovery",href:"/real-estate"},
                                {name:"Tender opportunities",href:"/tender"},
                            ].map(item=><Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-semibold text-[var(--text)] transition-colors hover:border-[var(--gold)]">{item.name} <span className="ml-2" aria-hidden="true">↗</span></Link>)}
                        </nav>
                    </div>
                </section>

                {/* Editorial guides use the established global GTH glass/card system.
                    No manually defined black backgrounds, gradients or image overlays. */}
                <section id="insights" className="py-12 md:py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="mb-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">Research & guidance</p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Travel intelligence & practical guides</h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Useful information before you choose a destination or booking partner.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {title:"Destination Research Guide",detail:"Useful checks before choosing a destination",image:"/images/cities/goa.jpg",href:"/blog/research-a-new-destination"},
                                {title:"Hotel Booking Checklist",detail:"Room rates, taxes and cancellation terms",image:"/images/cities/paris.jpg",href:"/blog/hotel-booking-checklist"},
                                {title:"How to Compare Flight Fares",detail:"Baggage, fare rules and connections",image:"/images/cities/dubai.jpg",href:"/blog/how-to-compare-flight-fares"},
                            ].map(guide=>(
                                <Link href={guide.href} key={guide.href}
                                    className="gth-glass group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] transition-colors hover:border-[var(--gold)]">
                                    <div className="relative h-40 w-full shrink-0 overflow-hidden">
                                        <Image src={guide.image} alt="" fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 p-4">
                                        <h3 className="text-lg font-semibold text-[var(--text)]">{guide.title}</h3>
                                        <p className="flex-1 text-sm leading-6 text-[var(--text-soft)]">{guide.detail}</p>
                                        <span className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--text)]">Read guide <span aria-hidden="true">↗</span></span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

            </div>




        </div>
    );
}
