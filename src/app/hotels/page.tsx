import { generateHotels } from "@/lib/autoHotels"
import Link from "next/link"
import HotelSearch from "@/components/HotelSearch"
export const dynamic = "force-dynamic"
export default function HotelsPage() {
    // 1. Sabhi cities ke naam (Logic Same)
    const mainCities = ["goa", "paris", "dubai", "jaipur"];

    // 2. Har city se 20-20 hotels mangwao (Logic Same)
    const allHotels = mainCities.flatMap(city => generateHotels(city).slice(0, 20));

    return (
        <div className="bg-[#050505] min-h-screen text-white">
            {/* Header Section Polish */}
            <div className="pt-20 pb-10 px-10 text-center">
                <span className="text-[#d4af37] text-[10px] font-black tracking-[0.5em] uppercase pb-2 inline-block border-b border-[#d4af37]/20">
                    Global Collection
                </span>
                <h1 className="text-4xl md:text-5xl font-black gold-text mt-6 tracking-tighter uppercase">
                    Premium Global Hotels
                </h1>
            </div>

            <main className="px-6 lg:px-16 pb-20">
                {/* Search Bar Polish */}
                <div className="max-w-4xl mx-auto mb-16">
                    <HotelSearch />
                </div>

                {/* Grid Polish */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {allHotels.map((hotel) => (
                        <Link
                            key={hotel.slug}
                            href={`/hotels/${hotel.slug}`}
                            className="group relative bg-[#0a0a0a] rounded-[24px] overflow-hidden border border-white/5 hover:border-[#d4af37]/30 transition-all duration-500 shadow-2xl"
                        >
                            {/* Image Container with Hover Effect */}
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={hotel.image}
                                    alt={hotel.name}
                                    className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />

                                {/* Top Badge */}
                                <div className="absolute top-4 right-4 backdrop-blur-md bg-black/40 px-3 py-1 rounded-full border border-white/10">
                                    <span className="text-[#d4af37] text-[9px] font-bold uppercase tracking-widest">Luxury</span>
                                </div>
                            </div>

                            {/* Content Polish */}
                            <div className="p-6 space-y-3">
                                <h2 className="text-xl font-bold tracking-tight text-white group-hover:text-[#d4af37] transition-colors duration-300">
                                    {hotel.name}
                                </h2>

                                <div className="flex items-center justify-between">
                                    <p className="text-gray-500 text-xs font-light uppercase tracking-widest">
                                        Executive Suite
                                    </p>
                                    <div className="flex text-[#d4af37] text-[8px] gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i}>★</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-gray-500 uppercase font-bold">Starting from</span>
                                        <span className="text-[#d4af37] text-lg font-black tracking-tighter">
                                            ₹{hotel.id.includes('goa') ? '8,500' : '25,000'}
                                        </span>
                                    </div>
                                    <div className="h-8 w-8 rounded-full border border-[#d4af37]/30 flex items-center justify-center group-hover:bg-[#d4af37] transition-all">
                                        <svg className="w-4 h-4 text-[#d4af37] group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    )
}