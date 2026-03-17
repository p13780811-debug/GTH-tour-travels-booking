"use client";
import Image from "next/image";
import Link from "next/link";

// 1. Interface ekdum sahi (Props naam se)
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

// 2. Function mein "Props" use kiya hai (Jo pehle HotelQuadSectionProps tha)
export default function HotelQuadSection({ sectionTitle, subtitle, description, hotels }: Props) {

  // Safe check taaki data na hone par error na aaye
  const displayHotels = hotels?.slice(0, 4) || [];

  if (displayHotels.length < 1) return null;

  return (
    <section className="bg-black text-white py-20 px-6 md:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">

        {/* LEFT SIDE: 4 Grid Rectangle Images (Digha Style) */}
        <div className="w-full lg:w-[55%] grid grid-cols-2 gap-4">
          {displayHotels.map((h, i) => (
            <Link
              href={`/hotels/${h.slug}`}
              key={i}
              className="relative aspect-[16/10] rounded-[2rem] overflow-hidden group border border-white/10 shadow-2xl"
            >
              <Image
                src={h.image || "/hotel-placeholder.jpg"}
                alt={h.name}
                fill
                className="object-cover group-hover:scale-110 transition-all duration-1000 ease-in-out"
                unoptimized
              />
              {/* Luxury Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                <p className="text-white text-sm font-black uppercase italic tracking-tighter truncate">{h.name}</p>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Starting from <span className="text-white">{h.price}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* RIGHT SIDE: Digha-Style Premium Content */}
        <div className="w-full lg:w-[45%] space-y-8">
          <div>
            <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.5em] mb-2">{subtitle}</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-[0.9]">
              {sectionTitle} <br />
              <span className="text-white/20">The Legacy</span>
            </h2>
          </div>

          <p className="text-white/50 text-xs leading-relaxed font-medium uppercase tracking-wider">
            {description}
          </p>

          {/* RARE ADVANTAGE BOX (Digha Style) */}
          <div className="bg-white/5 border border-yellow-500/20 p-6 rounded-[2rem] relative">
            <div className="absolute -top-3 left-6 bg-black px-3 py-1">
              <span className="text-yellow-500 text-[10px] font-black uppercase tracking-widest">Global Access</span>
            </div>
            <p className="text-white/80 text-[11px] leading-relaxed italic">
              "Our handpicked {sectionTitle} selection offers exclusive priority booking, complimentary upgrades,
              and private access to hidden cinematic locations across the city."
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Link href={`/hotels?city=${sectionTitle.toLowerCase()}`}>
              <button className="bg-white text-black text-[10px] font-black px-10 py-5 rounded-full uppercase italic hover:bg-yellow-500 transition-all">
                Explore {sectionTitle} Collection →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}