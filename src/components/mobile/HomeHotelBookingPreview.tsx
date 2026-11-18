"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Hotel } from "lucide-react";
import NuiteeHotelsListWidget from "@/components/hotel/NuiteeHotelsListWidget";

const desktopQuery = "(min-width: 768px)";

function subscribe(callback: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * The provider's card grid changes the column count and card height per device
 * and does not offer a supported compact-card rendering API. On mobile, show
 * a clearly labelled editorial city image and an exact existing booking-search
 * handoff. Do not resize or rewrite supplier DOM, rates, ratings or click URLs.
 * The existing supplier list remains available on desktop.
 *
 * useSyncExternalStore avoids a hydration mismatch and keeps the supplier SDK
 * completely unmounted at mobile widths, reducing unnecessary client requests.
 */
export default function HomeHotelBookingPreview() {
  const desktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (desktop) {
    return (
      <section role="region" aria-label="GTH Worldwide Stays hotel cards"
        className="mx-4 mt-3 min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:mx-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Hotel size={17} className="text-[var(--gold)]" aria-hidden="true" />
          GTH Worldwide Stays · Mumbai
        </div>
        <NuiteeHotelsListWidget id="gth-home-nuitee-mumbai"
          placeId="ChIJwe1EZjDG5zsRaYxkjY_tpF0"
          placeLabel="Mumbai" rows={1} currency="INR" />
      </section>
    );
  }

  return (
    <section data-gth-compact-hotel-booking="true" aria-label="Compact hotel booking gateway"
      className="mx-4 mt-3 min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] sm:mx-6">
      <div className="flex min-w-0 items-stretch gap-3 p-3">
        <div className="relative min-h-32 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-soft)] sm:w-40">
          <Image src="/images/cities/mumbai.jpg"
            alt="Mumbai destination view, not a hotel room photo"
            fill sizes="(max-width: 640px) 112px, 160px"
            className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--gold)]">
            GTH Worldwide Stays
          </p>
          <h3 className="text-base font-bold leading-5">Mumbai hotels</h3>
          <p className="line-clamp-3 text-xs leading-5 text-[var(--text-soft)]">
            Choose dates to browse real hotel photos, room options and supplier prices.
          </p>
          <Link prefetch={false} href="/app/hotels?view=booking&city=Mumbai&country=IN"
            className="gth-btn-gold mt-1 inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-2 text-center text-xs font-bold">
            <CalendarDays size={15} aria-hidden="true" /> Check stays <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <p className="border-t border-[var(--border)] px-3 py-2 text-[11px] leading-4 text-[var(--text-soft)]">
        Destination image is editorial. Availability and final rates are confirmed in the existing hotel booking search.
      </p>
    </section>
  );
}
