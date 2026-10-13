// File: src/app/mega-aggregator/page.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import HeroSearch from "@/components/sections/HeroSearch"
import HotelQuadSection from "@/components/sections/hotelpro/HotelQuadSection";
import { goaData, parisData } from "@/data/hotelData";
import FeaturedDestinationsSlider from "@/components/home/FeaturedDestinationsSlider"
import GTHNetwork from "@/components/sections/GTHNetwork";
import dynamic from "next/dynamic"
import HeroSlider from "@/components/HeroSlider";
import EcosystemPillars from "@/components/sections/EcosystemPillars";


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
export const revalidate = 60
export const metadata = {
    title: "GTH PRO | Global Travel, Real Estate & Tender Ecosystem",
    description: "GTH PRO connects international travel discovery, real estate intelligence and tender opportunity research in one three-pillar global ecosystem.",
    alternates: { canonical: "/" },
    keywords: ["GTH PRO", "global travel", "flights", "hotels", "tours", "real estate", "tender intelligence"],
    openGraph: {
        title: "GTH PRO — One Ecosystem. Three Global Pillars.",
        description: "Explore travel, real estate and tender intelligence through one connected global gateway.",
        images: ["/images/og/gth-travel.jpg"],
    },
};

const partners = [
    { name: "Global Bookings", original: "Trip.com", reward: "", description: "Verify live rates and terms on the provider website", image: "/images/mega/tripcom.jpg", link: "https://www.trip.com/" },
    { name: "Experience Hub", original: "Klook", reward: "", description: "Curated local adventures", image: "/images/mega/klook.jpg", link: "https://klook.tpo.lv/IKb6eSUe" },
    { name: "Elite Transfers", original: "Welcome Pickups", reward: "", description: "VIP airport logistics", image: "/images/mega/welcome.jpg", link: "https://tpo.lv/GFuzmgYk" },
    { name: "Sky Rights", original: "AirHelp", reward: "", description: "Legal flight protection", image: "/images/mega/airhelp.jpg", link: "https://airhelp.tpo.lv/W9baN8JY" },
    { name: "Safe Guard", original: "EKTA", reward: "", description: "Global health & safety cover", image: "/images/mega/ekta.jpg", link: "https://ektatraveling.tpo.lv/zRNsrOPf" },
];

