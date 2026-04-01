"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Calendar, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getIata, cityToIata } from "@/lib/iata"



export default function SearchSection({ city }: { city?: string }) {
    const [tab, setTab] = useState("flights");
    const [inputValue, setInputValue] = useState("");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);


    const [suggestions, setSuggestions] = useState<string[]>([]);
    useEffect(() => {
        if (inputValue.length > 1) {
            const filtered = Object.keys(cityToIata).filter((city) =>
                city.toLowerCase().includes(inputValue.toLowerCase())
            )
            setSuggestions(filtered)
        } else {
            setSuggestions([])
        }
    }, [inputValue])


    const tabs = ["flights", "hotels", "tours"];

    const handleSearch = (searchQuery?: string) => {
        const query = searchQuery || inputValue;
        if (!query) return;

        if (tab === "hotels") {

            const marker = "417668";


            const klookUrl = `https://klook.tpo.lv/IKb6eSUe?u=${encodeURIComponent(`https://www.klook.com/en-IN/hotels/searchresult/?city_name=${query}`)}`;

            window.open(klookUrl, "_blank");
        }
        else if (tab === "flights") {
            const code = query ? getIata(query) : "DEL";

            router.push(
                `/flights?origin=DEL&destination=${code}&depart_date=${checkIn}`
            );
        }

        else if (tab === "tours") {
            // Tours ke liye Klook Activities link
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
        <div className="w-full flex justify-center relative z-30 px-4 mt-6 font-sans">
            <div className="w-full max-w-4xl">

                {/* TABS */}
                <div className="flex justify-center gap-6 mb-3">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`text-xs font-bold uppercase tracking-[0.25em] transition-all pb-1
                            ${tab === t
                                    ? "text-sky-400 border-b-2 border-sky-400"
                                    : "text-gray-400 hover:text-white"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* SEARCH CONTAINER (Glassmorphism Effect) */}
                {/* SEARCH CONTAINER - Luxury Mobile Fix */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-white/10 backdrop-blur-xl overflow-hidden border border-white/20 rounded-2xl md:rounded-full p-2 md:p-1 shadow-2xl mx-4 md:mx-0 -mt-10 md:-mt-2 relative z-50">

                    {/* DESTINATION INPUT */}
                    <div className="relative border-b md:border-b-0 md:border-r border-white/10">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 w-4 h-4 z-10" />
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setIsOpen(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSearch();
                                }
                            }}
                            placeholder={tab === "hotels" ? "Search Hotels in City..." : "Search Destination..."}
                            className="w-full pl-10 pr-4 py-4 bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-400"
                        />

                        {/* Suggestions Dropdown */}
                        {isOpen && suggestions.length > 0 && inputValue.length > 1 && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInputValue(s);
                                            setIsOpen(false);
                                            handleSearch(s);
                                        }}
                                        className="block w-full text-left px-4 py-3 text-sm text-white hover:bg-sky-500/20 transition border-b border-white/5 last:border-0"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CHECK-IN DATE */}
                    <div className="relative border-r border-white/5">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 w-4 h-4" />
                        <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 bg-transparent text-sm text-white focus:outline-none [color-scheme:dark] cursor-pointer"
                        />
                    </div>

                    {/* CHECK-OUT DATE */}
                    <div className="relative border-r border-white/5">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 w-4 h-4" />
                        <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="w-full pl-10 pr-4 py-4 bg-transparent text-sm text-white focus:outline-none [color-scheme:dark] cursor-pointer"
                        />
                    </div>

                    {/* SEARCH BUTTON */}
                    <button
                        type="button"
                        onClick={() => handleSearch()}

                        className="w-full h-[45px] md:w-[215px] md:h-full bg-gradient-to-r from-sky-500 to-cyan-400 text-black flex items-center justify-center gap-2 font-bold uppercase rounded-2xl md:rounded-r-full shadow-lg transition-all active:scale-95 mt-4 md:mt-0"
                    >
                        <Search className="w-4 h-4" />
                        Search
                    </button>

                </div>
            </div>
        </div>
    );
}