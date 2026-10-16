import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, MapPin, Plane, Search, ShieldCheck } from "lucide-react";
import { searchTours, type TourFilters } from "@/lib/tours";
import TourAffiliateMarketplace from "@/components/tours/TourAffiliateMarketplace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/tours" },
  title: "Worldwide Tours, Activities & Attraction Tickets | GTH PRO Travel",
  description: "Find global tours, attraction tickets, city passes, audio tours and activities with independent booking partners and source-backed GTH PRO records.",
  openGraph: { title: "GTH PRO Tours & Activities", description: "Explore international tours and experiences, with provider-verified bookings.", url: "/tours", type: "website", images: ["/images/mega/tours.jpg"] },
  twitter: { card: "summary_large_image", title: "GTH PRO Tours & Activities", images: ["/images/mega/tours.jpg"] },
};

type Props = { searchParams: Promise<TourFilters> };

function priceLabel(value: number | null, code: string | null): string {
  if (!value || !code) return "Confirm price with provider";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency", currency: code, maximumFractionDigits: 0,
    }).format(value) + " • listed";
  } catch {
    return "Confirm price with provider";
  }
}

export default async function ToursPage({ searchParams }: Props) {
  const filters = await searchParams;
  const response = await searchTours(filters);
  const tours = response.items.slice().sort((a, b) =>
    (a.price_numeric ?? Infinity) - (b.price_numeric ?? Infinity) ||
    a.title.localeCompare(b.title)
  );

  const links = [
    { href: "/flights", label: "Flights", Icon: Plane },
    { href: "/hotels", label: "Hotels", Icon: MapPin },
    { href: "/destinations", label: "Destinations", Icon: Compass },
    { href: "/guides", label: "Travel guides", Icon: BookOpen },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 -z-10">
          <Image src="/images/mega/tours.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-[var(--bg)]/75" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">GTH PRO • Global experiences</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-6xl">Tours & activities for curious travelers</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-soft)] md:text-base">
            Browse available experience listings. Confirm dates, inclusions, meeting points, refund rules and final pricing with your booking provider.
          </p>
          <nav aria-label="Explore more travel services" className="mt-6 flex flex-wrap gap-2">
            {links.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                <Icon size={15} /> {label}
              </Link>
            ))}
          </nav>
          <form action="/tours" method="GET" className="gth-glass mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border)] p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div>
              <label htmlFor="city" className="mb-2 block text-xs font-semibold">City / destination</label>
              <input id="city" name="city" maxLength={80} placeholder="e.g. Dubai" defaultValue={filters.city || ""}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)]" />
            </div>
            <div>
              <label htmlFor="minPrice" className="mb-2 block text-xs font-semibold">Min listed price</label>
              <input id="minPrice" name="minPrice" type="number" min="0" max="100000000" step="1"
                defaultValue={filters.minPrice || ""} placeholder="Optional"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)]" />
            </div>
            <div>
              <label htmlFor="maxPrice" className="mb-2 block text-xs font-semibold">Max listed price</label>
              <input id="maxPrice" name="maxPrice" type="number" min="0" max="100000000" step="1"
                defaultValue={filters.maxPrice || ""} placeholder="Optional"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)]" />
            </div>
            <div>
              <label htmlFor="category" className="mb-2 block text-xs font-semibold">Category</label>
              <input id="category" name="category" type="text" maxLength={40}
                defaultValue={filters.category || ""} placeholder="Optional"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)]" />
            </div>
            <button type="submit" className="gth-btn-gold mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
              <Search size={17} /> Search
            </button>
          </form>
        </div>
      </section>

      <TourAffiliateMarketplace />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold md:text-3xl">Discover experiences</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Showing {tours.length} available database listings (maximum 48 per search).
            </p>
          </div>
          <Link href="/tours" className="text-sm underline">Clear filters</Link>
        </div>

        {response.error && (
          <div role="alert" className="gth-glass mb-6 rounded-2xl border border-[var(--border)] p-6">
            {response.status === 400 ? "Some search filters are invalid. Please check your values." : "Tours could not be loaded at the moment."}
          </div>
        )}
        {!response.error && tours.length === 0 && (
          <div role="status" className="gth-glass rounded-2xl border border-[var(--border)] p-8">
            <h3 className="font-bold">No matching tour listings found</h3>
            <p className="mt-2 text-sm text-[var(--text-soft)]">Try a different city or clear your filters. Lack of a listing does not mean all tours are sold out.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => (
            <article key={String(tour.id)} className="gth-glass min-w-0 overflow-hidden rounded-2xl border border-[var(--border)]">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={tour.image_url} loading="lazy" alt={tour.title} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-[var(--text-soft)]">
                    {tour.city || tour.city_slug.replaceAll("-", " ")}
                    {tour.country ? ` • ${tour.country}` : ""}
                    {tour.category ? ` • ${tour.category}` : ""}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-bold">{tour.title}</h3>
                </div>
                {tour.rating !== null && (
                  <p className="text-xs text-[var(--text-soft)]">Source-listed rating: {tour.rating} / 5 (verify with partner)</p>
                )}
                <p className="text-xl font-bold">{priceLabel(tour.price_numeric, tour.currency)}</p>
                <p className="text-xs leading-5 text-[var(--text-soft)]">This is not a live date-specific quote. Verify all charges and availability with the partner.</p>
                <Link href={`/tours/${encodeURIComponent(String(tour.id))}`}
                  className="gth-btn-gold inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  View experience <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--border)] p-5 text-sm text-[var(--text-soft)]">
          <ShieldCheck size={18} className="mt-1 shrink-0" aria-hidden="true" />
          <p>All experiences are subject to provider confirmation. Tour dates, passenger prices, safety requirements, availability, cancellation and refunds depend on the tour operator and their booking partner.</p>
        </div>
      </section>
    </main>
  );
}
