"use client"

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from "next/image"

// 1. Aapka Master Image Logic
import { imageMap } from "@/lib/autoDestinations"
import { hotels } from "@/data/hotels"
// 2. Components
import HeroSearch from "@/components/sections/HeroSearch"
import DestinationScroll from "@/components/sections/DestinationScroll"
import HotelScroll from "@/components/sections/HotelScroll"
import ActivitiesGrid from "@/components/sections/ActivitiesGrid"
import TransfersSection from "@/components/sections/TransfersSection"
import GuidesScroll from "@/components/sections/GuidesScroll"
import AffiliateDeals from "@/components/sections/AffiliateDeals"

// --- CRASH PROOF CLEANING FUNCTION ---
const getCleanCity = (raw: string) => {
    if (!raw) return "dubai";
    return raw
        .toLowerCase()
        .replace(/hotels in|stay in|best hotels in|resorts in|luxury hotels in|travel to/gi, "")
        .trim()
        .split(" ")[0]; // Sirf main city name nikalega
}

function SearchResultsContent() {
    const searchParams = useSearchParams()
    const rawQuery = searchParams.get('q') || "dubai"

    // 1. Sabse pehle query clean karo taaki crash na ho
    const query = getCleanCity(rawQuery);

    // 2. Safe Filter (Crash Prevention)
    const cityHotels = (hotels || []).filter((hotel) =>
        hotel.location?.toLowerCase().includes(query.toLowerCase())
    )

    // Blog Style Image Matching
    const citySlug = query.toLowerCase().trim().replace(/\s+/g, '-');
    const finalHeroImage = `/images/cities/${query.toLowerCase()}.jpg`

    return (
        <main className="min-h-screen bg-[#050505] text-white">

            {/* HERO SECTION: Height Adjusted to 55vh to remove black gap */}
            <div className="relative h-[55vh] w-full flex items-end p-10 mb-16">

                <Image
                    src={finalHeroImage}
                    alt={query}
                    fill
                    className="object-cover opacity-60"
                    priority
                    onError={(e: any) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1501785888041-af3ef285b470"
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

                <div className="relative z-10 border-l-4 border-yellow-500 pl-6 mb-10">
                    <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.5em] mb-2">
                        GTH Elite Discovery
                    </p>

                    <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                        {query.charAt(0).toUpperCase() + query.slice(1)}
                    </h1>
                </div>

                {/* HERO SEARCH FLOAT: Positioned properly */}
                <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2 w-full max-w-5xl px-6 z-20">
                    <div className="absolute inset-0 bg-skyBlue/10 blur-[80px] -z-10 rounded-full"></div>
                    <HeroSearch city={query} />
                </div>

            </div>

            {/* NAVIGATION MENU (Optional Sticky) */}
            <div className="sticky top-0 z-[100] py-2 bg-black/40 backdrop-blur-md"></div>

            {/* SECTIONS: Safe execution with cleaned query */}
            <div className="space-y-10 pb-20 mt-10">
                <HotelScroll city={query} />
                <ActivitiesGrid city={query} />
                <DestinationScroll city={query} />
                <TransfersSection city={query} />
                <GuidesScroll city={query} />
                <AffiliateDeals city={query} />
            </div>
        </main>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-[#050505] flex flex-col items-center justify-center">
                <div className="text-yellow-500 font-black text-4xl animate-pulse uppercase italic tracking-tighter">
                    Syncing Ecosystem...
                </div>
                <div className="w-48 h-[2px] bg-zinc-800 mt-4 overflow-hidden">
                    <div className="w-full h-full bg-yellow-500 animate-[loading_2s_infinite]" />
                </div>
            </div>
        }>
            <SearchResultsContent />
        </Suspense>
    )
}