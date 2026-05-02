"use client";

import Image from "next/image";
import Link from "next/link";

interface Hotel {
  name: string;
  image: string;
  slug: string;
  price: string;
}

interface Props {
  sectionTitle: string;
  subtitle: string;
  description: string;
  hotels: Hotel[];
}

export default function HotelQuadSection({
  sectionTitle,
  subtitle,
  description,
  hotels,
}: Props) {
  const displayHotels = hotels?.slice(0, 4) || [];
  if (displayHotels.length < 1) return null;

  return (
    <section className="py-20 px-6 md:px-12 bg-black/5 backdrop-blur-sm border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">

        {/* LEFT: Hotel Cards Grid */}
        <div className="w-full lg:w-[55%] grid grid-cols-2 gap-6">
          {displayHotels.map((h, i) => (
            <Link
              key={i}
              href={`/hotels/${h.slug}`}
              className="relative aspect-[16/10] rounded-3xl overflow-hidden group border border-white/20 shadow-2xl hover:shadow-sky-400/40 transition-all duration-700"
            >
              <Image
                src={h.image || "/hotel-placeholder.jpg"}
                alt={h.name}
                fill
                className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                unoptimized
              />

              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                <div className="backdrop-blur-sm bg-black/20 p-2 rounded-xl inline-block w-fit">
                  <p className="text-white font-black uppercase tracking-tight text-sm italic truncate">
                    {h.name}
                  </p>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                    From <span className="text-sky-400 font-bold">{h.price}</span>
                  </p>
                </div>
              </div>

              {/* Neon Badge */}
              <div className="absolute top-4 left-4 bg-sky-500/20 text-sky-400 px-2 py-1 text-[9px] font-black uppercase rounded-lg animate-pulse shadow-[0_0_10px_skyblue]">
                Exclusive
              </div>
            </Link>
          ))}
        </div>

        {/* RIGHT: Premium Info Panel */}
        <div className="w-full lg:w-[45%] space-y-8">
          <div>
            <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.5em] mb-2">
              {subtitle}
            </p>
            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tight leading-[1.1]">
              {sectionTitle} <br />
              <span className="text-white/20">Elite Selection</span>
            </h2>
          </div>

          <p className="text-white/50 text-xs md:text-sm font-medium uppercase tracking-wider leading-relaxed">
            {description}
          </p>

          {/* Rare Advantage Box */}
          <div className="relative gth-glass/5 border border-sky-500/20 rounded-2xl p-6 shadow-lg backdrop-blur-md">
            <div className="absolute -top-3 left-6 bg-black px-3 py-1 rounded-lg">
              <span className="text-sky-400 text-[10px] font-black uppercase tracking-widest">
                Global Access
              </span>
            </div>
            <p className="text-white/80 text-[11px] italic leading-snug">
              "Our handpicked {sectionTitle} hotels offer priority booking, complimentary upgrades, and private access to exclusive locations."
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Link href={`/hotels?city=${sectionTitle.toLowerCase()}`}>
              <button className="bg-sky-400/20 text-white text-[10px] font-black px-10 py-4 rounded-full uppercase italic hover:bg-sky-500/30 hover:shadow-[0_0_20px_skyblue] transition-all duration-300">
                Explore {sectionTitle} Collection →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}