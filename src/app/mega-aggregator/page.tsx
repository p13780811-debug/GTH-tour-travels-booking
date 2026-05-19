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


const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
export const revalidate = 60
export const metadata = {
    title: "Luxury Flights, Hotels & Tours Marketplace | Flights Hotels Tours | GTH",
    description:
        "Compare flights, luxury hotels, tours and travel services worldwide with GTH Travel marketplace.",
    keywords: [
        "luxury travel",
        "flight comparison",
        "hotel booking",
        "travel marketplace"
    ],
    openGraph: {
        title: "GTH Luxury Travel Marketplace",
        description: "Compare travel services globally",
        images: ["/images/og/gth-travel.jpg"],
    },


};
const partners = [
    { name: "Global Bookings", original: "Trip.com", reward: "1-5.5%", description: "Worldwide stay network", image: "/images/mega/tripcom.jpg", link: "https://klook.tpo.lv/IKb6eSUe" },
    { name: "Experience Hub", original: "Klook", reward: "2-5%", description: "Curated local adventures", image: "/images/mega/klook.jpg", link: "https://klook.tpo.lv/IKb6eSUe" },
    { name: "Elite Transfers", original: "Welcome Pickups", reward: "8-9%", description: "VIP airport logistics", image: "/images/mega/welcome.jpg", link: "https://tpo.lv/GFuzmgYk" },
    { name: "Sky Rights", original: "AirHelp", reward: "15-16.6%", description: "Legal flight protection", image: "/images/mega/airhelp.jpg", link: "https://airhelp.tpo.lv/W9baN8JY" },
    { name: "Safe Guard", original: "EKTA", reward: "20%", description: "Global health & safety cover", image: "/images/mega/ekta.jpg", link: "https://ektatraveling.tpo.lv/zRNsrOPf" },
];

