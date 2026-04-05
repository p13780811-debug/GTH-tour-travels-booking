"use client"

import { useRef } from "react"
import Link from "next/link"

export default function RelatedCarousel({ related, symbolMap }: any) {

    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (dir: "left" | "right") => {
        if (!scrollRef.current) return
        const scrollAmount = 300
        scrollRef.current.scrollBy({
            left: dir === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth"
        })
    }

    return (
        <div className="mt-12 relative">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Similar Tours</h2>

                {/* ARROWS */}
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className="bg-white/10 hover:bg-yellow-500 hover:text-black p-2 rounded-full backdrop-blur border border-white/20"
                    >
                        ←
                    </button>

                    <button
                        onClick={() => scroll("right")}
                        className="bg-white/10 hover:bg-yellow-500 hover:text-black p-2 rounded-full backdrop-blur border border-white/20"
                    >
                        →
                    </button>
                </div>
            </div>

            {/* CAROUSEL */}
            <div
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto px-6 scroll-smooth snap-x snap-mandatory scrollbar-hide"
            >
                {related && related.length > 0 ? (
                    related.map((item: any) => (
                        <Link
                            key={item.id}
                            href={`/tours/${item.city_slug}`}
                            className="min-w-[300px] snap-start group rounded-2xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 hover:scale-[1.03] transition"
                        >

                            {/* IMAGE FIX */}
                            <div className="relative h-48 w-full overflow-hidden">
                                <img
                                    src={item.image_url}
                                    className="w-full h-full object-cover object-center brightness-110 contrast-110"
                                />

                                {/* LIGHT GRADIENT (NOT HEAVY) */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                            </div>

                            {/* CONTENT */}
                            <div className="p-4">

                                <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                                    {item.title}
                                </h3>

                                <p className="text-xs text-gray-400 mt-1">
                                    {item.city || item.city_slug}
                                </p>

                                <p className="text-yellow-400 text-xs-right mt-1">
                                    ⭐ {item.rating ?? "4.5"}
                                </p>

                                <p className="text-yellow-400 font-bold mt-2">
                                    {(symbolMap[item.currency] || "₹")}
                                    {item.price_numeric ?? 0}
                                </p>

                            </div>

                        </Link>
                    ))
                ) : (
                    <p className="text-gray-400">🔥 More amazing tours coming soon...</p>
                )}
            </div>
        </div>
    )
}