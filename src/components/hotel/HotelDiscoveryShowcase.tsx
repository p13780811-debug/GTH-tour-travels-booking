"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, ChevronRight, MapPin, Search } from "lucide-react";
import {cleanHotelDestination,resolveHotelRoute,unverifiedHotelDestinationHref} from "@/lib/travel/hotel-routing";

/**
 * Editorial hotel discovery inspired by swipe-first travel storefronts.
 * Destination images are scenery, NOT property inventory or available rooms.
 * Never calls a paid provider, invents prices, or changes Nuitee checkout.
 * All controls reuse the existing /hotels booking and date-free directory.
 */
const destinations = [
  { city: "Mumbai", image: "/images/cities/mumbai.jpg", label: "Urban stays" },
  { city: "Goa", image: "/images/cities/goa.jpg", label: "Coastal breaks" },
  { city: "Dubai", image: "/images/cities/dubai.jpg", label: "City escapes" },
  { city: "London", image: "/images/cities/london.jpg", label: "Capital stays" },
  { city: "Singapore", image: "/images/cities/singapore.jpg", label: "City discoveries" },
  { city: "Tokyo", image: "/images/cities/tokyo.jpg", label: "Neighbourhood guides" },
] as const;

const types = [
  { value: "", label: "All stays" },
  { value: "hotel", label: "Hotels" },
  { value: "resort", label: "Resorts" },
  { value: "apartment", label: "Apartments" },
  { value: "guest_house", label: "Guest houses" },
  { value: "hostel", label: "Hostels" },
] as const;

const validateCity = cleanHotelDestination;
const route = (view: "directory" | "booking", city?: string, category?: string) => {
  const params = new URLSearchParams({ view });
  if (city) params.set("city", city);
  if (view === "directory" && category) params.set("category", category);
  return "/hotels?" + params.toString() + (view === "directory" ? "#hotel-results" : "#hotel-booking-experience");
};

type Props = {
  initialCity?: string;
  currentMode: "directory" | "booking";
  activeCategory?: string;
};

export default function HotelDiscoveryShowcase({ initialCity = "", currentMode, activeCategory = "" }: Props) {
  const [city, setCity] = useState(initialCity);
  const [message, setMessage] = useState("");
  useEffect(() => { setCity(initialCity); setMessage(""); }, [initialCity]);
  const selected = useMemo(() => validateCity(city), [city]);
  const quickSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Never submit keystrokes to supplier autocomplete or API.
    if (!selected) {
      setMessage("Enter a valid city (2–80 letters) to explore stays.");
      return;
    }
    const result=resolveHotelRoute({destination:selected});
    window.location.assign(result.status==="ready"?result.url:unverifiedHotelDestinationHref(selected));
  };
  const active = types.some(t => t.value === activeCategory) ? activeCategory : "";
  return (
    <section aria-labelledby="gth-hotel-discovery-heading" className="border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 pb-7 pt-6 sm:px-6 sm:py-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">GTH PRO · Worldwide stays</p>
            <h2 id="gth-hotel-discovery-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Where to next?
            </h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Explore a destination without dates, then book verified stays when you&apos;re ready.
            </p>
          </div>
          <Link prefetch={false} href="/hotels?view=booking#hotel-booking-experience"
            className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <BedDouble size={16} aria-hidden="true" /> Book &amp; Stay
          </Link>
        </div>

        <form action="/hotels#hotel-booking-experience" method="GET" onSubmit={quickSearch}
          role="search" aria-label="Search hotel destinations without travel dates"
          className="gth-glass flex min-w-0 items-center gap-2 rounded-2xl border border-[var(--border)] p-2 shadow-sm sm:max-w-3xl">
          <Search className="ml-2 shrink-0 text-[var(--text-soft)]" size={22} aria-hidden="true" />
          <input type="hidden" name="view" value="booking" />
          <input name="city" type="search" value={city} onChange={event => { setCity(event.target.value); setMessage(""); }}
            aria-label="Hotel city or destination" aria-invalid={Boolean(message)} maxLength={80}
            required placeholder="Where would you like to stay?"
            autoComplete="address-level2"
            className="min-h-11 w-full min-w-0 flex-1 bg-transparent px-1 text-base text-[var(--text)] outline-none placeholder:text-[var(--text-soft)]" />
          <button type="submit" className="gth-btn-gold inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl px-4 text-sm font-semibold sm:px-6">
            Search <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
        {message && <p role="alert" className="mt-2 text-sm text-[var(--text)]">{message}</p>}
        <p className="mt-2 text-xs text-[var(--text-soft)]">
          Search goes to reviewed White Label destinations. Unmapped cities require selection on the secure booking site.
        </p>

        <div className="mt-7 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold sm:text-xl">Explore destinations</h3>
          <Link prefetch={false} href="/destinations" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline underline-offset-4">
            More <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <nav aria-label="Featured hotel destination booking searches"
          className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-0">
          {destinations.map(place => <Link key={place.city}
            href={route("booking", place.city)} prefetch={false}
            className="group flex h-48 w-[43vw] max-w-56 min-w-36 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:h-56 sm:w-48"
            aria-label={"Search bookable stays in " + place.city}>
            <span className="relative block min-h-0 flex-1 overflow-hidden">
              <Image src={place.image} alt={place.city + " destination scenery"} fill
                sizes="(max-width: 640px) 43vw, 192px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </span>
            <span className="block border-t border-[var(--border)] bg-[var(--card)] p-3 text-[var(--text)]">
              <span className="block text-base font-bold">{place.city}</span>
              <span className="mt-1 block text-xs text-[var(--text-soft)]">{place.label}</span>
            </span>
          </Link>)}
        </nav>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold sm:text-xl">Browse stays by type</h3>
            <p className="mt-1 text-xs text-[var(--text-soft)]">Directory categories, not room deals or live prices</p>
          </div>
          {currentMode === "directory" && <a href="#hotel-results" className="text-sm font-semibold underline underline-offset-4">Results</a>}
        </div>
        <nav aria-label="Choose hotel type" className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {types.map(type => <Link key={type.value || "all"} prefetch={false}
            href={route("directory", validateCity(initialCity) ?? undefined, type.value)}
            aria-current={currentMode === "directory" && active === type.value ? "page" : undefined}
            className={(currentMode === "directory" && active === type.value ? "gth-btn-gold" : "gth-btn") +
              " inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold"}>
            {type.label}
          </Link>)}
        </nav>
        {selected && <Link href={route("booking", selected)} prefetch={false}
          className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--gold)] underline underline-offset-4">
          <MapPin size={15} aria-hidden="true" /> Check rooms in {selected} <ChevronRight size={15} aria-hidden="true" />
        </Link>}
      </div>
    </section>
  );
}
