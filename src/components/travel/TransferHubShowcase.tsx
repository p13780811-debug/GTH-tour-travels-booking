import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CarFront, Globe2, MapPin, ShieldCheck } from "lucide-react";
import TourCarousel from "@/components/tours/TourCarousel";
import TransferSpotlightImage from "./TransferSpotlightImage";
import {
  transferJourneyCategories,
  transferAirportSpotlights,
  transferSuppliers,
} from "@/lib/travel/transferHubCatalog";

/**
 * Reuse the same compact image-rail design as GTH PRO Tours/Activities,
 * without representing editorial destinations as supplier products.
 *
 * The existing transfer widgets are the ONLY live supplier searches.
 * External partner links are unchanged and always marked sponsored.
 */
export default function TransferHubShowcase() {
  const cardBase = "group flex w-[194px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--gold)] sm:w-[212px]";

  return (
    <div className="mb-9 min-w-0 space-y-10">
      <section id="transfer-discovery" aria-labelledby="transfer-categories-heading" className="scroll-mt-24">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              GTH PRO · Airport & ground travel
            </p>
            <h2 id="transfer-categories-heading" className="mt-1.5 text-xl font-bold sm:text-2xl">
              Pick a transfer experience
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-[var(--text-soft)]">
              Swipe through transfer types, then check real availability in the existing booking tools.
              These cards explain services, not supplier inventory or guaranteed vehicle classes.
            </p>
          </div>
          <a href="#transfer-provider-heading" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            Search transfers <ArrowRight size={16} aria-hidden="true" />
          </a>
        </header>
        <TourCarousel label="Airport transfer experiences">
          {transferJourneyCategories.map(item => (
            <article key={item.slug} className={cardBase}>
              <div className="relative h-[118px] w-full overflow-hidden bg-[var(--bg)]">
                <Image src={item.image} alt={item.imageAlt} fill
                  sizes="(max-width: 640px) 194px, 212px"
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex min-h-[207px] flex-1 flex-col p-3">
                <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--gold)]">
                  {item.tag}
                </p>
                <h3 className="mt-2 line-clamp-2 min-h-[38px] text-sm font-bold leading-5">{item.title}</h3>
                <p className="mt-1.5 line-clamp-3 text-xs leading-[18px] text-[var(--text-soft)]">{item.description}</p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[var(--text-soft)]">{item.check}</p>
                <a href="#transfer-provider-heading"
                  aria-label={`Explore ${item.title} in transfer search`}
                  className="gth-btn-gold mt-auto inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold">
                  Explore options <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </TourCarousel>
      </section>

      <section id="popular-airport-transfers" aria-labelledby="transfer-airports-heading" className="scroll-mt-24">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              <Globe2 size={14} aria-hidden="true" /> Destinations & airport pickups
            </p>
            <h2 id="transfer-airports-heading" className="mt-1.5 text-xl font-bold sm:text-2xl">
              Find transfers by destination
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-[var(--text-soft)]">
              These are city guides and airport reference points, not photographed cars
              available to book. Airport codes help you avoid selecting the wrong terminal or city.
            </p>
          </div>
          <Link href="/travel/airports"
            className="gth-glass inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
            Airport Explorer <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </header>

        <TourCarousel label="Airport transfer destinations">
          {transferAirportSpotlights.map(destination => (
            <article data-airport-code={destination.code} key={destination.code} className={cardBase}>
              <div className="relative h-[124px] w-full overflow-hidden bg-[var(--bg)]">
                <TransferSpotlightImage
                  src={destination.image}
                  alt={destination.imageAlt}
                  credit={destination.photoCredit}
                  creditUrl={destination.photoCreditUrl}
                  sizes="(max-width: 640px) 194px, 212px"
                />
                {!destination.photoCredit && (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">
                    Destination photo
                  </span>
                )}
              </div>
              <div className="flex min-h-[178px] flex-1 flex-col p-3">
                <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--gold)]">
                  <MapPin size={13} aria-hidden="true" /> {destination.code} · {destination.city}
                </p>
                <h3 className="mt-1.5 text-sm font-bold leading-5">Transfers in {destination.city}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-[17px] text-[var(--text-soft)]">
                  {destination.airport}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[var(--text-soft)]">{destination.note}</p>
                <div className="mt-auto flex flex-col gap-1.5 pt-3">
                  <a href="#transfer-provider-heading"
                    aria-label={`Search ${destination.city} transfer options`}
                    className="gth-btn-gold inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold">
                    Search transfers <ArrowRight size={14} aria-hidden="true" />
                  </a>
                  {destination.guideHref && (
                    <Link href={destination.guideHref}
                      className="inline-flex min-h-7 items-center justify-center text-[11px] font-semibold text-[var(--text-soft)] underline-offset-2 hover:underline">
                      Airport information
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </TourCarousel>
        <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
          Mumbai uses a credited photograph of its real airport terminal. Other city photographs
          show destination scenery, not their airport buildings. Verify available transfers and final
          prices inside the booking tool.
        </p>
      </section>

      <section id="transfer-partners" aria-labelledby="transfer-partners-heading" className="scroll-mt-24">
        <header className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Existing transfer booking services
          </p>
          <h2 id="transfer-partners-heading" className="mt-1.5 text-xl font-bold sm:text-2xl">
            Continue your transfer search
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-6 text-[var(--text-soft)]">
            Choose a service below. GTH PRO keeps the original embedded widgets and tracked
            booking links; payments and reservations remain with independent suppliers.
          </p>
        </header>

        <TourCarousel label="Airport transfer booking services">
          {transferSuppliers.map(supplier => (
            <article key={supplier.name} className={cardBase}>
              <div className="relative h-[114px] w-full overflow-hidden bg-[var(--bg)]">
                <Image src={supplier.image} alt={supplier.imageAlt} fill sizes="(max-width: 640px) 194px, 212px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex min-h-[194px] flex-1 flex-col p-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--gold)]">
                  <CarFront size={13} aria-hidden="true" /> Airport transfers
                </span>
                <h3 className="mt-2 text-sm font-bold">{supplier.name}</h3>
                <p className="mt-1.5 line-clamp-3 text-xs leading-[18px] text-[var(--text-soft)]">{supplier.description}</p>
                <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[var(--text-soft)]">{supplier.disclosure}</p>
                {supplier.external ? (
                  <a href={supplier.href} target="_blank" rel="noopener noreferrer sponsored"
                    aria-label={`${supplier.action} with ${supplier.name} (external booking)`}
                    className="gth-btn-gold mt-auto inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold">
                    {supplier.action} <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <a href={supplier.href} aria-label={`${supplier.action} with ${supplier.name}`}
                    className="gth-btn-gold mt-auto inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold">
                    {supplier.action} <ArrowRight size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </TourCarousel>
        <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true" />
          Affiliate disclosure: GTH PRO may earn a commission from eligible bookings.
          These images illustrate travel; they are not actual supplier products or guaranteed vehicles.
          Provider booking, support and payment terms apply.
        </p>
      </section>
    </div>
  );
}
