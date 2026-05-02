"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectCoverflow } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

export default function FeaturedDestinationsSlider({
    cities,
}: {
    cities: any[];
}) {
    return (
        <section className="py-20 bg-black overflow-hidden perspective-1000">
            {/* Professional Luxury Heading */}
            <div className="text-center mb-16">
                <h2 className="text-[#f59e0b] text-4xl md:text-5xl font-black tracking-[12px] uppercase drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all duration-500">
                    Featured Destinations
                </h2>
                <div className="h-1 w-28 md:w-32 bg-[#f59e0b] mx-auto mt-4 shadow-[0_0_18px_#f59e0b] rounded-full" />
            </div>

            <Swiper
                modules={[Navigation, Autoplay, EffectCoverflow]}
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                loop={true}
                spaceBetween={30}
                slidesPerView={"auto"}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                }}
                coverflowEffect={{
                    rotate: 30,
                    stretch: 0,
                    depth: 120,
                    modifier: 1,
                    slideShadows: false,
                }}
                navigation={true}
                className="mySwiper px-10"
            >
                {cities.map((city) => (
                    <SwiperSlide
                        key={city.slug}
                        className="!w-[350px] transition-transform duration-1000 ease-in-out"
                    >
                        <div className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 hover:shadow-sky-500/50 hover:border-[#f59e0b]/50">
                            {/* Image */}
                            <Image
                                src={city.image_url || "/images/default-city.jpg"}
                                alt={city.name}
                                width={400}
                                height={250}
                                className="object-cover w-full h-[350px] transition-transform duration-1000 group-hover:scale-110"
                            />

                            {/* ✅ Glass Strip Overlay ONLY behind text */}
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/40 via-black/50 to-transparent flex flex-col rounded-b-3xl">
                                <div className="backdrop-blur-[2px] inline-block">
                                    <h3 className="text-white font-black text-2xl md:text-3xl uppercase italic tracking-tight mb-2 text-shadow-sm">
                                        {city.name}
                                    </h3>
                                    <p className="text-[#f59e0b] text-[10px] md:text-sm font-bold uppercase tracking-widest mb-3 text-shadow-sm">
                                        Explore Luxury
                                    </p>
                                </div>

                                <Link href={`/destinations/${city.slug}`}>
                                    <button className="w-full py-2 gth-glass/10 backdrop-blur-md border border-white/20 text-[10px] md:text-sm text-white uppercase font-bold rounded-lg hover:bg-[#f59e0b] hover:text-black transition-all duration-300 active:scale-5">
                                        Explore Destination
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Navigation Buttons Styling */}
            <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: #0cf0b7 !important;
          background: rgba(0, 0, 0, 0.5);
          width: 55px;
          height: 55px;
          border-radius: 50%;
          border: 2px solid rgb(0, 255, 200);
          display: flex;
          align-items: center;
          justify-content: center;
          
          transition: all 0.3s ease-in-out;
        }

        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          background: #f59e0b;
          color: black !important;
          box-shadow: 0 0 15px #f59e0b, 0 0 30px #f59e0b, 0 0 45px #f59e0b;
          transform: scale(1.1);
        }

        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-size: 24px !important;
          font-weight: bold;
        }

        .glow-neon {
          box-shadow: 0 0 6px #f59e0b, 0 0 12px #f59e0b, 0 0 18px #f59e0b;
        }

        .text-shadow-lg {
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.6), 0 0 6px #f59e0b;
        }

        .text-shadow-sm {
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.5), 0 0 4px #f59e0b;
        }
      `}</style>
        </section>
    );
}