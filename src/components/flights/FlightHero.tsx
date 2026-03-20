"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plane, Calendar, Users, MapPin, Search, ArrowRightLeft, Bed, Car, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getIata, cityToIata } from "@/lib/iata";

export default function FlightHero() {
    const [tab, setTab] = useState("flights");
    const [inputValue, setInputValue] = useState("");
    const [origin, setOrigin] = useState("Kolkata (CCU)");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [tripType, setTripType] = useState("return"); // Default return rahega
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // --- 🔍 AUTO-SUGGESTION LOGIC (Your Logic) ---
    useEffect(() => {
        if (inputValue.length > 1 && cityToIata) {
            const filtered = Object.keys(cityToIata).filter((city) =>
                city.toLowerCase().includes(inputValue.toLowerCase())
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [inputValue]);


    const handleSearch = (searchQuery?: string) => {
        const query = searchQuery || inputValue;
        if (!query && tab !== "hotels") return;

        if (tab === "hotels") {
            window.location.href = `/hotels?city=${encodeURIComponent(inputValue)}`;
        }


        else if (tab === "flights") {

            const marker = "417668";

            const destCode = getIata(query);

            const originCode = getIata(origin) || "DEL";


            let formattedDate = "";
            if (checkIn) {
                if (!destCode) return alert("Invalid destination");
                const d = new Date(checkIn);
                const yyyy = d.getFullYear();
                const mm = ("0" + (d.getMonth() + 1)).slice(-2);
                const dd = ("0" + d.getDate()).slice(-2);

                formattedDate = `${yyyy}-${mm}-${dd}`;

            } else {

                return alert("Select date");

            }




            const aviasalesUrl = `https://www.aviasales.com/search?origin=${originCode}&destination=${destCode}&depart_date=${formattedDate}&with_request=true&marker=${marker}`;



            console.log("Opening Link:", aviasalesUrl);

            window.open(aviasalesUrl, "_blank");
        }
        else if (tab === "tours") {
            const toursUrl = `https://klook.tpo.lv/IKb6eSUe?u=${encodeURIComponent(`https://www.klook.com/en-IN/search/result/?query=${query}`)}`;
            window.open(toursUrl, "_blank");
        }
        else {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }

        inputRef.current?.blur();
        setIsOpen(false);
    };

    return (
        <section className="relative bg-[#050505] pt-4 pb-12 px-4 flex flex-col items-center">
            <div className="max-w-6xl w-full">

                {/* --- ✈️ TABS (Activated) --- */}
                <div className="flex items-center gap-2 mb-8">
                    {[
                        { id: 'flights', label: 'Flights', icon: Plane },
                        { id: 'hotels', label: 'Hotels', icon: Bed },
                        { id: 'tours', label: 'Tours', icon: Car }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${tab === t.id
                                ? "bg-[#f59e0b] text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] border-[#f59e0b]"
                                : "bg-white/5 text-gray-500 hover:text-white border-white/5"
                                }`}
                        >
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* --- TITLE --- */}
                <div className="mb-10">
                    <h1 className="text-2xl md:text-3xl font-black text-white text-center tracking-tighter uppercase italic leading-tight">
                        Millions of cheap flights. <br />
                        <span className="text-[#f59e0b]">One simple search.</span>
                    </h1>
                </div>

                {/* --- TRIP TYPE SELECTOR (Fixed) --- */}
                <div className="flex gap-6 mb-3 ml-2">
                    {/* RETURN BUTTON */}
                    <label
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setTripType("return")}
                    >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${tripType === "return" ? "border-[#f59e0b]" : "border-white/20"}`}>
                            {tripType === "return" && <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full"></div>}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${tripType === "return" ? "text-white" : "text-gray-500 hover:text-white"}`}>
                            Return
                        </span>
                    </label>

                    {/* ONE WAY BUTTON */}
                    <label
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setTripType("oneway")}
                    >
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${tripType === "oneway" ? "border-[#f59e0b]" : "border-white/20"}`}>
                            {tripType === "oneway" && <div className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full"></div>}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${tripType === "oneway" ? "text-white" : "text-gray-500 hover:text-white"}`}>
                            One way
                        </span>
                    </label>
                </div>

                {/* --- MAIN SEARCH BAR (Activated) --- */}
                <div className="flex flex-col md:flex-row items-stretch bg-[#111] border border-white/10 rounded-xl overflow-visible shadow-2xl relative">

                    {/* FROM */}
                    <div className="flex-[1.2] border-b md:border-b-0 md:border-r border-white/10 p-4 hover:bg-white/5 transition-all relative group">
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">From</label>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-[#f59e0b] opacity-70" />
                            <input
                                type="text"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white outline-none w-full"
                            />
                        </div>
                        <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-20 hidden md:block">
                            <button className="bg-[#111] border border-white/10 p-2 rounded-full text-gray-400 hover:text-[#f59e0b] hover:border-[#f59e0b] transition-all shadow-xl">
                                <ArrowRightLeft className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* TO (Input + Suggestions Logic) */}
                    <div className="flex-[1.2] border-b md:border-b-0 md:border-r border-white/10 p-4 hover:bg-white/5 transition-all relative">
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">To</label>
                        <div className="flex items-center gap-3">
                            <Plane className="w-4 h-4 text-gray-600 rotate-45" />
                            <input
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="Country, city or airport"
                                className="bg-transparent text-sm font-bold text-white outline-none w-full placeholder:text-gray-800"
                            />
                        </div>

                        {/* --- 💡 Suggestions Dropdown --- */}
                        {isOpen && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-[#111] border border-[#f59e0b]/30 rounded-xl overflow-hidden shadow-2xl z-50">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setInputValue(s); setIsOpen(false); handleSearch(s); }}
                                        className="block w-full text-left px-5 py-3 text-xs font-bold text-gray-300 hover:bg-[#f59e0b] hover:text-black transition-all border-b border-white/5 last:border-0 uppercase italic"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DEPART DATE */}
                    <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 p-4 hover:bg-white/5 transition-all cursor-pointer">
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Depart</label>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <input
                                type="date"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] w-full cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* RETURN DATE */}
                    <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 p-4 hover:bg-white/5 transition-all cursor-pointer">
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Return</label>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <input
                                type="date"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark] w-full cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* TRAVELLERS */}
                    <div className="flex-[1.5] p-4 hover:bg-white/5 transition-all cursor-pointer border-b md:border-b-0 md:border-r border-white/10">
                        <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Travellers & Cabin Class</label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-bold text-white whitespace-nowrap">1 Adult, Economy</span>
                            </div>
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                    </div>

                    {/* SEARCH BUTTON (Activated) */}
                    <button
                        type="button"
                        onClick={() => handleSearch()}
                        className="bg-[#f59e0b] hover:bg-white text-black px-12 py-5 font-black uppercase text-xs tracking-widest transition-all shrink-0 flex items-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                </div>

                {/* --- BOTTOM OPTIONS --- */}
                <div className="flex flex-wrap gap-8 mt-5 ml-2">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" className="accent-[#f59e0b] w-3.5 h-3.5 bg-transparent border-white/20" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-all">Add nearby airports</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" className="accent-[#f59e0b] w-3.5 h-3.5 bg-transparent border-white/20" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-all">Direct flights</span>
                    </label>
                </div>

            </div>
        </section>
    );
}