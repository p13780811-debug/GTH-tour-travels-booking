import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CarFront, CheckCircle2, Globe2, MapPin } from "lucide-react";
import {
  transferJourneyCategories,
  transferAirportSpotlights,
  transferSuppliers,
} from "@/lib/travel/transferHubCatalog";

/**
 * GTH PRO editorial discovery gallery. This is deliberately static, image-rich
 * and independent of any unapproved supplier inventory/API. Each CTA leads to
 * the already connected booking widgets or existing affiliate links.
 */
export default function TransferHubShowcase() {
  return (
    <div className="mb-10 min-w-0 space-y-12">
      <section id="transfer-discovery" aria-labelledby="transfer-categories-heading" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              GTH PRO · Visual transfer hub
            </p>
            <h2 id="transfer-categories-heading" className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
              See the ways you can travel
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              From a private airport pickup to family-size vehicles and shuttle services,
              discover transfer categories visually. Actual service types, vehicles and prices
              depend on your airport and the provider you select.
            </p>
          </div>
          <a href="#transfer-provider-heading"
            className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold">
            Compare providers <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {transferJourneyCategories.map(item => (
            <article key={item.slug}
              className="gth-glass group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)]">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--card)]">
                <Image src={item.image} alt={item.imageAlt} fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--gold)]">{item.tag}</span>
                <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{item.description}</p>
                <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {item.check}
                </p>
                <a href="#transfer-provider-heading"
                  aria-label={`Compare provider availability for ${item.title}`}
                  className="gold-text mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm font-semibold underline-offset-4 hover:underline">
                  Explore with transfer providers <ArrowRight size={16} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="popular-airport-transfers" aria-labelledby="transfer-airports-heading" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              <Globe2 size={16} aria-hidden="true" /> International travel
            </p>
            <h2 id="transfer-airports-heading" className="mt-2 text-2xl font-bold sm:text-3xl">
              Explore airport pickup destinations
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
              Find the right airport before you choose a pickup. These are destination guides
              and transfer search starting points—not live bookable offers or quoted fares.
            </p>
          </div>
          <Link href="/travel/airports"
            className="gth-glass inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold">
            All airports <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {transferAirportSpotlights.map(destination => (
            <article key={destination.code}
              className="gth-glass group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)]">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--card)]">
                <Image src={destination.image} alt={destination.imageAlt} fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--gold)]">
                  <MapPin size={14} aria-hidden="true" /> {destination.code} · {destination.city}
                </span>
                <h3 className="text-base font-bold leading-6">{destination.airport}</h3>
                <p className="text-xs leading-5 text-[var(--text-soft)]">{destination.note}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-xs font-semibold">
                  <a href="#transfer-provider-heading"
                    aria-label={`Compare transfer suppliers for ${destination.city} — ${destination.code}`}
                    className="gold-text inline-flex min-h-9 items-center gap-1 underline-offset-4 hover:underline">
                    Find transfers <ArrowRight size={14} aria-hidden="true" />
                  </a>
                  {destination.guideHref && (
                    <Link href={destination.guideHref} className="inline-flex min-h-9 items-center underline-offset-4 hover:underline">
                      Airport guide
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
          Destination images illustrate the cities, not a specific transfer vehicle or operator.
          Enter your exact pickup, date, passengers and hotel address in the provider search below.
        </p>
      </section>

      <section id="transfer-partners" aria-labelledby="transfer-partners-heading" className="scroll-mt-24">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">Already connected services</p>
          <h2 id="transfer-partners-heading" className="mt-2 text-2xl font-bold sm:text-3xl">
            Compare transfer booking partners
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
            Choose a supplier and check real options with them. The embedded Travelpayouts
            widgets and existing tracked affiliate links are preserved; GTH PRO does not
            create transfer bookings or collect partner payments.
          </p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {transferSuppliers.map(partner => (
            <article key={partner.name} className="gth-glass flex min-w-0 flex-col rounded-2xl border border-[var(--border)] p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
                <CarFront size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{partner.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-soft)]">{partner.description}</p>
              <span className="mt-3 text-xs font-medium text-[var(--text-soft)]">{partner.disclosure}</span>
              {partner.external ? (
                <a href={partner.href} target="_blank" rel="noopener noreferrer sponsored"
                  className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold">
                  {partner.action} <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              ) : (
                <a href={partner.href}
                  className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold">
                  {partner.action} <ArrowRight size={15} aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
          Supplier programs may show different vehicle classes, routes and inventory.
          Do not treat an illustration, airport listing or provider mention as a confirmed offer.
        </p>
      </section>
    </div>
  );
}
