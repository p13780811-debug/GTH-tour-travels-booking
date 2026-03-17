"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Calendar, MapPin } from "lucide-react"
import { cities } from "@/data/cities"

export default function HeroSearch({ city }: { city?: string }) {

    const router = useRouter()

    const [tab, setTab] = useState("hotels")
    const [inputValue, setInputValue] = useState(city || "")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const tabs = ["flights", "hotels", "cars", "tours"]

    useEffect(() => {

        if (!inputValue) {
            setSuggestions([])
            return
        }

        const filtered = cities
            .filter((c) =>
                c.toLowerCase().includes(inputValue.toLowerCase())
            )
            .slice(0, 5)

        setSuggestions(filtered)

    }, [inputValue])


    const handleSearch = (value?: string) => {

        const searchTerm = value || inputValue

        if (!searchTerm.trim()) return

        const query = encodeURIComponent(searchTerm.trim())

        setIsOpen(false)

        if (tab === "flights") {

            window.open(
                `https://www.travelpayouts.com/redirect?marker=417668&host=search.aviasales.com&destination=${query}`,
                "_blank"
            )

        }

        else if (tab === "hotels") {

            window.open(
                `https://www.travelpayouts.com/redirect?marker=417668&host=search.hotellook.com&destination=${query}`,
                "_blank"
            )

        }

        else {

            router.push(`/search?q=${query}`)

        }

        inputRef.current?.blur()

    }



    return (

        <div className="w-full flex justify-center relative z-30 px-4 mt-6">

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


                {/* SEARCH CONTAINER */}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,180,255,0.25)] shadow-xl">

                    {/* DESTINATION */}

                    <div className="relative">

                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 w-4 h-4 z-10" />

                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value)
                                setIsOpen(true)
                            }}

                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleSearch()
                                }
                            }}

                            placeholder="Search destination, hotel, flights..."
                            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-400"
                        />



                        {/* Suggestions */}

                        {isOpen && suggestions.length > 0 && (

                            <div className="absolute top-full mt-2 w-full bg-black border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">

                                {suggestions.map((s, i) => (

                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInputValue(s)
                                            setIsOpen(false)
                                            handleSearch(s)
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-sky-500/20 transition"
                                    >

                                        {s}

                                    </button>

                                ))}

                            </div>

                        )}

                    </div>


                    {/* CHECKIN */}

                    <div className="relative">

                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 w-4 h-4" />

                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/5 text-sm text-white focus:outline-none focus:border-sky-500/40 transition [color-scheme:dark]"
                        />

                    </div>


                    {/* CHECKOUT */}

                    <div className="relative">

                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400 w-4 h-4" />

                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/5 text-sm text-white focus:outline-none focus:border-sky-500/40 transition [color-scheme:dark]"
                        />

                    </div>


                    {/* SEARCH BUTTON */}

                    <button
                        onClick={() => handleSearch()}
                        className="bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-white hover:to-white hover:text-black text-white rounded-xl font-bold text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2 uppercase py-3"
                    >

                        <Search className="w-4 h-4" />

                        Search

                    </button>

                </div>

            </div>

        </div>



    )

}