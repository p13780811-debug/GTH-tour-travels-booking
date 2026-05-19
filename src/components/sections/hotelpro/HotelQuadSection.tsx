"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, MapPin, Sparkles, ArrowRight, Star, ShieldCheck, Globe2 } from "lucide-react";

interface Hotel {
  name: string;
  image: string;
  slug: string;
  price: string;
  city?: string;
  rating?: number;
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

  if (!displayHotels.length) return null;

  return (
    <section className="relative overflow-hidden py-14 md:py-20 border-y border-[var(--border)] bg-[var(--bg)]">

      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* TOP */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8 mb-10">

          <div className="max-w-3xl">

            <div className="flex flex-wrap items-center gap-3 mb-5">

              <div className="h-10 px-4 rounded-full border border-[var(--border)] gth-glass flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--text-soft)]" />
                <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-soft)] font-black">
                  {subtitle}
                </span>
              </div>

              <div className="h-10 px-4 rounded-full border border-[var(--border)] gth-glass flex items-center gap-2">
                <ShieldCheck size={14} className="text-[var(--text-soft)]" />
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-soft)] font-bold">
                  Verified Inventory
                </span>
              </div>

            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl leading-[0.95] tracking-[-0.05em] font-black uppercase text-[var(--text)]">

              {sectionTitle}

              <span className="block text-[var(--text-soft)] italic font-serif font-semibold mt-2">
                Elite Hospitality Collection
              </span>

            </h2>

            <p className="mt-6 text-sm md:text-base text-[var(--text-soft)] leading-7 max-w-2xl">
              {description}
            </p>

          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-3 w-full xl:w-auto">

            {[
              { label: "Luxury", value: "5★" },
              { label: "Destinations", value: "120+" },
              { label: "Priority", value: "VIP" },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-[100px] rounded-2xl border border-[var(--border)] gth-glass px-4 py-5 text-center"
              >
                <div className="text-xl md:text-2xl font-black text-[var(--text)]">
                  {item.value}
                </div>

                <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[var(--text-soft)]">
                  {item.label}
                </div>
              </div>
            ))}

          </div>

        </div>

        {/* MAIN GRID */}
        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-8 xl:gap-10">

          {/* HOTEL GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {displayHotels.map((hotel, i) => (
              <Link
                key={i}
                href={`/hotels/${hotel.slug}`}
                className="group relative overflow-hidden rounded-[28px] border border-[var(--border)] gth-glass min-h-[300px] md:min-h-[340px]"
              >

                {/* IMAGE */}
                <div className="absolute inset-0">

                  <Image
                    src={hotel.image || "/hotel-placeholder.jpg"}
                    alt={hotel.name}
                    fill
                    priority={i === 0}
                    className="object-cover transition-transform duration-[1800ms] group-hover:scale-110"
                    unoptimized
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/40 via-[var(--bg)]/10 to-transparent" />

                </div>

                {/* BADGES */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">

                  <div className="h-9 px-4 rounded-full border border-[var(--border)] gth-glass flex items-center gap-2">
                    <Crown size={13} className="text-[var(--text-soft)]" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--text)] font-black">
                      Exclusive
                    </span>
                  </div>

                  <div className="h-9 px-3 rounded-full border border-[var(--border)] gth-glass flex items-center gap-1">
                    <Star size={12} className="text-[var(--text-soft)]" />
                    <span className="text-xs text-[var(--text)] font-bold">
                      {hotel.rating || "4.9"}
                    </span>
                  </div>

                </div>

                {/* CONTENT */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-5 md:p-6">

                  <div className="rounded-3xl border border-[var(--border)] gth-glass p-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h3 className="text-lg md:text-xl font-black uppercase leading-tight text-[var(--text)]">
                          {hotel.name}
                        </h3>

                        <div className="mt-3 flex items-center gap-2 text-[var(--text-soft)] text-xs uppercase tracking-[0.2em]">
                          <MapPin size={12} />
                          {hotel.city || "Global Destination"}
                        </div>

                      </div>

                      <div className="text-right shrink-0">

                        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-soft)]">
                          From
                        </div>

                        <div className="mt-1 text-lg md:text-2xl font-black text-[var(--text)]">
                          {hotel.price}
                        </div>

                      </div>

                    </div>

                    <div className="mt-5 flex items-center justify-between">

                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--text-soft)]">
                        <Globe2 size={13} />
                        Instant Booking
                      </div>

                      <div className="h-10 px-4 rounded-full gth-btn text-xs uppercase tracking-[0.15em] font-black flex items-center gap-2 transition-all">
                        Explore
                        <ArrowRight size={14} />
                      </div>

                    </div>

                  </div>

                </div>

              </Link>
            ))}

          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-5">

            {/* FEATURE PANEL */}
            <div className="rounded-[32px] border border-[var(--border)] gth-glass p-6 md:p-8 overflow-hidden relative">

              <div>

                <div className="flex items-center justify-between mb-8">

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-soft)] font-black">
                      Global Access
                    </p>

                    <h3 className="mt-3 text-2xl md:text-3xl font-black uppercase leading-tight text-[var(--text)]">
                      VIP Hospitality Network
                    </h3>

                  </div>

                  <div className="w-3 h-3 rounded-full bg-[var(--text-soft)] animate-pulse" />

                </div>

                <div className="space-y-4">

                  {[
                    "Private airport transfers included",
                    "Priority suite upgrades available",
                    "Oceanfront & skyline collections",
                    "AI-curated luxury experiences",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4"
                    >

                      <div className="w-2 h-2 rounded-full bg-[var(--text-soft)] shrink-0" />

                      <span className="text-sm text-[var(--text-soft)]">
                        {item}
                      </span>

                    </div>
                  ))}

                </div>

                <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">

                  <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-soft)] font-black">
                    AI Concierge Status
                  </div>

                  <div className="mt-3 flex items-end justify-between">

                    <div className="text-5xl font-black text-[var(--text)]">
                      98%
                    </div>

                    <div className="text-right text-xs text-[var(--text-soft)] uppercase tracking-[0.2em]">
                      Live Premium Sync
                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* CTA */}
            <Link
              href={`/hotels`}
              className="group rounded-[30px] border border-[var(--border)] gth-glass p-6 md:p-7 transition-all duration-500"
            >

              <div className="flex items-center justify-between gap-5">

                <div>

                  <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--text-soft)] font-black">
                    Premium Collection
                  </p>

                  <h3 className="mt-3 text-2xl font-black uppercase leading-tight text-[var(--text)]">
                    Explore Global Luxury Stays
                  </h3>

                </div>

                <div className="w-14 h-14 rounded-2xl gth-btn flex items-center justify-center shrink-0 transition-all">
                  <ArrowRight size={22} />
                </div>

              </div>

            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}