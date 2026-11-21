import Image from "next/image";
import {ArrowUpRight} from "lucide-react";
import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";

/** Use the existing GTH booking site as a full-page handoff.
 * Never embed it in a nested mobile scroll container.
 * Do not recreate or alter its supplier-operated booking widgets.
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
      <p className="max-w-xl text-sm leading-6 text-[var(--text-soft)]">
        Hotels &amp; Flights — book on the full GTH PRO booking portal, without a second search form.
      </p>
      <a href={HOTEL_BOOKING_ORIGIN} target="_blank" rel="noopener noreferrer sponsored"
        className="gth-btn-gold inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold sm:w-auto">
        Open Hotels &amp; Flights <ArrowUpRight size={16} aria-hidden="true"/>
      </a>
    </div>
  </section>;
}