const categories = [
    { name: "Flights", link: "/flights", description: "Compare & book flights worldwide", image: "/images/mega/flights.jpg" },
    { name: "Hotels", link: "/hotels", description: "Luxury stays & deals", image: "/images/mega/hotels.jpg" },
    { name: "Tours & Activities", link: "/tours", description: "Explore curated experiences", image: "/images/mega/tours.jpg" },
    { name: "Transfers & Rentals", link: "/cars", description: "Airport & local transport", image: "/images/mega/transfers.jpg" },
    { name: "Insurance", link: "/insurance", description: "Travel safely with coverage", image: "/images/mega/insurance.jpg" },
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
        <div className="w-full bg-[var(--bg)] transition-colors duration-300">
            <div className="relative z-0">
                <HeroSlider />
            </div>



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

                <GTHNetwork partners={partners} />




                {/* Categories Section - FULL IMAGE MODERN LOOK */}
                <section className="py-20 px-8 max-w-7xl mx-auto">
                    <h2 className="md:text-4xl font-black text-center gold-text uppercase leading-tight tracking-widest italic text-yellow-900">
                        Premium Services
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

                        {categories.map((c, idx) => (

                            <a
                                key={idx}
                                href={c.link}   // 🔥 IMPORTANT
                                target="_blank"
                                rel="nofollow noopener noreferrer"
                                className="group relative h-[350px] rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer block"
                            >

                                {/* IMAGE */}
                                <Image
                                    src={c.image}
                                    alt={c.name}
                                    fill
                                    className="object-cover group-hover:scale-125 transition-transform duration-1000 ease-in-out"
                                    unoptimized
                                />

                                {/* OVERLAY */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-6 text-center">

                                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-2 group-hover:text-sky-400 transition-colors">
                                        {c.name}
                                    </h3>

                                    <div className="h-0 group-hover:h-12 opacity-0 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                                        <p className="text-gray-300 text-xs font-medium">
                                            {c.description}
                                        </p>
                                    </div>

                                    <div className="w-12 h-1 bg-sky-500 mx-auto mt-4 group-hover:w-full transition-all duration-500 rounded-full" />
                                </div>

                            </a>

                        ))}

                    </div>
                </section>



                {/* Travel Guides - Cocktail Version (Airbnb Style + Gemini Clean Look) */}
                <section className="py-20 bg-black text-white">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="flex flex-col items-center mb-12">
                            <h2 className="text-4xl font-bold tracking-tight mb-4">
                                Popular Travel Guides
                            </h2>
                            <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* Goa Guide Card - Updated for Originality */}
                            <Link href="/blog/goa-travel-guide" className="group relative overflow-hidden rounded-2xl bg-neutral-900 transition-all hover:ring-2 hover:ring-skyBlue">
                                <div className="relative h-64 w-full overflow-hidden">
                                    <img
                                        // Yahan static ki jagah koi bhi popular hotel id dalo testing ke liye
                                        src="/images/hotels/goa-1.jpg"
                                        alt="Goa Luxury"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                                    />
                                    {/* Live Price Tag overlay */}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                        <p className="text-[10px] font-bold text-skyBlue">LIVE DEALS FROM ₹2,499</p>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                </div>
                                <div className="absolute bottom-0 p-6">
                                    <h3 className="text-xl font-bold">Goa Travel Guide</h3>
                                    <p className="text-sm text-neutral-400 mt-1 italic">Real-time luxury aggregator access</p>
                                </div>
                            </Link>

                            {/* Paris Guide Card */}
                            <Link href="/blog/paris-travel-guide" className="group relative overflow-hidden rounded-2xl bg-neutral-900 transition-all hover:ring-2 hover:ring-blue-500">
                                <div className="relative h-64 w-full overflow-hidden">
                                    <img
                                        // GOA WALA SAME FORMULA (Paris Hotel ID: 255541)
                                        src="/images/hotels/paris-1.jpg"
                                        alt="Paris Travel Guide"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                        <p className="text-[10px] font-bold text-sky-400">LIVE DEALS FROM ₹12,999</p>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                </div>
                                <div className="absolute bottom-0 p-6">
                                    <h3 className="text-xl font-bold text-white">Paris Travel Guide</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Art, Romance & Cuisine</p>
                                </div>
                            </Link>

                            {/* Dubai Guide Card */}
                            <Link href="/blog/dubai-travel-guide" className="group relative overflow-hidden rounded-2xl bg-neutral-900 transition-all hover:ring-2 hover:ring-blue-500">
                                <div className="relative h-64 w-full overflow-hidden">
                                    <img
                                        // GOA WALA SAME FORMULA (Dubai Hotel ID: 16522)
                                        src="/images/hotels/dubai-1.jpg"
                                        alt="Dubai Travel Guide"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                        <p className="text-[10px] font-bold text-sky-400">LIVE DEALS FROM ₹8,499</p>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                </div>
                                <div className="absolute bottom-0 p-6">
                                    <h3 className="text-xl font-bold text-white">Dubai Travel Guide</h3>
                                    <p className="text-sm text-neutral-400 mt-1">Luxury, Desert & Skyscrapers</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ========================= MEGA DEALS ========================= */}

                <section className="relative overflow-hidden py-12 md:py-16 bg-[var(--bg)]">

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
                                    Exclusive Mega Deals
                                </h2>

                                <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)] md:max-w-xl">
                                    Verified global partnerships, premium rewards and curated luxury access powered by the GTH ecosystem.
                                </p>

                            </div>

                            <Link
                                href="/partners"
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
                                    rel="nofollow sponsored"
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
                                                    Verified
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
                                                    Global Access
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
                                                Premium Deal
                                            </span>

                                            <div className="gth-btn-gold inline-flex items-center justify-center rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] transition-transform duration-300 group-hover:scale-105">
                                                Claim
                                            </div>

                                        </div>

                                    </div>

                                </Link>

                            ))}

                        </div>

                    </div>

                </section>
            </div>



            {/* ========================= FOOTER ========================= */}

            <footer className="border-t border-[var(--border)] bg-[var(--bg)] transition-all duration-500">

                <div className="mx-auto max-w-[1600px] px-4 py-14 md:px-6 xl:px-10">

                    {/* TOP LAYER */}

                    <div className="grid gap-12 xl:grid-cols-[1.15fr_2fr]">

                        {/* ===================================================== */}
                        {/* BRAND SIDE */}
                        {/* ===================================================== */}

                        <div className="max-w-xl">

                            <Link
                                href="/"
                                className="group inline-flex items-center gap-4"
                            >

                                {/* LOGO */}

                                <div className="gth-glass relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-[var(--gold)]">

                                    <Image
                                        src="/images/gth-logo.png"
                                        alt="GTH PRO"
                                        width={58}
                                        height={58}
                                        priority
                                        className="h-[82%] w-[82%] object-contain transition-transform duration-700 group-hover:scale-105"
                                    />

                                </div>

                                {/* TEXT */}

                                <div>

                                    <h3 className="text-xl md:text-2xl font-black tracking-[0.22em] text-[var(--text)]">
                                        GTH <span className="gold-text">PRO</span>
                                    </h3>

                                    <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[var(--text-soft)]">
                                        AI Powered Luxury Ecosystem
                                    </p>

                                </div>

                            </Link>

                            {/* DESCRIPTION */}

                            <p className="mt-7 max-w-md text-sm leading-relaxed text-[var(--text-soft)]">
                                Premium global ecosystem for luxury travel, verified stays,
                                real estate intelligence, elite partnerships and AI-powered
                                experiences built for the next generation.
                            </p>

                            {/* LIVE STATUS */}

                            <div className="mt-8 flex flex-wrap items-center gap-3">

                                <div className="gth-glass inline-flex items-center gap-3 rounded-full px-4 py-2">

                                    <div className="h-2 w-2 rounded-full bg-[var(--gold)] animate-pulse" />

                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">
                                        Global Network Active
                                    </span>

                                </div>

                                <div className="gth-glass inline-flex items-center rounded-full px-4 py-2">

                                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">
                                        Verified Luxury Access
                                    </span>

                                </div>

                            </div>

                            {/* ORIGINAL BRAND LOGOS */}

                            <div className="mt-8 flex flex-wrap items-center gap-3">

                                {[
                                    {
                                        name: "Booking",
                                        href: "https://booking.com",
                                        svg: (
                                            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#003580]">
                                                <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-13.5 3.5c0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5-.672-1.5-1.5-1.5-1.5.672-1.5 1.5zm.25-6.25c0 .69.56 1.25 1.25 1.25s1.25-.56 1.25-1.25S12.69 8 12 8s-1.25.56-1.25 1.25zM4 12c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8-8 3.582-8 8z" />
                                            </svg>
                                        )
                                    },
                                    {
                                        name: "Airbnb",
                                        href: "https://airbnb.com",
                                        svg: (
                                            <svg viewBox="0 0 32 32" className="w-7 h-7 fill-[#FF5A5F]">
                                                <path d="M16 1c-2.008 0-3.69 1.443-4.254 3.398C10.156 9.453 6.063 17.5 4.344 20.895A5.98 5.98 0 0 0 3 24c0 3.309 2.691 6 6 6c1.691 0 3.23-.703 4.344-1.832c.563-.574 1.254-1.637 1.832-2.586c.398-.656.777-1.309.824-1.34c.047.031.426.684.824 1.34c.578.949 1.27 2.012 1.832 2.586c1.113 1.129 2.652 1.832 4.344 1.832c3.309 0 6-2.691 6-6c0-1.125-.313-2.195-1.344-3.105c-1.719-3.395-5.813-11.441-7.402-16.496A4.31 4.31 0 0 0 16 1zm0 3c.715 0 1.332.484 1.5 1.156c1.555 4.965 5.598 12.895 7.281 16.219c.602.531.719.98.719 1.625c0 1.656-1.344 3-3 3c-1.074 0-2.039-.574-2.594-1.469c-.645-1.055-1.371-2.266-1.906-3.156c-.848-1.422-2-1.422-2.848 0c-.535.891-1.262 2.102-1.906 3.156c-.555.895-1.52 1.469-2.594 1.469c-1.656 0-3-1.344-3-3c0-.645.117-1.094.719-1.625c1.684-3.324 5.727-11.254 7.281-16.219A1.51 1.51 0 0 0 16 4zm0 10c-1.656 0-3 1.344-3 3s1.344 3 3 3s3-1.344 3-3s-1.344-3-3-3zm0 2c.555 0 1 .445 1 1s-.445 1-1 1s-1-.445-1-1s.445-1 1-1z" />
                                            </svg>
                                        )
                                    },
                                    {
                                        name: "Agoda",
                                        href: "https://agoda.com",
                                        svg: (
                                            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#0092A9]">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 12 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                            </svg>
                                        )
                                    },
                                    {
                                        name: "Emirates",
                                        href: "https://emirates.com",
                                        svg: (
                                            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#D71921]">
                                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S17.373 0 12 0zm1 17h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                            </svg>
                                        )
                                    },
                                    {
                                        name: "Marriott",
                                        href: "https://marriott.com",
                                        svg: (
                                            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#b00020]">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 12 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                                            </svg>
                                        )
                                    },
                                ].map((brand, idx) => (

                                    <Link
                                        key={idx}
                                        href={brand.href}
                                        target="_blank"
                                        rel="nofollow sponsored"
                                        className="group"
                                    >
                                        {/* Pure White Background wrapper so icons look high-contrast and sharp */}
                                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-white transition-transform duration-300 hover:scale-110 hover:border-[var(--gold)] shadow-sm">
                                            {brand.svg} {/* ✅ Absolute Fix: No external image files needed! */}
                                        </div>
                                    </Link>
                                ))}

                            </div>

                        </div>

                        {/* ===================================================== */}
                        {/* LINKS SIDE (Perfect 4-Column Grid) */}
                        {/* ===================================================== */}

                        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 xl:gap-14 w-full">

                            {/* 1. ECOSYSTEM */}
                            <div>
                                <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold)]">
                                    Ecosystem
                                </h4>
                                <div className="flex flex-col gap-4">
                                    <Link href="/destinations" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Destinations
                                    </Link>
                                    <Link href="/hotels" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Hotels
                                    </Link>
                                    <Link href="/tours" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Tours
                                    </Link>
                                    <Link href="/flights" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Flights
                                    </Link>
                                </div>
                            </div>

                            {/* 2. BUSINESS */}
                            <div>
                                <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold)]">
                                    Business
                                </h4>
                                <div className="flex flex-col gap-4">
                                    <Link href="/real-estate" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Real Estate
                                    </Link>
                                    <Link href="/tender" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Tenders
                                    </Link>
                                    <Link href="/studios" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Studios
                                    </Link>
                                    <Link href="/partners" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Partnerships
                                    </Link>
                                </div>
                            </div>

                            {/* 3. COMPANY */}
                            <div>
                                <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold)]">
                                    Company
                                </h4>
                                <div className="flex flex-col gap-4">
                                    <Link href="/about" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        About
                                    </Link>
                                    <Link href="/contact" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Contact
                                    </Link>
                                    <Link href="/blog" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Editorial
                                    </Link>
                                    <Link href="/careers" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Careers
                                    </Link>
                                </div>
                            </div>

                            {/* 4. LEGAL (Restored & Upgraded) */}
                            <div>
                                <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold)]">
                                    Legal
                                </h4>
                                <div className="flex flex-col gap-4">
                                    <Link href="/privacy-policy" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Privacy Policy
                                    </Link>
                                    <Link href="/terms-and-conditions" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Terms of Service
                                    </Link>
                                    <Link href="/cookies" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Cookie Policy
                                    </Link>
                                    <Link href="/security" className="text-sm text-[var(--text-soft)] transition-all duration-300 hover:translate-x-1 hover:text-[var(--text)]">
                                        Security & Trust
                                    </Link>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* ===================================================== */}
                    {/* BOTTOM */}
                    {/* ===================================================== */}

                    <div className="mt-14 flex flex-col gap-5 border-t border-[var(--border)] pt-7 md:flex-row md:items-center md:justify-between">

                        <p className="text-xs tracking-[0.08em] text-[var(--text-soft)]">
                            © 2026 GTH PRO — Global Luxury Ecosystem. All rights reserved.
                        </p>

                        <div className="flex flex-wrap items-center gap-3">

                            <div className="gth-glass rounded-full px-4 py-2">

                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">
                                    AI Verified Platform
                                </span>

                            </div>

                            <div className="gth-glass rounded-full px-4 py-2">

                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">
                                    Global Premium Access
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </footer>
        </div>
    );
}