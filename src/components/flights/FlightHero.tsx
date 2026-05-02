"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Plane,
    Calendar,
    MapPin,
    Search,
    ArrowRightLeft,
    Bed,
    Car,
} from "lucide-react";

type Place = {
    name: string;
    code: string;
    country_name: string;
};

export default function FlightHero() {
    const [tab, setTab] = useState("flights");

    const [origin, setOrigin] = useState("Kolkata (CCU)");
    const [destination, setDestination] = useState("");

    const [originCode, setOriginCode] = useState("");
    const [destCode, setDestCode] = useState("");

    const [checkIn, setCheckIn] = useState("");

    const [suggestions, setSuggestions] = useState<Place[]>([]);
    const [activeInput, setActiveInput] = useState<"origin" | "dest" | null>(null);

    const [loading, setLoading] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLInputElement>(null);

    // 🔍 API suggestions (same logic)
    useEffect(() => {
        if (!activeInput) return;

        const value = activeInput === "origin" ? origin : destination;

        if (!value || value.length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            const res = await fetch(`/api/places?term=${value}`);
            const data = await res.json();
            setSuggestions(data);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [origin, destination, activeInput]);

    // ❌ close dropdown
    useEffect(() => {
        const handleClick = (e: any) => {
            if (!wrapperRef.current?.contains(e.target)) {
                setSuggestions([]);
                setActiveInput(null);
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    // ✅ select city
    const selectPlace = (place: Place) => {
        if (activeInput === "origin") {
            setOrigin(`${place.name} (${place.code})`);
            setOriginCode(place.code);
        } else {
            setDestination(`${place.name} (${place.code})`);
            setDestCode(place.code);
        }

        setSuggestions([]);
        setActiveInput(null);
    };

    // 🔁 swap
    const swapPlaces = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);

        const tempCode = originCode;
        setOriginCode(destCode);
        setDestCode(tempCode);
    };

    // 🔥 fallback API
    const fetchIata = async (city: string) => {
        const res = await fetch(`/api/places?term=${city}`);
        const data = await res.json();
        return data[0]?.code || null;
    };



    // 🚀 SEARCH
    const handleSearch = async () => {
        if (tab === "hotels") {
            window.open(
                `https://klook.tpo.lv/IKb6eSUe?u=${encodeURIComponent(
                    `https://www.klook.com/en-IN/hotels/searchresult/?city_name=${destination}`
                )}`,
                "_blank"
            );
            return;
        }

        if (tab === "tours") {
            window.open(
                `https://klook.tpo.lv/IKb6eSUe?u=${encodeURIComponent(
                    `https://www.klook.com/en-IN/search/result/?query=${destination}`
                )}`,
                "_blank"
            );
            return;
        }

        // ✈️ flights (UNCHANGED LOGIC)
        let finalOriginCode = originCode;
        let finalDestCode = destCode;

        if (!finalOriginCode && origin) {
            finalOriginCode = await fetchIata(origin);
        }

        if (!finalDestCode && destination) {
            finalDestCode = await fetchIata(destination);
        }

        if (!finalOriginCode || !finalDestCode) {
            alert("Invalid city");
            return;
        }

        if (!checkIn) {
            alert("Select date");
            return;
        }

        const date = new Date(checkIn).toISOString().split("T")[0];

        const url = `https://www.aviasales.com/search?origin=${finalOriginCode}&destination=${finalDestCode}&depart_date=${date}&with_request=true`;

        window.open(url, "_blank");
    };

    return (
        <section
            ref={wrapperRef}
            className="bg-[#050505] py-12 px-4 flex justify-center"
        >
            <div className="max-w-6xl w-full">

                {/* 🔥 TABS */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: "flights", label: "Flights", icon: Plane },
                        { id: "hotels", label: "Hotels", icon: Bed },
                        { id: "tours", label: "Tours", icon: Car },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase ${tab === t.id
                                ? "gth-btn-gold text-black"
                                : "gth-glass/10 text-gray-400"
                                }`}
                        >
                            <t.icon className="inline w-3 h-3 mr-1" />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* 🔥 SEARCH BAR */}
                <div className="flex flex-col md:flex-row bg-[#111] rounded-xl border border-white/10 overflow-visible">

                    {/* FROM */}
                    <div className="flex-1 p-4 border-r border-white/10">
                        <label className="text-xs text-gray-400">From</label>
                        <div className="flex items-center gap-2">
                            <MapPin />
                            <input
                                value={origin}
                                onChange={(e) => {
                                    setOrigin(e.target.value);
                                    setOriginCode("");
                                }}
                                onFocus={() => setActiveInput("origin")}
                                className="bg-transparent w-full outline-none"
                            />
                        </div>
                    </div>

                    {/* TO */}
                    <div className="flex-1 p-4 border-r border-white/10 relative">
                        <label className="text-xs text-gray-400">To</label>
                        <div className="flex items-center gap-2">
                            <Plane />
                            <input
                                value={destination}
                                onChange={(e) => {
                                    setDestination(e.target.value);
                                    setDestCode("");
                                }}
                                onFocus={() => setActiveInput("dest")}
                                className="bg-transparent w-full outline-none"
                            />
                        </div>

                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-[#111] border rounded-lg z-50">
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        onClick={() => selectPlace(s)}
                                        className="p-3 hover:gth-btn-gold cursor-pointer"
                                    >
                                        {s.name} ({s.code})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DATE */}
                    <div
                        className="flex-1 p-4 border-r border-white/10 cursor-pointer"
                        onClick={() => dateRef.current?.showPicker()}
                    >
                        <label className="text-xs text-gray-400">Depart</label>
                        <div className="flex items-center gap-2">
                            <Calendar />
                            <input
                                ref={dateRef}
                                type="date"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="bg-transparent outline-none w-full"
                            />
                        </div>
                    </div>

                    {/* SWAP */}
                    <button
                        onClick={swapPlaces}
                        className="hidden md:flex items-center justify-center px-4 border-r border-white/10"
                    >
                        <ArrowRightLeft />
                    </button>

                    {/* SEARCH */}
                    <button
                        onClick={handleSearch}
                        className="gth-btn-gold text-black px-8 font-bold flex items-center justify-center gap-2"
                    >
                        <Search />
                        Search
                    </button>
                </div>

                {loading && (
                    <p className="text-xs text-gray-400 mt-2">Searching...</p>
                )}
            </div>
        </section>
    );
}