import Image from "next/image";
import {ArrowUpRight,Hotel,MapPin,ShieldCheck,Star} from "lucide-react";
import {VERIFIED_MALDIVES_HOTELS} from "@/lib/maldives/verified-hotels";

/** True Maldives property cards, sourced from the supplier's free static
 * catalog. Every card is a native submitter of the already visible stay form.
 * The entire image/card/title/CTA submits selected dates, guests and currency
 * to a server-only allowlisted property-level redirect (no secondary search).
 */
export default function MaldivesStays(){
  return <section id="maldives-stays" aria-labelledby="maldives-stays-title"
    className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:py-16">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--gold)]">
          <Hotel size={16} aria-hidden="true"/> GTH Worldwide Stays · Maldives
        </p>
        <h2 id="maldives-stays-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Real resorts. Direct hotel booking.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          Choose your island resort below — each card opens that exact hotel's
          white-label booking page, with the dates and guests selected above.
          Explore properties around Malé, North & South Malé, Baa and Ari Atolls.
        </p>
      </div>
      <a href="#maldives-hotels-grid"
        className="gth-btn-gold inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold">
        Browse Maldives resorts <ArrowUpRight size={16} aria-hidden="true"/>
      </a>
    </div>
    <div role="region" id="maldives-hotels-grid" aria-label="Verified Maldives resort booking cards — swipe to explore"
      tabIndex={0} className="mt-6 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-5 scroll-mt-24 sm:gap-4 lg:grid lg:grid-cols-3 lg:overflow-visible xl:grid-cols-4">
      {VERIFIED_MALDIVES_HOTELS.map(hotel=>
        <button key={hotel.id} type="submit" form="maldives-elite-stay-search"
          formAction={"/maldives-elite-escape/stays/"+hotel.id}
          data-maldives-hotel-id={hotel.id}
          aria-label={"View "+hotel.name+" hotel details with selected travel dates"}
          className="group flex w-[78vw] max-w-[310px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-left shadow-[var(--shadow)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] sm:w-[305px] lg:w-full lg:max-w-none">
          <span className="relative block aspect-[4/3] w-full overflow-hidden bg-[var(--bg-soft)]">
            <Image src={hotel.photo} alt={"Supplier photograph of "+hotel.name} fill unoptimized
              sizes="(max-width:640px) 78vw, (max-width:1280px) 32vw, 24vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"/>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)]/95 px-2.5 py-1.5 text-xs font-bold text-[var(--text)]">
              <Star size={13} className="text-[var(--gold)]" aria-hidden="true"/>
              {hotel.stars}-star resort
            </span>
          </span>
          <span className="flex min-h-[195px] w-full flex-1 flex-col p-4">
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-soft)]">
              <MapPin size={13} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
              {hotel.area}, Maldives
            </span>
            <span className="mt-2 block min-h-[46px] text-base font-bold leading-6 text-[var(--text)]">
              {hotel.name}
            </span>
            <span className="mt-3 inline-flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
              <span className="rounded-md bg-[var(--gold)] px-2 py-1 font-black text-[var(--bg)]">
                {hotel.rating.toFixed(1)}
              </span>
              <span className="font-semibold">Superb</span>
              <span>· {hotel.reviews.toLocaleString("en")} supplier reviews</span>
            </span>
            <span className="mt-3 block text-xs leading-5 text-[var(--text-soft)]">
              Exact room rates, taxes and transfer charges are shown on the supplier booking page.
            </span>
            <span className="gth-btn-gold mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold">
              View this hotel <ArrowUpRight size={16} aria-hidden="true"/>
            </span>
          </span>
        </button>
      )}
    </div>
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">
      <ShieldCheck size={19} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
      <p>These are real Maldives properties and supplier-listed photos, IDs, star classifications
        and review scores — not illustrative hotel inventory. Prices and room availability depend on
        your exact dates and occupancy; confirm the tax-inclusive total, cancellation rules and
        boat or seaplane transfer costs on the selected hotel's booking page.</p>
    </div>
  </section>;
}
