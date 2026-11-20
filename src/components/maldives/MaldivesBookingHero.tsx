import Image from "next/image";
import {ArrowUpRight,Hotel,Plane,ShieldCheck} from "lucide-react";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";

/**
 * This is the EXISTING supplier-owned booking portal with its original
 * Hotels + Flights tabs, not another GTH search form or simulated widget.
 * Cross-origin embedding depends on the supplier's frame policy. The
 * independent same-origin? No: official outbound link below is the reliable
 * first-party-approved fallback when embedding is restricted.
 */
export default function MaldivesBookingHero(){
  return <section aria-labelledby="maldives-elite-title"
    className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pt-3 sm:px-6">
    <div className="relative isolate h-[240px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] sm:h-[360px] lg:h-[440px]">
      <Image
        src="https://images.unsplash.com/photo-1632904000334-144b19f78500?auto=format&fit=crop&w=2200&q=80"
        alt="Maldives turquoise lagoon with luxury overwater villas"
        fill priority sizes="(max-width: 640px) 100vw, (max-width: 1280px) 95vw, 1600px"
        className="object-cover object-center"/>
      <div className="absolute bottom-4 left-4 right-4 max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 backdrop-blur-md sm:bottom-8 sm:left-8 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">GTH PRO Global · Maldives</p>
        <h1 id="maldives-elite-title" className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          Maldives Elite Escape
        </h1>
      </div>
    </div>
    <div className="gth-glass-strong mt-4 min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text)] sm:text-xl">Hotels &amp; Flights</h2>
          <p className="mt-1 text-xs leading-6 text-[var(--text-soft)]">
            Original GTH PRO booking portal, including its own hotel and flight tabs.
          </p>
        </div>
        <a href={HOTEL_BOOKING_ORIGIN} target="_blank" rel="noopener noreferrer sponsored"
          className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
          <Hotel size={16} aria-hidden="true"/> Open original search <ArrowUpRight size={16} aria-hidden="true"/>
        </a>
      </div>
      <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
        <iframe src={HOTEL_BOOKING_ORIGIN} title="GTH PRO original booking portal — Hotels and Flights tabs"
          loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
          className="block h-[485px] w-full min-w-0 border-0 sm:h-[590px] lg:h-[630px]"/>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
        <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0"/>
        Agar original booking portal embedded view allow nahi karta, upar
        Open original search se wahi supplier site direct kholein. Uske Hotels aur Flights tabs unchanged hain.
      </p>
    </div>
  </section>;
}
