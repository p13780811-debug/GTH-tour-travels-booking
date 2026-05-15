"use client"

import Image from "next/image"
import Link from "next/link"

interface HeroSectionProps {
    destination: {
        name?: string
        slug?: string
        image_url?: string
        hero_image?: string
    }
}

export default function HeroSection({
    destination
}: HeroSectionProps) {

    const cityName = destination?.name || "Global"
    const slug = destination?.slug || "explore"

    const heroImg =
        destination?.image_url ||
        destination?.hero_image ||
        `/images/cities/${slug}.jpg`

    return (

        <section className="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden bg-[var(--bg)]">

            {/* BACKGROUND IMAGE */}
            <div className="absolute inset-0">

                <Image
                    src={heroImg}
                    alt={cityName}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover animate-subtle-zoom"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src =
                            "https://images.pexels.com/photos/3769138/pexels-photo-3769138.jpeg"
                    }}
                />

                {/* EXISTING ECOSYSTEM OVERLAYS — NO COLOR CHANGES */}
                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/90" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

            </div>

            {/* CONTENT */}
            <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center">

                {/* TAG */}
                <div className="mb-5 inline-flex items-center rounded-full border border-white/10 gth-glass px-5 py-2 backdrop-blur-xl">

                    <span className="text-[9px] font-black uppercase tracking-[0.45em] text-yellow-500">
                        Premium Travel Guide
                    </span>

                </div>

                {/* TITLE */}
                <h1 className="max-w-5xl text-5xl font-black uppercase italic leading-[0.9] tracking-tighter text-white md:text-8xl">

                    {cityName}

                    <span className="text-yellow-500">.</span>

                </h1>

                {/* DESCRIPTION */}
                <p className="mt-6 max-w-2xl text-sm font-medium leading-relaxed text-gray-300 md:text-base">

                    Experience the pinnacle of luxury in {cityName}. From curated
                    5-star stays to exclusive private tours, discover a world
                    designed for the elite.

                </p>

                {/* ACTIONS */}
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">

                    {/* SAME EXISTING BUTTON CLASS */}
                    <Link
                        href={`/go/${slug}`}
                        className="gth-btn-gold px-10 py-4 text-xs font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(234,179,8,0.4)] transition-all duration-300"
                    >
                        View Deals
                    </Link>

                    {/* SAME EXISTING STYLING FEEL */}
                    <button className="border-b-2 border-white/20 pb-1 text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-yellow-500">
                        Explore Map
                    </button>

                </div>

                {/* BOTTOM STATS */}
                <div className="mt-14 flex flex-wrap items-center justify-center gap-3">

                    <div className="gth-glass rounded-full border border-white/10 px-5 py-2 backdrop-blur-xl">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                            Elite Stays
                        </span>
                    </div>

                    <div className="gth-glass rounded-full border border-white/10 px-5 py-2 backdrop-blur-xl">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                            Private Tours
                        </span>
                    </div>

                    <div className="gth-glass rounded-full border border-white/10 px-5 py-2 backdrop-blur-xl">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                            AI Discovery
                        </span>
                    </div>

                </div>

            </div>

            {/* BOTTOM FADE */}
            <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black to-transparent" />

        </section>

    )
}