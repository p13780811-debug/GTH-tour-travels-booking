"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HotelGrid({ citySlug }: { citySlug: string }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await fetch(`/api/hotels?city=${encodeURIComponent(citySlug)}`);
        const data = await res.json();
        setHotels(Array.isArray(data) ? data : []);
      } catch (error) { setHotels([]); }
      setLoading(false);
    }
    fetchHotels();
  }, [citySlug]);

  if (loading || !hotels.length) return null;

  return (
    <section className="w-full py-10 bg-black">
      {/* 1. Header with Proper Title */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-8">
        <h2 className="text-white text-4xl font-black uppercase italic tracking-tighter leading-none">
          {citySlug.replace(/-/g, ' ')} <span className="text-white/20">/ Destinations</span>
        </h2>
      </div>

      {/* 2. Scrolling Container - No Scrollbar */}
      <div className="flex gap-6 overflow-x-auto no-scrollbar px-6 md:px-10 pb-10">
        {hotels.map((hotel) => (
          <article key={hotel.id} className="flex-shrink-0">
            <Link
              href={`/hotels/${hotel.hotel_slug || hotel.id}`}
              // Chhota Height (aspect-[4/3]) aur Responsive Width
              className="relative block w-[280px] md:w-[320px] aspect-[4/3] rounded-[2rem] overflow-hidden group border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Image Section with Zoom */}
              <Image
                src={hotel.image_url || "/images/placeholder.jpg"}
                alt={hotel.name}
                fill
                className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                unoptimized
              />

              {/* Information Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6 flex flex-col justify-end">

                {/* TOP: Stars & Reviews (Wapas aa gaya, door-door spacing ke saath) */}
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 self-start mb-3">
                  <div className="flex items-center gap-0.5 text-yellow-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < (hotel.rating || 5) ? "opacity-100" : "opacity-30"}>★</span>
                    ))}
                  </div>
                  <p className="text-white/60 text-[9px] font-bold tracking-[0.1em] uppercase">
                    {hotel.reviews_count || "120"} Trusted Reviews
                  </p>
                </div>

                {/* BOTTOM: Text & Details */}
                <div>
                  <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none mb-3">
                    {hotel.name}
                  </h3>

                  {/* Tagline / Meta Description (Jo gayab tha) */}
                  <p className="text-white/40 text-[10px] leading-relaxed mb-4 line-clamp-2 uppercase font-medium tracking-wide">
                    Experience unparalleled luxury in {hotel.city}. Premium amenities, world-class service, and breathtaking views await your arrival.
                  </p>

                  <div className="flex justify-between items-end pt-3 border-t border-white/10">
                    <div>
                      <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.3em] mb-0.5">Starting Price</p>
                      <span className="text-white font-black text-xl tracking-tighter italic">
                        {hotel.price}
                      </span>
                    </div>

                    <div className="bg-white text-black text-[10px] font-black px-6 py-2.5 rounded-full uppercase italic tracking-tighter hover:bg-yellow-400 transition-colors">
                      Explore Now
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
        {/* Spacer */}
        <div className="min-w-[50px]" />
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}