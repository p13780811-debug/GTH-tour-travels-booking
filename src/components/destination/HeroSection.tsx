"use client"

import Link from "next/link"

export default function HeroSection({ destination }: any) {

    const cityName = destination?.name || "Global"
    const slug = destination?.slug || "explore"

    const heroImg =
        destination?.image_url ||
        destination?.hero_image ||
        `/images/cities/${slug}.jpg`

    return (

        <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-black">

            {/* HERO IMAGE */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">

                <img
                    src={heroImg}
                    alt={cityName}
                    className="absolute inset-0 w-full h-full object-cover animate-subtle-zoom"
                    onError={(e) => {
                        e.currentTarget.src = "https://images.pexels.com/photos/3769138/pexels-photo-3769138.jpeg"
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/90"></div>

            </div>

            {/* CONTENT */}

            <div className="relative z-10 text-center px-6 max-w-4xl">

                <span className="text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-[6px] mb-4 block animate-fade-in">
                    Premium Travel Guide
                </span>

                <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase italic leading-[0.9]">
                    {cityName} <span className="text-yellow-500">.</span>
                </h1>

                <p className="max-w-xl mx-auto text-gray-400 text-sm md:text-base font-medium leading-relaxed">
                    Experience the pinnacle of luxury in {cityName}. From curated 5-star stays to
                    exclusive private tours, discover a world designed for the elite.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">

                    <Link
                        href={`/go/${slug}`}
                        className="bg-yellow-500 hover:bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_10px_30px_rgba(234,179,8,0.4)]"
                    >
                        View Deals
                    </Link>

                    <button className="text-white text-xs font-bold uppercase tracking-widest border-b-2 border-white/20 hover:border-yellow-500 pb-1 transition-all">
                        Explore Map
                    </button>

                </div>

            </div>

            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>

            <style jsx>{`

@keyframes subtle-zoom {
0% { transform: scale(1); }
100% { transform: scale(1.1); }
}

.animate-subtle-zoom {
animation: subtle-zoom 20s infinite alternate ease-in-out;
}

@keyframes fadeIn {
from { opacity:0; transform:translateY(10px); }
to { opacity:1; transform:translateY(0); }
}

.animate-fade-in{
animation:fadeIn 1s ease-out;
}

`}</style>

        </section>

    )

}