const categories = [
    { name: "Flights", link: "/flights", description: "Explore fare observations and verify final prices", image: "/images/mega/flights.jpg" },
    { name: "Hotels", link: "/hotels", description: "Discover stays and check availability with providers", image: "/images/mega/hotels.jpg" },
    { name: "Tours & Activities", link: "/tours", description: "Explore curated experiences", image: "/images/mega/tours.jpg" },
    { name: "Airport Transfers", link: "/transfers", description: "Plan pickups through external providers", image: "/images/mega/transfers.jpg" },
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
        .limit(5)



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
            <div className="relative z-0">
                <HeroSlider />
            </div>

            <EcosystemPillars />
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

                {/* --- SIGNATURE EXPERIENCE : ULTRA PREMIUM --- */}
                <section className="relative py-16 md:py-24 overflow-hidden">

                    {/* AMBIENT */}
                    <div className="absolute inset-0 bg-[var(--bg)]" />
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_top,white,transparent_55%)]" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

                        {/* TOP BAR */}
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">

                            <div>
                                <p className="text-[10px] tracking-[0.45em] uppercase text-[var(--text-soft)] mb-3">
                                    Signature Experience
                                </p>

                                <h2 className="text-3xl md:text-5xl font-light tracking-[-0.05em] leading-[1] text-[var(--text)]">
                                    Digha Elite
                                    <span className="block italic font-serif text-[var(--text-soft)] mt-2">
                                        Cinematic Coastal Escape
                                    </span>
                                </h2>
                            </div>

                            <div className="gth-glass rounded-2xl px-5 py-4 border border-[var(--border)] max-w-md">
                                <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-soft)] mb-2">
                                    Exclusive Access
                                </p>

                                <p className="text-sm leading-7 text-[var(--text-soft)]">
                                    Luxury beachfront stays, cinematic storytelling, curated fine dining and private access experiences crafted exclusively for GTH travelers.
                                </p>
                            </div>

                        </div>

                        {/* MAIN GRID */}
                        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6 xl:gap-10 items-stretch">

                            {/* LEFT VISUAL */}
                            <div className="space-y-4">

                                {/* HERO VISUAL */}
                                <div className="group relative overflow-hidden rounded-[32px] border border-[var(--border)] gth-glass aspect-[16/9]">

                                    <img
                                        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1600"
                                        alt="Digha Experience"
                                        className="w-full h-full object-cover transition-transform duration-[1600ms] group-hover:scale-105"
                                    />

                                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.65),transparent_45%)]" />

                                    {/* PLAY */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-20 w-20 rounded-full gth-glass border border-[var(--border)] flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                                            <svg className="w-7 h-7 fill-[var(--text)] ml-1" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* INFO */}
                                    <div className="absolute left-0 right-0 bottom-0 p-6 flex items-end justify-between gap-6">

                                        <div>
                                            <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--text-soft)] mb-2">
                                                Live Experience
                                            </p>

                                            <h3 className="text-xl md:text-2xl font-semibold text-[var(--text)]">
                                                Coastal Documentary Journey
                                            </h3>
                                        </div>

                                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                                            <span className="h-2 w-2 rounded-full bg-[var(--text)] animate-pulse" />
                                            <span className="text-xs text-[var(--text-soft)] uppercase tracking-[0.25em]">
                                                Premium Active
                                            </span>
                                        </div>

                                    </div>

                                </div>

                                {/* MINI GRID */}
                                <div className="grid grid-cols-3 gap-3">

                                    {[
                                        {
                                            img: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
                                            title: "Royal Suites"
                                        },
                                        {
                                            img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
                                            title: "Ocean Pools"
                                        },
                                        {
                                            img: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800",
                                            title: "Fine Dining"
                                        }
                                    ].map((item, i) => (

                                        <div
                                            key={i}
                                            className="group relative overflow-hidden rounded-2xl border border-[var(--border)] gth-glass aspect-[1/1]"
                                        >

                                            <img
                                                src={item.img}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                            />

                                            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.75),transparent)]" />

                                            <div className="absolute bottom-0 inset-x-0 p-3">
                                                <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--text)] font-medium">
                                                    {item.title}
                                                </p>
                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </div>

                            {/* RIGHT PANEL */}
                            <div className="flex flex-col gap-5">

                                {/* EXPERIENCE CARD */}
                                <div className="gth-glass rounded-[32px] border border-[var(--border)] p-6 md:p-8">

                                    <div className="flex items-center justify-between gap-4 mb-8">

                                        <div>
                                            <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--text-soft)] mb-2">
                                                Partner Spotlight
                                            </p>

                                            <h3 className="text-2xl md:text-4xl font-light leading-[1.05] tracking-[-0.04em] text-[var(--text)]">
                                                Digha Elite
                                                <span className="block italic font-serif text-[var(--text-soft)] mt-2">
                                                    Legacy Collection
                                                </span>
                                            </h3>
                                        </div>

                                        <div className="hidden md:flex h-14 w-14 rounded-2xl border border-[var(--border)] items-center justify-center bg-[var(--card)]">
                                            ✦
                                        </div>

                                    </div>

                                    <p className="text-sm md:text-base leading-8 text-[var(--text-soft)]">
                                        Step beyond traditional tourism through curated cinematic expeditions, luxury coastal stays, premium mobility and AI-powered hospitality experiences designed for modern global travelers.
                                    </p>

                                    {/* FEATURES */}
                                    <div className="grid grid-cols-2 gap-3 mt-8">

                                        {[
                                            "4K Journey Documentary",
                                            "Private Beach Access",
                                            "Luxury Transfers",
                                            "Priority Concierge",
                                            "Fine Dining Access",
                                            "AI Guided Routing"
                                        ].map((item) => (

                                            <div
                                                key={item}
                                                className="h-14 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 flex items-center text-xs uppercase tracking-[0.18em] text-[var(--text-soft)]"
                                            >
                                                {item}
                                            </div>

                                        ))}

                                    </div>

                                </div>

                                {/* ADVANTAGE */}
                                <div className="gth-glass rounded-[28px] border border-[var(--border)] p-6">

                                    <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--text-soft)] mb-4">
                                        Rare Advantage
                                    </p>

                                    <p className="text-sm md:text-base leading-8 italic text-[var(--text)]">
                                        “Every guest receives a professionally edited cinematic memory archive alongside exclusive access to premium beachfront experiences reserved only for GTH ecosystem members.”
                                    </p>

                                </div>

                                {/* ACTIONS */}
                                <div className="flex flex-col sm:flex-row gap-3">

                                    <Link
                                        href="/destinations/digha"
                                        className="gth-btn-gold flex-1 h-14 rounded-2xl text-sm uppercase tracking-[0.2em] flex items-center justify-center"
                                    >
                                        Explore Experience →
                                    </Link>

                                    <Link
                                        href="https://wa.me/9339952669"
                                        className="gth-btn flex-1 h-14 rounded-2xl text-sm uppercase tracking-[0.2em] flex items-center justify-center"
                                    >
                                        Reserve Access
                                    </Link>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>




                {/* Goa ka Jhakkas Section */}
                <HotelQuadSection {...goaData} />


                <FeaturedDestinationsSlider cities={citiesToShow} />





                {/* Paris ka Cinematic Section */}
                <HotelQuadSection {...parisData} />

                <GTHNetwork partners={partners} discoveryOnly />




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
                                    className="group relative flex min-h-[245px] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:min-h-[295px]">
                                    <Image src={category.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" aria-hidden="true" />
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-semibold tracking-tight">{category.name}</h3>
                                        <p className="mt-2 text-sm leading-6 text-white/80">{category.description}</p>
                                        <span className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-amber-200">
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
                                {name:"Airport Transfers",href:"/transfers"},
                            ].map(item=><Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-semibold text-[var(--text)] transition-colors hover:border-[var(--gold)]">{item.name} <span className="ml-2" aria-hidden="true">↗</span></Link>)}
                        </nav>
                    </div>
                </section>

                {/* Travel Guides - Cocktail Version (Airbnb Style + Gemini Clean Look) */}
                <section id="insights" className="bg-black py-14 text-white md:py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="flex flex-col items-center mb-12">
                            <h2 className="text-4xl font-bold tracking-tight mb-4">
                                Travel intelligence & practical guides
                            </h2>
                            <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Goa Guide Card - Updated for Originality */}
                            <Link href="/blog/research-a-new-destination" className="group relative overflow-hidden rounded-2xl bg-neutral-900 transition-all hover:ring-2 hover:ring-skyBlue">
                                <div className="relative h-64 w-full overflow-hidden">
                                    <img
                                        // Yahan static ki jagah koi bhi popular hotel id dalo testing ke liye
                                        src="/images/hotels/goa-1.jpg"
                                        alt="Goa Luxury"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                                    />
                                    {/* Live Price Tag overlay */}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                        <p className="text-[10px] font-bold text-skyBlue">RESEARCH BEFORE YOU BOOK</p>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                </div>
                                <div className="absolute bottom-0 p-6">
                                    <h3 className="text-xl font-bold">Destination Research Guide</h3>
                                    <p className="text-sm text-neutral-400 mt-1 italic">Useful checks before choosing a destination</p>
                                </div>
                            </Link>

                            {/* Paris Guide Card */}
                            <Link href="/blog/hotel-booking-checklist" className="group relative overflow-hidden rounded-2xl bg-neutral-900 transition-all hover:ring-2 hover:ring-blue-500">
                                <div className="relative h-64 w-full overflow-hidden">
                                    <img
                                        // GOA WALA SAME FORMULA (Paris Hotel ID: 255541)
                                        src="/images/hotels/paris-1.jpg"
                                        alt="Paris Travel Guide"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                        <p className="text-[10px] font-bold text-sky-400">HOTEL BOOKING CHECKLIST</p>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                </div>
                                <div className="absolute bottom-0 p-6">
                                    <h3 className="text-xl font-bold text-white">Hotel Booking Checklist</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Room rates, taxes and cancellation terms</p>
                                </div>
                            </Link>

                            {/* Dubai Guide Card */}
                            <Link href="/blog/how-to-compare-flight-fares" className="group relative overflow-hidden rounded-2xl bg-neutral-900 transition-all hover:ring-2 hover:ring-blue-500">
                                <div className="relative h-64 w-full overflow-hidden">
                                    <img
                                        // GOA WALA SAME FORMULA (Dubai Hotel ID: 16522)
                                        src="/images/hotels/dubai-1.jpg"
                                        alt="Dubai Travel Guide"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                        <p className="text-[10px] font-bold text-sky-400">FLIGHT FARE CHECKLIST</p>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                </div>
                                <div className="absolute bottom-0 p-6">
                                    <h3 className="text-xl font-bold text-white">How to Compare Flight Fares</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Baggage, fare rules and connections</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ========================= MEGA DEALS ========================= */}

                <section id="providers" className="relative overflow-hidden bg-[var(--bg)] py-14 md:py-20">

                    <div className="mx-auto max-w-7xl px-4 md:px-6">

                        {/* HEADER */}

                        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

                            <div className="max-w-2xl">

                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] gth-glass px-4 py-2">

                                    <span className="h-2 w-2 rounded-full bg-[var(--gold)] animate-pulse" />

                                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-soft)]">
                                        Premium Ecosystem
                                    </span>

                                </div>

                                <h2 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-4xl">
                                    Independent Travel Providers
                                </h2>

                                <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)] md:max-w-xl">
                                    Explore travel providers worldwide. Rates and booking availability are confirmed on the provider website, not by GTH PRO.
                                </p>

                            </div>

                            <Link
                                href="/travel"
                                className="gth-btn hidden h-11 items-center justify-center rounded-full px-6 text-[11px] font-black uppercase tracking-[0.18em] md:inline-flex"
                            >
                                Explore All
                            </Link>

                        </div>

                        {/* GRID */}

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">

                            {partners.map((p, idx) => (

                                <Link
                                    key={idx}
                                    href={p.link || "#"}
                                    target="_blank"
                                    rel="nofollow sponsored noopener noreferrer"
                                    className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] transition-all duration-500 hover:-translate-y-1 hover:border-[var(--gold)]/30"
                                >

                                    {/* IMAGE */}

                                    <div className="relative aspect-[4/3] overflow-hidden">

                                        <Image
                                            src={p.image}
                                            alt={p.name}
                                            fill
                                            priority={idx < 2}
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />

                                        {/* BADGES */}

                                        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">

                                            <div className="rounded-full border border-[var(--border)] gth-glass px-3 py-1">

                                                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text)]">
                                                    External Provider
                                                </span>

                                            </div>

                                            {p.reward && (

                                                <div className="rounded-full gth-btn-gold px-3 py-1">

                                                    <span className="text-[9px] font-black uppercase tracking-[0.16em]">
                                                        {p.reward}
                                                    </span>

                                                </div>

                                            )}

                                        </div>

                                    </div>

                                    {/* CONTENT */}

                                    <div className="p-4 md:p-5">

                                        <div className="mb-3 flex items-start justify-between gap-3">

                                            <div className="min-w-0">

                                                <h3 className="line-clamp-1 text-sm font-black tracking-tight text-[var(--text)] md:text-base">
                                                    {p.name}
                                                </h3>

                                                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                                                    External Website
                                                </p>

                                            </div>

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg)]">

                                                <Image
                                                    src={p.image}
                                                    alt={p.name}
                                                    width={44}
                                                    height={44}
                                                    className="h-full w-full object-cover"
                                                />

                                            </div>

                                        </div>

                                        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-soft)]">
                                            {p.description}
                                        </p>

                                        <div className="mt-5 flex items-center justify-between">

                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-soft)]">
                                                Provider Site
                                            </span>

                                            <div className="gth-btn-gold inline-flex items-center justify-center rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] transition-transform duration-300 group-hover:scale-105">
                                                Visit Provider
                                            </div>

                                        </div>

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