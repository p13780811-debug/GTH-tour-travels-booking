"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";

type HotelListing = {
  id: string | number;
  name: string;
  city: string;
  stars: number | null;
  image: string;
  affiliate_link: string | null;
};

export default function HotelResults({ city }: { city: string }) {
  const [hotels, setHotels] = useState<HotelListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setHotels([]);

    async function load() {
      try {
        const response = await fetch(`/api/hotels?city=${encodeURIComponent(city)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Hotel listings unavailable");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected hotel response");
        if (!controller.signal.aborted) setHotels(data as HotelListing[]);
      } catch {
        if (!controller.signal.aborted) setError("Hotel listings could not be loaded. Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [city]);

  if (loading) {
    return <p role="status" className="py-16 text-center text-[var(--muted)]">Searching hotel listings for {city}...</p>;
  }

  if (error) {
    return <p role="alert" className="py-12 text-center text-[var(--text)]">{error}</p>;
  }

  if (!hotels.length) {
    return <p role="status" className="py-12 text-center text-[var(--muted)]">No hotel listings found for {city}. Try another destination.</p>;
  }

  return (
    <div className="w-full py-6">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
        effect="coverflow"
        grabCursor
        centeredSlides={false}
        loop={false}
        navigation={hotels.length > 1}
        pagination={hotels.length > 1 ? { clickable: true } : false}
        autoplay={hotels.length > 1 ? { delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true } : false}
        coverflowEffect={{ rotate: 0, stretch: 0, depth: 100, modifier: 2.5, slideShadows: false }}
        className="mySwiper !pb-12"
        breakpoints={{
          320: { slidesPerView: 1.1, spaceBetween: 16 },
          768: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 24 },
        }}
      >
        {hotels.map((hotel) => (
          <SwiperSlide key={String(hotel.id)} className="max-w-[380px]">
            <article className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
              <div className="relative h-[420px]">
                <img
                  src={hotel.image}
                  alt={`Hotel listing: ${hotel.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-xs text-white">
                  {hotel.stars ? `${hotel.stars}-star hotel` : "Hotel listing"}
                </div>
                <div className="absolute inset-x-0 bottom-0 space-y-4 p-6 text-white">
                  <div>
                    <h2 className="line-clamp-2 text-xl font-bold">{hotel.name}</h2>
                    <p className="mt-1 text-xs opacity-80">{hotel.city}</p>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <p className="mb-3 text-xs">Check current rates, taxes and availability with the booking partner.</p>
                    {hotel.affiliate_link ? (
                      <a
                        href={hotel.affiliate_link}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="gth-btn-gold inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
                      >
                        Continue to booking partner
                      </a>
                    ) : (
                      <p className="rounded-xl border border-white/20 px-4 py-3 text-center text-xs">
                        Partner booking link not available for this listing
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        GTH PRO displays listing information; booking, payment, current prices and confirmation are handled by the partner.
      </p>
    </div>
  );
}
