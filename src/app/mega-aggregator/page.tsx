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
            {/* Shared cinematic hero remains unchanged for desktop.
                It is not mounted on mobile, where the 930px media/planner layout
                would crowd the viewport. Existing global CSS stays untouched. */}
            <div className="relative z-0 hidden xl:block [&_.gth-master-hero-shell>div:nth-child(2)]:hidden [&_.gth-master-hero-shell>div:nth-child(3)]:hidden [&_.gth-master-hero-shell>div:last-child]:hidden">
                <HeroSlider />
            </div>

            {/* Mobile-first hero: image and copy are separate, so no manually
                painted black backgrounds, overlays, custom gradients or CSS. */}
            <section aria-labelledby="ecosystem-mobile-hero-title" className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 xl:hidden">
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                    <div className="relative aspect-[16/9] w-full">
                        <Image src="/images/mega/tours.jpg" alt="Explore places and connected global services" fill priority
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1px"
                            className="object-cover" />
                    </div>
                    <div className="gth-glass px-4 py-4 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">GTH PRO · Global ecosystem</p>
                        <h1 id="ecosystem-mobile-hero-title" className="mt-2 text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl">
                            Your world. One connected gateway.
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                            Explore travel, property research and tender opportunities from one place.
                        </p>
                    </div>
                </div>
            </section>

            <div className="relative z-30 mx-auto w-full max-w-7xl px-3 pb-6 pt-3 sm:px-6 xl:-mt-24 xl:pt-0">
                <EcosystemUnifiedSearch />
            </div>

            <EcosystemPillars />
            <EcosystemHub />
            {/* RIGHT CONTENT */}
            <div className="flex-1 min-w-0">

                {/* Source-backed destination discovery, no fixed hotel price claims. */}


                <FeaturedDestinationsSlider cities={citiesToShow} />







                <section id="providers" aria-label="Connected and approved provider programmes">
                    <GTHNetwork partners={partners} discoveryOnly />
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
