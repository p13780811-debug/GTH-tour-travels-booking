import Image from "next/image";
import {ArrowUpRight} from "lucide-react";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";

/** Reuse the original provider-owned Hotels + Flights search portal.
 * Do not add duplicate GTH tabs or invent another search form.
 * Cross-origin embedding requires supplier frame permission.
 */
export default function MaldivesBookingHero({photo}:{photo:string}){
  return <section aria-labelledby="maldives-elite-title"
    className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pt-3 sm:px-6">
    <div className="relative isolate h-[235px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] sm:h-[350px] lg:h-[440px]">
      <Image src={photo}
        alt="Maldives lagoon with aerial overwater villas — Pexels editorial photograph"
        fill priority sizes="(max-width: 640px) 100vw, (max-width: 1280px) 95vw, 1600px"
        className="object-cover object-center"/>
      <div className="absolute bottom-4 left-4 right-4 max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-4 backdrop-blur-md sm:bottom-8 sm:left-8 sm:p-6">
        <h1 id="maldives-elite-title" className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          Maldives Elite Escape
        </h1>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-xl text-sm text-[var(--text-soft)]">
        Plan your stay or flight in the GTH booking portal. If the embedded portal is restricted,
        the direct booking link works without an extra GTH search form.
      </p>
      <a href={HOTEL_BOOKING_ORIGIN} target="_blank" rel="noopener noreferrer sponsored"
        className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
        Open Hotels &amp; Flights booking <ArrowUpRight size={16} aria-hidden="true"/>
      </a>
    </div>
    <div className="mt-3 min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <iframe src={HOTEL_BOOKING_ORIGIN}
        title="GTH PRO original booking portal — Hotels and Flights tabs"
        loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
        className="block h-[485px] w-full min-w-0 border-0 sm:h-[590px] lg:h-[630px]"/>
    </div>
  </section>;
}
