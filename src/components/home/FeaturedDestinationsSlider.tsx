"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { useRef } from "react"

interface City {
    slug: string
    name: string
    image_url?: string
}

export default function FeaturedDestinationsSlider({
    cities,
}: {
    cities: City[]
}) {

    const sliderRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: "left" | "right") => {

        if (!sliderRef.current) return

        const containerWidth =
            sliderRef.current.offsetWidth

        sliderRef.current.scrollBy({
            left:
                direction === "left"
                    ? -(containerWidth * 0.82)
                    : containerWidth * 0.82,
            behavior: "smooth"
        })

    }

    if (!cities?.length) return null

    return (

        <section className="relative overflow-hidden bg-[var(--bg)] w-full py-14 md:py-20">

            {/* SOFT ATMOSPHERE */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">

                <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-[var(--surface-1)] blur-[120px]" />

                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--surface-2)] blur-[140px]" />

            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">

                {/* HEADER */}
                <div className="mb-8 flex items-end justify-between gap-4">

                    <div className="max-w-2xl">

                        <div className="gth-glass mb-4 inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2">

                            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-soft)]">

                                Featured Destinations

                            </span>

                        </div>

                        <h2 className="text-3xl font-black tracking-tight text-[var(--text)] md:text-5xl">

                            Explore the world's most{" "}

                            <span className="gold-text">
                                premium escapes
                            </span>

                        </h2>

                    </div>

                    {/* HOTSTAR STYLE NAV */}
                    <div className="hidden items-center gap-3 md:flex">

                        <button
                            onClick={() => scroll("left")}
                            className="gth-glass flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] transition-all duration-300 hover:-translate-y-1"
                        >

                            <ChevronLeft
                                size={18}
                                className="text-[var(--text)]"
                            />

                        </button>

                        <button
                            onClick={() => scroll("right")}
                            className="gth-btn-gold flex h-11 w-11 items-center justify-center rounded-full"
                        >

                            <ChevronRight size={18} />

                        </button>

                    </div>

                </div>

                {/* HOTSTAR STYLE ROW */}
                <div
                    ref={sliderRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
                >

                    {cities.map((city, index) => (

                        <Link
                            key={city.slug}
                            href={`/destinations/${city.slug}`}
                            className="group relative w-[72vw] flex-shrink-0 overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] transition-all duration-500 hover:z-20 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] sm:w-[340px] lg:w-[360px]"
                        >

                            {/* IMAGE */}
                            <div className="relative aspect-[4/5] overflow-hidden">

                                <Image
                                    src={
                                        city.image_url ||
                                        "/images/default-city.jpg"
                                    }
                                    alt={city.name}
                                    fill
                                    priority={index < 2}
                                    sizes="(max-width:768px) 72vw, 360px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                                />

                                {/* OVERLAY */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                                {/* CONTENT */}
                                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">

                                    <div className="gth-glass mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--stroke-soft)] px-3 py-2">

                                        <MapPin
                                            size={12}
                                            className="text-[var(--gold)]"
                                        />

                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text)]">

                                            Global Luxury

                                        </span>

                                    </div>

                                    <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">

                                        {city.name}

                                    </h3>

                                    <p className="mt-3 max-w-[240px] text-sm leading-relaxed text-white/75">

                                        Curated stays, cinematic
                                        experiences and elite travel
                                        discovery.

                                    </p>

                                    <div className="mt-5">

                                        <div className="gth-btn-gold inline-flex items-center justify-center rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em]">

                                            Explore Destination

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </Link>

                    ))}

                </div>

                {/* MOBILE HINT */}
                <div className="mt-5 flex items-center justify-center md:hidden">

                    <div className="gth-glass rounded-full border border-[var(--border)] px-4 py-2">

                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-soft)]">

                            Swipe To Explore

                        </span>

                    </div>

                </div>

            </div>

        </section>

    )

}