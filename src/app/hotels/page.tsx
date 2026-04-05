// @ts-nocheck
"use client";
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import HotelWidget from "@/components/HotelWidget";
import HotelResults from "./results/HotelResults";
import { i } from 'framer-motion/client';
import { hotels } from '@/data/hotels';
import { Search, MapPin, Calendar, User, Star, Filter, Hotel, Plane, Package, Car, Zap, ChevronDown } from 'lucide-react';


export const dynamic = "force-dynamic"

// 🌍 GLOBAL DESTINATIONS (100+ Cities)
const globalCities = [
    "Mumbai", "Delhi", "Bangalore", "Goa", "Kolkata", "Chennai", "Hyderabad", "Jaipur", "Udaipur", "Agra",
    "Dubai", "London", "Paris", "New York", "Singapore", "Tokyo", "Bali", "Maldives", "Sydney", "Rome",
    "Bangkok", "Barcelona", "Amsterdam", "Berlin", "Venice", "Cape Town", "Istanbul", "Prague", "Seoul", "Hong Kong",
    "Zurich", "Vienna", "Milan", "Toronto", "Los Angeles", "Chicago", "San Francisco", "Las Vegas", "Miami", "Boston",
    "Manali", "Shimla", "Rishikesh", "Varanasi", "Amritsar", "Kochi", "Munnar", "Pondicherry", "Mysore", "Pune"
    // ... aise 100 cities ki list
];

const prefixes = ["Grand", "Royal", "Heritage", "Luxury", "Elite", "Skyline", "Oceanic", "Majestic", "Regency", "Palace", "Radisson", "Mariott", "Hyatt", "Taj", "Oberoi"];
const types = ["Resort", "Suites", "Inn", "Plaza", "Villas", "Boutique", "Manor", "Heights", "Club", "Grand", "Palace"];

// 🚀 3,000 UNIQUE HOTELS GENERATOR
const generate3000Hotels = () => {
    const data = [];
    for (let i = 1; i <= 3000; i++) {
        // 1. Har 30 hotel ke baad shehar badlega (Total 100 cities coverage)
        const city = globalCities[i % globalCities.length];

        // 2. UNIQUE NAME: Prefix + City + Type + Unique ID
        // Example: "Royal Mumbai Resort 145"
        const name = `${prefixes[i % prefixes.length]} ${city} ${types[i % types.length]} ${i}`;
        const pexelsIds = [6071476, 5245473, 33726143, 33803739, 29396983, 10256408, 34062192, 16901228, 16967890, 32895277, 10047588, 12827798, 29066859, 12335278, 18678368, 7380282,]; // Kuch luxury IDs
        const photoId = pexelsIds[i % pexelsIds.length];
        data.push({
            id: i,
            name: name,
            city: city,
            // 🖼️ PREMIUM IMAGES: Seed ID ke saath (No Repetition)
            img: `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&w=1600`,
            price: Math.floor(Math.random() * (75000 - 12000) + 12000), // Premium pricing ₹12k to ₹75k
            rating: (Math.random() * (10 - 8.5) + 8.5).toFixed(1), // Sab 8.5+ ratings (Luxury branding)
            reviews: Math.floor(Math.random() * 5000 + 100),
            amenities: ["Free WiFi", "Infinity Pool", "Spa", "Airport Transfer", "Fine Dining"]
        });
    }
    return data;
};

