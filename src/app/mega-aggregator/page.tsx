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
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    const { data: destinations, error } = await supabase
        .from("destinations")
        .select("name, slug, image_url")
        .order("name")
        .limit(5)

    if (error) {
        console.log("SUPABASE DESTINATION ERROR:", error)
    }

    const allCities = [...featuredCities, ...(destinations || [])]

    const citiesToShow = Array.from(
        new Map(allCities.map(city => [city.slug, city])).values()
    )

    return (
        <div className="w-full">
            {/* Hero Section with video */}
            <section className="relative -mt-8 w-full h-[65vh] overflow-hidden group">
                {/* Background Video - Height reduced to 60vh */}
                <video
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay loop muted playsInline
                    src="/hero video.mp4"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-white p-4">

                    {/* Heading - Size reduced to 4xl/5xl */}
                    <h1 className="text-2xl md:text-2xl font-black mb-2 flex text-center uppercase tracking-tight">
                        Luxury <span className="text-skyBlue">Travel</span> Portal
                    </h1>

                    <p className="text-sm md:text-base text-center mb-8 font-medium opacity-80 tracking-wide">
                        Flights • Hotels • Tours • Insurance — All in one place.
                    </p>
                    <HeroSearch />








                    {/* Small Trust Markers */}
                    <div className="mt-8 flex gap-6 text-[9px] font-bold uppercase tracking-widest opacity-60">
                        <span>Best price guaranteed</span>
                        <span>5M+ Properties</span>
                        <span>No booking fees</span>
                    </div>
                </div>
            </section>


            {/* --- SIGNATURE EXPERIENCE: Digha Special --- */}
            <section className="py-24 bg-[#050505] border-y border-[#d4af37]/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16">

                        {/* 1. Left Side: Bus Video + Hotel Gallery (Visual Core) */}
                        <div className="w-full md:w-1/2 space-y-4">
                            <div className="relative group cursor-pointer rounded-2xl overflow-hidden border border-[#1a1a1a] aspect-video">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37] to-[#8a6d3b] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200"
                                    alt="Digha Video Experience"
                                    className="relative w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-16 w-16 bg-[#d4af37] rounded-full flex items-center justify-center shadow-[0_0_20px_#d4af37]">
                                        <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39', label: 'Royal Suite' },
                                    { img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', label: 'Ocean Pool' },
                                    { img: 'https://images.unsplash.com/photo-1544148103-0773bf10d330', label: 'Fine Dine' }
                                ].map((item, i) => (
                                    <div key={i} className="h-20 rounded-xl overflow-hidden border border-white/5 relative group shadow-2xl">
                                        <img src={`${item.img}?w=400`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={item.label} />
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-center py-1 uppercase font-bold text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Right Side: Balanced English Typography */}
                        <div className="w-full md:w-1/2 space-y-5">
                            <span className="text-[#d4af37] font-bold tracking-[0.5em] text-[8px] uppercase border-b border-[#d4af37]/30 pb-1">
                                Partner Spotlight
                            </span>

                            {/* Scaled Down Heading to match Left Side height */}
                            <h2 className="text-2xl md:text-4xl font-black gold-text leading-tight tracking-tighter uppercase">
                                DIGHA ELITE: <br />
                                <span className="font-light italic text-white/90">CINEMATIC LEGACY</span>
                            </h2>

                            <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed max-w-sm">
                                Step beyond traditional travel. Our local partners offer West Bengal’s first
                                <span className="text-white font-medium italic"> "Cinematic Expedition"</span>,
                                transforming your journey into a high-definition documentary film.
                            </p>

                            <div className="bg-[#111] p-4 rounded-xl border-l-2 border-[#d4af37] space-y-1 max-w-sm">
                                <p className="text-[#d4af37] text-[9px] font-black uppercase tracking-widest">Rare Advantage</p>
                                <p className="text-[11px] text-gray-400 font-light italic leading-snug">
                                    "Every guest receives a 4K Documentary of their journey and exclusive access to a private beachfront reserved for GTH members."
                                </p>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-3">
                                <Link
                                    href="/destinations/digha"
                                    className="gold-gradient text-black px-7 py-3 rounded-full font-black uppercase tracking-tighter hover:scale-105 transition-all text-[10px]"
                                >
                                    Explore More →
                                </Link>
                                <Link
                                    href="https://wa.me/9339952669"
                                    className="border border-white/10 text-white/50 px-7 py-3 rounded-full font-black uppercase tracking-tighter hover:bg-white/5 transition-all text-[10px]"
                                >
                                    Inquire Now
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

            {/* Mega Deals Section - HIGH CONVERSION DESIGN */}
            <section className="py-20 px-8 bg-white max-w-7xl mx-auto">
                <h2 className="text-4xl font-black text-center mb-16 uppercase tracking-tighter text-gray-900">
                    🔥 Exclusive Mega Deals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {partners.map((p, idx) => (
                        <div
                            key={idx}
                            className="group bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-skyBlue/20 transition-all duration-500"
                        >
                            {/* IMAGE BOX - PERFECT FIT */}
                            <div className="relative w-full h-56 overflow-hidden">
                                <Image
                                    src={p.image}
                                    alt={p.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    unoptimized
                                />
                                {/* TOP BADGE */}
                                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">
                                    LIMITED OFFER
                                </div>
                            </div>

                            {/* CONTENT BOX */}
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-black text-xl text-gray-800 leading-tight">
                                        {p.name} <br /> <span className="text-gray-400 text-sm font-medium italic underline decoration-skyBlue">Special</span>
                                    </h3>
                                    <div className="bg-sky-50 p-2 rounded-lg">
                                        <span className="text-sky-600 font-black text-xs uppercase tracking-tighter">
                                            {p.reward}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-gray-500 text-xs mb-6 line-clamp-2">
                                    {p.description}. Book today to claim your exclusive AI-verified travel rewards.
                                </p>
                                <Link href={p.link} target="_blank" rel="nofollow sponsored">
                                    <button className="mt-auto w-full bg-gray-900 group-hover:bg-sky-500 text-white font-black py-4 rounded-2xl transition-all duration-300 transform active:scale-95 shadow-lg flex items-center justify-center gap-2">
                                        CLAIM DEAL
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-10 px-8 mt-16">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>© 2026 GTH PRO. All rights reserved.</p>
                    <div className="flex gap-4">
                        {partners.map((p, idx) => (
                            <Image key={idx} src={p.image} alt={p.name} width={40} height={40} />
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}