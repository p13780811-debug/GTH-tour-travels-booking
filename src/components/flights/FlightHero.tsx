"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
    const [tab, setTab] = useState("flights");

    const [origin, setOrigin] = useState("Kolkata (CCU)");
    const [destination, setDestination] = useState("");

    const [originCode, setOriginCode] = useState("CCU");
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

    const fetchIata = async (city: string): Promise<string | null> => {
        const match = city.toUpperCase().match(/\\(([A-Z]{3})\\)\\s*$/);
        if (match) return match[1];
        if (/^[A-Z]{3}$/.test(city.trim().toUpperCase())) return city.trim().toUpperCase();

        try {
            const response = await fetch(`/api/places?term=${encodeURIComponent(city)}`);
            if (!response.ok) return null;
            const data: unknown = await response.json();
            if (!Array.isArray(data)) return null;
            const code = data[0]?.code;
            return typeof code === "string" && /^[A-Za-z]{3}$/.test(code) ? code.toUpperCase() : null;
        } catch {
            return null;
        }
    };

    const handleSearch = async () => {
        const destinationName = destination.replace(/\\s*\\([A-Za-z]{3}\\)\\s*$/, "").trim();

        if (tab === "hotels") {
            router.push(destinationName ? `/hotels?city=${encodeURIComponent(destinationName)}` : "/hotels");
            return;
        }

        if (tab === "tours") {
            router.push(destinationName ? `/tours?city=${encodeURIComponent(destinationName)}` : "/tours");
            return;
        }

        if (!checkIn || !/^\\d{4}-\\d{2}-\\d{2}$/.test(checkIn)) {
            alert("Choose a departure date.");
            return;
        }

        const today = new Date().toLocaleDateString("en-CA");
        if (checkIn < today) {
            alert("Departure date cannot be in the past.");
            return;
        }

        const finalOriginCode = originCode || await fetchIata(origin);
        const finalDestCode = destCode || await fetchIata(destination);

        if (!finalOriginCode || !finalDestCode || finalOriginCode === finalDestCode) {
            alert("Choose two different valid airports.");
            return;
        }

        const query = new URLSearchParams({
            origin: finalOriginCode,
            destination: finalDestCode,
            depart_date: checkIn,
        });

        router.push(`/flights?${query.toString()}`);
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