function HotelsContent() {
    const searchParams = useSearchParams();
    const initialCity = searchParams.get('city') || "";
    const [searchTerm, setSearchTerm] = useState(initialCity);
    const [allHotels, setAllHotels] = useState<any[]>([]); // Original data backup ke liye
    const [loading, setLoading] = useState(false);
    const [hotels, setHotels] = useState<any[]>([]);

    const [selectedStars, setSelectedStars] = useState<number[]>([]);

    const [isFetching, setIsFetching] = useState(true);
    // LIVE STATE: Search aur Filters ko control karne ke liye
    const [destination, setDestination] = useState("");

    useEffect(() => {
        const data = generate3000Hotels();
        setAllHotels(data);

        if (initialCity) {
            const filtered = data.filter(h =>
                h.city.toLowerCase().includes(initialCity.toLowerCase())
            );
            setFilteredHotels(filtered.slice(0, 20));
            setDestination(initialCity);
        } else {
            setFilteredHotels(data.slice(0, 20));
        }

        setIsFetching(false);
    }, []);



    // 3000 Hotels Memory mein load (Performance Optimized)
    const [filteredHotels, setFilteredHotels] = useState<any[]>([]);


    const applyFilters = (search = searchTerm, stars = selectedStars) => {
        let results = allHotels;

        // 🔍 search filter
        if (search) {
            results = results.filter(h =>
                h.city.toLowerCase().includes(search.toLowerCase()) ||
                h.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        // ⭐ star filter
        if (stars.length > 0) {
            results = results.filter(h =>
                stars.some(star => Math.floor(h.rating) === star)
            );
        }

        setFilteredHotels(results.slice(0, 30));
    };
    // 🚀 LIVE SEARCH LOGIC
    const handleSearch = () => {
        setLoading(true);

        setTimeout(() => {
            applyFilters(searchTerm, selectedStars);
            setDestination(searchTerm);
            setLoading(false);
        }, 300);
    };

    return (
        <div className="relative min-h-screen bg-rgba(2, 88, 63, 0.03) text-white font-sans overflow-x-hidden">
            {/* ✈️ GTH SERVICE NAVIGATION (Top Bar) */}
            <div className="flex items-center gap-2 md:gap-8 overflow-x-auto no-scrollbar mb-10 pb-2 border-b border-white/5">

                {/* Active Item: Stays/Hotels */}
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-xs font-bold whitespace-nowrap transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <div className="p-1.5 bg-skyBlue/20 rounded-full">
                        <Hotel size={16} className="text-skyBlue" />
                    </div>
                    Stays
                </button>

                {/* Flights */}
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white text-xs font-bold whitespace-nowrap transition-all group">
                    <Plane size={18} className="group-hover:text-skyBlue transition-colors" />
                    Flights
                </button>

                {/* Flight + Hotel (Package) */}
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white text-xs font-bold whitespace-nowrap transition-all group">
                    <Package size={18} className="group-hover:text-skyBlue transition-colors" />
                    Flight + Hotel
                </button>

                {/* Car Rentals */}
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white text-xs font-bold whitespace-nowrap transition-all group">
                    <Car size={18} className="group-hover:text-skyBlue transition-colors" />
                    Car rentals
                </button>

                {/* Attractions */}
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white text-xs font-bold whitespace-nowrap transition-all group">
                    <MapPin size={18} className="group-hover:text-skyBlue transition-colors" />
                    Attractions
                </button>

                {/* Airport Taxis */}
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white text-xs font-bold whitespace-nowrap transition-all group">
                    <Zap size={18} className="group-hover:text-skyBlue transition-colors" />
                    Airport taxis
                </button>
            </div>

            {/* 1. TOP SECTION: HEADLINE & LIVE SEARCH */}
            <div className="relative z-20 pt-28 pb-10 bg-gradient-to-b from-blue-900/20 to-transparent">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-8 font-cinzel tracking-tight text-white">
                        Find your <span className="text-skyBlue">next stay</span>
                    </h1>

                    {/* THE LIVE SEARCH BAR (Booking.com Style - Yellow Border Logic) */}
                    <div className="bg-[#ffb700] p-1 rounded-xl shadow-2xl flex flex-col md:flex-row gap-1 items-stretch">
                        <div className="flex-[1.5] bg-white flex items-center gap-3 px-4 py-4 rounded-l-lg text-black">
                            <MapPin size={22} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Where are you going?"
                                className="w-full outline-none font-bold placeholder:font-normal"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch();
                                }}
                            />
                        </div>
                        <div className="flex-1 bg-white flex items-center gap-3 px-4 py-4 text-black border-x border-gray-100">
                            <Calendar size={20} className="text-gray-400" />
                            <span className="text-sm font-bold whitespace-nowrap">Check-in — Check-out</span>
                        </div>
                        <div className="flex-1 bg-white flex items-center gap-3 px-4 py-4 text-black">
                            <User size={20} className="text-gray-400" />
                            <span className="text-sm font-bold whitespace-nowrap">2 adults · 1 room</span>
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-[#003580] hover:bg-blue-900 text-white px-12 py-4 rounded-r-lg font-black uppercase tracking-widest transition-all">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MASTER LAYOUT GRID */}
            <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-8">

                {/* 📱 MOBILE FILTER BAR (Only on Mobile) */}
                <div className="lg:hidden flex items-center gap-3 overflow-x-auto no-scrollbar py-4 border-y border-white/10 mb-2">
                    <button className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 text-[10px] font-bold uppercase shrink-0">
                        <Filter size={14} className="text-skyBlue" /> Filter
                    </button>
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((s: number) => (
                        <label key={s} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-white/20 bg-transparent checked:bg-skyBlue transition-all"
                                onChange={(e) => {
                                    let updated = [...selectedStars];

                                    if (e.target.checked) {
                                        updated.push(s);
                                    } else {
                                        updated = updated.filter(star => star !== s);
                                    }

                                    setSelectedStars(updated);
                                    applyFilters(searchTerm, updated);

                                    const results = allHotels.filter(h => {
                                        const matchSearch =
                                            h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            h.name.toLowerCase().includes(searchTerm.toLowerCase());

                                        const matchStar =
                                            updated.length === 0 ||
                                            updated.some(star => Math.floor(h.rating) === star);

                                        return matchSearch && matchStar;
                                    });

                                    setFilteredHotels(results.slice(0, 30));
                                }}
                            />
                            <span className="text-xs text-gray-400 group-hover:text-white uppercase font-bold">{s} Stars</span>
                        </label>
                    ))}
                </div>

                {/* 💻 DESKTOP SIDEBAR (Only on Desktop) */}
                <aside className="hidden lg:block lg:w-[280px] shrink-0 h-fit sticky top-28">
                    <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-2xl">
                        <h3 className="text-skyBlue font-black text-[10px] uppercase tracking-widest mb-8 border-b border-white/10 pb-4">Filters</h3>
                        <div className="space-y-6">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Star Rating</p>
                            {Array.from({ length: 5 }, (_, i) => i + 1).map((s: number) => (
                                <label key={s} className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-transparent checked:bg-skyBlue transition-all" />
                                    <span className="text-xs text-gray-400 group-hover:text-white uppercase font-bold">{s} Stars</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* RIGHT: LIVE HOTEL LIST */}
                <main className="flex-1 space-y-6">
                    {loading && (
                        <div className="text-center py-10 text-gray-400 font-bold">
                            Searching premium stays...
                        </div>
                    )}
                    <div className="flex justify-between items-end mb-4">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                            {destination || "Global"} : {filteredHotels.length} properties found
                        </p>
                    </div>

                    {filteredHotels.map((hotel) => (
                        <div key={hotel.id} className="group flex flex-col md:flex-row bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-skyBlue/40 transition-all duration-300">
                            {/* Hotel Image */}
                            <div className="md:w-72 h-56 md:h-auto overflow-hidden">
                                <img src={hotel.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={hotel.name} />
                            </div>

                            {/* Hotel Details */}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-xl font-bold text-skyBlue group-hover:text-white transition-colors uppercase tracking-tight">{hotel.name}</h2>
                                        <div className="flex flex-col items-end">
                                            <span className="bg-[#003580] text-white px-2 py-1 rounded text-sm font-bold">{hotel.rating}</span>
                                            <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Excellent</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 underline underline-offset-4 decoration-skyBlue/30 cursor-pointer">
                                        <MapPin size={12} /> {hotel.city} • Show on map
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-between items-end pt-4 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-tighter">GTH Direct Deal</span>
                                        <span className="text-2xl font-black text-white">₹{hotel.price.toLocaleString()}</span>
                                        <span className="text-[10px] text-gray-500">+ Taxes & charges</span>
                                    </div>
                                    <button className="bg-[#003580] hover:bg-skyBlue hover:text-black text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95">
                                        See availability
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!loading && filteredHotels.length === 0 && (
                        <div className="text-center py-20 text-gray-500 font-bold">
                            No hotels found for "{searchTerm}"
                        </div>
                    )}
                </main>

            </div>
        </div>
    );
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