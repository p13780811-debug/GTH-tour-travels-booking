'use client'

import { useRef } from "react"

export default function NetflixCarousel({
    title,
    tagline,
    items,
    type
}: any) {

    const sliderRef = useRef<HTMLDivElement>(null)

    const scroll = (dir: "left" | "right") => {

        if (!sliderRef.current) return

        sliderRef.current.scrollBy({
            left: dir === "left" ? -320 : 320,
            behavior: "smooth"
        })

    }

    // Dynamic Image Generator
    const getImage = (item: any, index: number) => {

        if (item.image_url) return item.image_url

        if (type === "hotel")
            return `https://source.unsplash.com/600x400/?luxury-hotel,${item.city || item.name}`

        if (type === "activity")
            return `https://source.unsplash.com/600x400/?tour,activity,${item.city || item.name}`

        if (type === "destination")
            return `https://source.unsplash.com/600x400/?city,travel,${item.name}`

        return `https://source.unsplash.com/600x400/?travel`
    }

    return (

        <section className="max-w-7xl mx-auto py-12 px-4 relative overflow-hidden">

            {/* Header */}

            <div className="flex justify-between items-center mb-6 px-2">

                <div>

                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                        {title}
                    </h2>

                    {tagline && (
                        <p className="text-xs text-zinc-400 mt-1">
                            {tagline}
                        </p>
                    )}

                </div>

                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/10 pb-1">
                    Explore
                </span>

            </div>

            {/* Gradients */}

            <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />

            {/* Arrows */}

            <button
                onClick={() => scroll("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-yellow-500/80 hover:bg-white text-black p-3 rounded-full hidden md:block"
            >
                ❮
            </button>

            <button
                onClick={() => scroll("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-yellow-500/80 hover:bg-white text-black p-3 rounded-full hidden md:block"
            >
                ❯
            </button>

            {/* Slider */}

            <div
                ref={sliderRef}
                className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory scroll-smooth"
            >

                {items?.map((item: any, i: number) => (

                    <div
                        key={i}
                        className="min-w-[240px] md:min-w-[280px] snap-center group transition-all duration-500"
                    >

                        <div className="bg-[#0f0f0f] rounded-2xl overflow-hidden border border-white/5 hover:border-yellow-400/30 transition-all shadow-xl group-hover:scale-105">

                            {/* Image */}

                            <div className="relative h-44 overflow-hidden">

                                <img
                                    src={getImage(item, i)}
                                    alt={item.name || item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />

                                {item.rating && (
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] text-yellow-400 font-bold">
                                        ★ {item.rating}
                                    </div>
                                )}

                            </div>

                            {/* Content */}

                            <div className="p-4">

                                <div className="flex justify-between items-start gap-2 mb-4">

                                    <h3 className="text-sm font-bold text-white truncate flex-1">
                                        {item.name || item.title}
                                    </h3>

                                    {item.price && (
                                        <p className="text-yellow-500 font-black text-sm whitespace-nowrap">
                                            ₹{item.price}
                                        </p>
                                    )}

                                </div>

                                {item.affiliate_link && (

                                    <a
                                        href={item.affiliate_link}
                                        target="_blank"
                                        className="block text-center bg-white/5 hover:bg-yellow-400 text-white hover:text-black py-2 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all"
                                    >
                                        View Deal
                                    </a>

                                )}

                            </div>

                        </div>

                    </div>

                ))}

            </div>

            <style jsx global>{`

      .no-scrollbar::-webkit-scrollbar{
      display:none;
      }

      .no-scrollbar{
      -ms-overflow-style:none;
      scrollbar-width:none;
      }

      `}</style>

        </section>

    )

}