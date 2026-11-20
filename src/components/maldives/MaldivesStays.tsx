import Image from "next/image";
import {ArrowRight,Hotel,MapPin,ShieldCheck} from "lucide-react";
import NuiteeHotelsListWidget from "@/components/hotel/NuiteeHotelsListWidget";

const islandGuides=[
  {
    name:"Malé & North Malé Atoll",
    detail:"Start near Velana International Airport (MLE), then compare resort-island access and the correct transfer pier.",
    image:"https://images.pexels.com/photos/27099923/pexels-photo-27099923.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt:"Genuine Maldives aerial photograph of an island and overwater accommodation",
    credit:"Asad Photo Maldives / Pexels",
  },
  {
    name:"South Malé Atoll",
    detail:"Explore island stays and check whether the resort arranges a scheduled speedboat or private transfer.",
    image:"https://images.pexels.com/photos/28843953/pexels-photo-28843967.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt:"Genuine Maldives overwater villa photographed from above",
    credit:"Asad Photo Maldives / Pexels",
  },
  {
    name:"Baa & Ari Atolls",
    detail:"Explore longer island journeys; seaplane and domestic-air transfers depend on the exact resort and time.",
    image:"https://images.pexels.com/photos/36661719/pexels-photo-28843928.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt:"Maldives overwater bungalows and clear calm ocean at dusk",
    credit:"Asad Photo Maldives / Pexels",
  },
] as const;

/** Supplier HotelList is exactly the homepage component, never a fabricated resort card. */
export default function MaldivesStays({placeId}:{placeId:string|null}){
  return <section id="maldives-stays" aria-labelledby="maldives-stays-title"
    className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:py-16">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--gold)]">
          <Hotel size={16} aria-hidden="true"/> GTH Worldwide Stays
        </p>
        <h2 id="maldives-stays-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Island escapes & overwater horizons</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          Explore Malé, North Malé, South Malé, Baa and Ari Atolls. Confirm resort location,
          the final all-inclusive total, cancellation rules and mandatory boat or seaplane costs with the supplier.
        </p>
      </div>
      <button type="submit" form="maldives-elite-stay-search"
        className="gth-btn-gold inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold">
        Browse all Maldives stays <ArrowRight size={16} aria-hidden="true"/>
      </button>
    </div>
    {placeId ? <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <p className="mb-3 text-xs text-[var(--text-soft)]">Real supplier hotel photo cards · verify total prices and taxes for your dates with the booking provider.</p>
      <NuiteeHotelsListWidget id="gth-maldives-elite-supplier-list" placeId={placeId}
        placeLabel="Maldives" rows={2} currency="USD"/>
    </div> : <div role="status" className="mt-6 flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)]">
      <ShieldCheck size={20} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
      <p>The supplier has not yet provided a verified Maldives Place ID in our destination record.
        We therefore do not display Mumbai hotels or invent resort photos, star ratings or tax-inclusive prices.
        The search above keeps Maldives and your stay details in our existing verified supplier destination picker.</p>
    </div>}
    <div role="region" aria-label="Explore Maldives island regions — swipe for more" tabIndex={0}
      className="mt-6 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible">
      {islandGuides.map(region=><article key={region.name}
        className="flex w-[78vw] max-w-[340px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] lg:w-full lg:max-w-none">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-soft)]">
          <Image src={region.image} alt={region.alt} fill sizes="(max-width:640px) 78vw, (max-width:1024px) 38vw, 370px"
            className="object-cover transition-transform duration-500 hover:scale-105"/>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="inline-flex items-center gap-1 text-xs font-bold text-[var(--gold)]"><MapPin size={13} aria-hidden="true"/> Maldives · Atoll guide</p>
          <h3 className="mt-2 text-lg font-semibold">{region.name}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-soft)]">{region.detail}</p>
          <p className="mt-3 text-[11px] leading-5 text-[var(--text-soft)]">{region.credit} · area illustration, not a bookable property</p>
          <button type="submit" form="maldives-elite-stay-search"
            className="gth-btn mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold">
            Search island stays <ArrowRight size={15} aria-hidden="true"/>
          </button>
        </div>
      </article>)}
    </div>
    <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
      Editorial photography is not a property listing. Supplier-specific images, amenities, tax-inclusive total prices
      and hotel-level booking links appear only after a confirmed supplier match.
    </p>
  </section>;
}
