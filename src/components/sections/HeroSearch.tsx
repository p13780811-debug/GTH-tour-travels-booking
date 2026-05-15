"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, Calendar, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { getIata, cityToIata } from "@/lib/iata";

export default function SearchSection({ city }: { city?: string }) {
    const [tab, setTab] = useState("flights");
    const [inputValue, setInputValue] = useState(city || "");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const router = useRouter();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const tabs = ["flights", "hotels", "tours"];

    // ✅ Debounced Suggestions
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            if (inputValue.trim().length > 1) {
                const filtered = Object.keys(cityToIata)
                    .filter((cityName) =>
                        cityName.toLowerCase().includes(inputValue.toLowerCase())
                    )
                    .slice(0, 8);

                setSuggestions(filtered);
                setIsOpen(true);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [inputValue]);

    // ✅ Click Outside Close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearch = (searchQuery?: string) => {
        const query = searchQuery || inputValue;

        if (!query.trim()) return;

        if (tab === "hotels") {
            const klookUrl = `https://klook.tpo.lv/IKb6eSUe?u=${encodeURIComponent(
                `https://www.klook.com/en-IN/hotels/searchresult/?city_name=${query}`
            )}`;

            window.open(klookUrl, "_blank");
        }

        else if (tab === "flights") {
            const code = getIata(query || "Delhi");

            router.push(
                `/flights?origin=DEL&destination=${code}&depart_date=${checkIn}`
            );
        }

        else if (tab === "tours") {
            const toursUrl = `https://klook.tpo.lv/IKb6eSUe?u=${encodeURIComponent(
                `https://www.klook.com/en-IN/search/result/?query=${query}`
            )}`;

            window.open(toursUrl, "_blank");
        }

        else {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }

        setIsOpen(false);
    };

    return (
        <div className="relative z-30 flex w-full justify-center px-4 mt-6 font-sans" ref={wrapperRef}>

            <div className="w-full max-w-4xl">

                {/* TABS */}
                <div className="sticky top-[60px] z-40 mb-3 flex justify-center gap-6 md:static">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`pb-1 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ${tab === t
                                    ? "text-[var(--gold)] border-b-2 border-[var(--gold)]"
                                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* SEARCH BAR */}
                <div className="relative grid grid-cols-1 md:grid-cols-4 gap-2 overflow-visible rounded-[28px] border border-[var(--border)] bg-[var(--surface-1)]/70 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] p-2">

                    {/* DESTINATION */}
                    <div className="relative md:border-r border-[var(--border)]">
                        <MapPin className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--gold)]" />

                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => {
                                if (suggestions.length > 0) {
                                    setIsOpen(true);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSearch();
                                }
                            }}
                            placeholder={
                                tab === "hotels"
                                    ? "Search Hotels..."
                                    : "Search Destination..."
                            }
                            className="h-12 w-full rounded-2xl bg-transparent pl-11 pr-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                        />

                        {/* SUGGESTIONS */}
                        {isOpen && suggestions.length > 0 && (
                            <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] backdrop-blur-2xl shadow-2xl">

                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInputValue(s);
                                            handleSearch(s);
                                        }}
                                        className="flex w-full items-center justify-between border-b border-[var(--border)] px-4 py-3 text-left text-sm text-[var(--foreground)] transition-all hover:bg-[var(--surface-2)] last:border-none"
                                    >
                                        <span>{s}</span>

                                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--gold)]">
                                            Visit →
                                        </span>
                                    </button>
                                ))}

                            </div>
                        )}
                    </div>

                    {/* CHECK IN */}
                    <div className="relative md:border-r border-[var(--border)]">
                        <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gold)]" />

                        <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="h-12 w-full cursor-pointer rounded-2xl bg-transparent pl-11 pr-4 text-xs text-[var(--foreground)] outline-none [color-scheme:dark]"
                        />
                    </div>

                    {/* CHECK OUT */}
                    <div className="relative md:border-r border-[var(--border)]">
                        <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gold)]" />

                        <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="h-12 w-full cursor-pointer rounded-2xl bg-transparent pl-11 pr-4 text-xs text-[var(--foreground)] outline-none [color-scheme:dark]"
                        />
                    </div>

                    {/* BUTTON */}
                    <button
                        type="button"
                        onClick={() => handleSearch()}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--gold)] px-5 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all duration-300 hover:scale-[1.02] active:scale-95"
                    >
                        <Search className="h-4 w-4" />
                        Search
                    </button>

                </div>

            </div>

        </div>
    );
}