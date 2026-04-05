"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

type Partner = {
    name: string;
    image: string;
    link: string;
};

export default function GTHNetwork({ partners = [] }: { partners?: Partner[] }) {
    if (!partners || partners.length === 0) return null;

    return (
        <section className="py-12 bg-[#050505] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                {/* Heading */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] w-8 bg-sky-400"></div>
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
                        GTH <span className="text-white">Network</span>
                    </h2>
                </div>

                {/* Swiper Slider */}
                <Swiper
                    modules={[Navigation, Autoplay]}
                    slidesPerView={1.2}
                    spaceBetween={20}
                    breakpoints={{
                        640: { slidesPerView: 2, spaceBetween: 20 },
                        768: { slidesPerView: 3, spaceBetween: 25 },
                        1024: { slidesPerView: 4, spaceBetween: 30 },
                    }}
                    navigation
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    loop
                >
                    {[...partners, ...partners].map((p, idx) => (
                        <SwiperSlide key={idx}>
                            <Link href={p.link || "#"} target="_blank" className="block">
                                <div className="relative rounded-3xl overflow-hidden group border border-white/10 shadow-2xl transition-all duration-700 hover:scale-105 hover:shadow-sky-500/40">
                                    {/* Image */}
                                    <Image
                                        src={p.image || "/placeholder.jpg"}
                                        alt={p.name || "Partner"}
                                        width={400}
                                        height={250}
                                        className="object-cover w-full h-[250px] md:h-[300px] transition-transform duration-1000 group-hover:scale-110"
                                        unoptimized
                                    />

                                    {/* ✅ Glass Strip Overlay ONLY behind text - FIXED FOR CLARITY */}
                                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col">
                                        <div className="backdrop-blur-[2px] inline-block">
                                            <h3 className="font-bold text-white text-lg md:text-xl uppercase italic tracking-tight mb-1 text-shadow-lg">
                                                GTH {p.name}
                                            </h3>
                                            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest mb-3 text-shadow-sm">
                                                Verified Access
                                            </p>
                                        </div>

                                        <button className="w-full py-2 bg-white/10 backdrop-blur-md border border-white/20 text-[10px] text-white uppercase font-bold rounded-lg hover:bg-sky-400 hover:text-black shadow-lg transition-all duration-300 active:scale-95">
                                            View Deal
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Swiper Arrow & Neon Glow Styling */}
            <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: #f59e0b !important;
          background: rgba(0, 0, 0, 0.4);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid #f59e0b;
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 20px !important;
          font-weight: bold;
        }

        .glow-neon {
          box-shadow: 0 0 8px #0ea5e9, 0 0 16px #0ea5e9, 0 0 24px #0ea5e9;
        }

        .text-shadow-lg {
          text-shadow: 0 0 4px rgba(0,0,0,0.6), 0 0 6px #0ea5e9;
        }

        .text-shadow-sm {
          text-shadow: 0 0 2px rgba(0,0,0,0.5), 0 0 4px #0ea5e9;
        }
      `}</style>
        </section>
    );
}