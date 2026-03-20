// @ts-nocheck
"use client";
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import HotelWidget from "@/components/HotelWidget";
import HotelResults from "./results/HotelResults";

export const dynamic = "force-dynamic"

function HotelsContent() {
    const searchParams = useSearchParams();
    // URL se searched city nikalna (e.g. ?city=Dubai)
    const cityFromUrl = searchParams.get('city') || "";
    const city = searchParams.get('city') || "Global";
    return (
        <div className="bg-[#050505] min-h-screen text-white font-sans">

            {/* --- ULTRA PRO HEADER SECTION --- */}
            <div className="relative pt-10 pb-16 px-6">
                <div className="max-w-7xl mx-auto">

                    {/* 1. Breadcrumb (Chota sa rasta) */}
                    <div className="flex items-center gap-2 mb-6 opacity-40">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Home</span>
                        <span className="text-sky-500">/</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500">Hotels</span>
                    </div>

                    {/* 2. Dynamic Title */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                                Find Your <br />
                                <span className="text-sky-500 italic">Dream Escape</span>
                            </h1>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] pl-1">
                                Results for: <span className="text-white">{city || "Global Destinations"}</span>
                            </p>
                        </div>

                        {/* 3. Minimalist Search Input (Jo aapne manga tha) */}
                        <div className="relative group w-full md:w-96">
                            <input
                                type="text"
                                placeholder="WHERETO NEXT?"
                                className="w-full bg-white/5 border-b-2 border-white/10 p-4 text-[10px] font-black uppercase tracking-[0.4em] text-white focus:outline-none focus:border-sky-500 transition-all placeholder:text-gray-700"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-500 font-black text-xs hover:scale-110 transition-transform">
                                GO
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DIVIDER LINE --- */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

            {/* 1. Header Section - Dynamic City Name */}
            <div className="pt-20 pb-12 px-6 text-center">
                <div className="inline-block border-b border-yellow-500/30 pb-1 mb-4">
                    <span className="text-yellow-500 text-[10px] font-black tracking-[0.4em] uppercase">
                        GTH PRO LUXURY SEARCH
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                    {cityFromUrl ? (
                        <>Premium Stays In <span className="text-yellow-500">{cityFromUrl}</span></>
                    ) : (
                        <>Find Your <span className="text-yellow-500">Elite</span> Stay</>
                    )}
                </h1>
                <p className="mt-4 text-gray-500 text-xs uppercase tracking-widest font-bold">
                    Showing real-time curated results from our global partners
                </p>
            </div>

            <main className="px-4 md:px-12 pb-20 max-w-7xl mx-auto">

                {/* 2. Real Results Section */}
                <div className="animate-fade-in space-y-20">
                    {cityFromUrl ? (
                        <div className="min-h-[400px]">
                            <HotelResults city={cityFromUrl} />
                        </div>
                    ) : (
                        <div className="text-center py-20 border border-white/5 rounded-[3rem] bg-white/[0.02]">
                            <p className="text-gray-600 font-bold uppercase tracking-[0.3em] text-sm">
                                No Destination Selected. <br />
                                <span className="text-xs opacity-50">Please use the search bar on home page.</span>
                            </p>
                        </div>
                    )}

                    {/* Widget hamesha niche rahega help ke liye */}
                    <div className="pt-10">
                        <div className="flex items-center gap-4 mb-10 opacity-20">
                            <div className="h-[1px] bg-white flex-grow"></div>
                            <span className="text-[10px] font-black tracking-widest uppercase">Modify Search</span>
                            <div className="h-[1px] bg-white flex-grow"></div>
                        </div>
                        <HotelWidget />
                    </div>
                </div>
            </main>

            {/* Simple Luxury Footer */}
            <footer className="py-10 border-t border-white/5 text-center">
                <p className="text-[9px] text-gray-600 uppercase tracking-[0.5em] font-bold">
                    © GTH Luxury Travel Group • All Rights Reserved
                </p>
            </footer>
        </div>
    )
}

// Next.js Search Params Wrapper (Build error se bachne ke liye)
export default function HotelsPage() {
    return (
        <Suspense fallback={
            <div className="bg-black min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-yellow-500 font-black tracking-widest uppercase text-xs">
                    Initializing Luxury Engine...
                </div>
            </div>
        }>
            <HotelsContent />
        </Suspense>
    );
}