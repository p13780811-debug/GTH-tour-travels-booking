import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Compass, Home, LayoutGrid, List, MapPin, Plane, RotateCcw, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { searchTours, type TourFilters, type PublicTour } from "@/lib/tours";
import TourAffiliateMarketplace from "@/components/tours/TourAffiliateMarketplace";
import OpenAttractionsRail from "@/components/travel/OpenAttractionsRail";
import OSMAttractionsRail from "@/components/travel/OSMAttractionsRail";
import {destinationGeography} from "@/lib/destinations/geography";
import TourCarousel from "@/components/tours/TourCarousel";
import {listMappedCities} from "@/lib/travel/mappedCities";
import MappedCityDiscovery from "@/components/travel/MappedCityDiscovery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/tours" },
  title: "Worldwide Tours, Activities & Attraction Tickets | GTH PRO Travel",
  description: "Find global tours, attraction tickets, city passes, audio tours and activities with independent booking partners and source-backed GTH PRO records.",
  openGraph: { title: "GTH PRO Tours & Activities", description: "Explore international tours and experiences, with provider-verified bookings.", url: "/tours", type: "website", images: ["/images/mega/tours.jpg"] },
  twitter: { card: "summary_large_image", title: "GTH PRO Tours & Activities", images: ["/images/mega/tours.jpg"] },
};

type ExplorerView = "rail" | "grid" | "list";
type ExplorerSort = "price" | "name" | "rating";
type TourParams = TourFilters & { view?: string | string[]; sort?: string | string[] };
type Props = { searchParams: Promise<TourParams> };

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

/** Visual controls never change the validated server-side tour search contract. */
function tourUrl(filters: TourFilters, sort: ExplorerSort, view: ExplorerView, change?: {
  field: "sort" | "view"; value: string;
}): string {
  const query = new URLSearchParams();
  for (const field of ["city", "category", "minPrice", "maxPrice"] as const) {
    const value = filters[field];
    if (typeof value === "string" && value.trim()) query.set(field, value.trim());
  }
  const nextSort = change?.field === "sort" ? change.value : sort;
  const nextView = change?.field === "view" ? change.value : view;
  if (nextSort !== "price") query.set("sort", nextSort);
  if (nextView !== "rail") query.set("view", nextView);
  const suffix = query.toString();
  return "/tours" + (suffix ? "?" + suffix : "") + "#discover";
}

function TourFilterForm({ filters, sort, view }: {
  filters: TourFilters; sort: ExplorerSort; view: ExplorerView;
}) {
  return (
    <form action="/tours#discover" method="GET" role="search" aria-label="Refine tour results" className="space-y-4">
      {sort !== "price" && <input type="hidden" name="sort" value={sort} />}
      {view !== "rail" && <input type="hidden" name="view" value={view} />}
      <label htmlFor="tour-filter-city" className="block text-xs font-semibold">
        City / destination
        <input id="tour-filter-city" name="city" maxLength={80}
          defaultValue={typeof filters.city === "string" ? filters.city : ""} placeholder="e.g. Dubai"
          className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]" />
      </label>
      <label htmlFor="tour-filter-category" className="block text-xs font-semibold">
        Category
        <input id="tour-filter-category" name="category" maxLength={40}
          defaultValue={typeof filters.category === "string" ? filters.category : ""}
          placeholder="e.g. city-tour"
          className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]" />
      </label>
      <fieldset>
        <legend className="text-xs font-semibold">Listed price range</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label htmlFor="tour-filter-min" className="block text-[11px] text-[var(--text-soft)]">
            Minimum
            <input id="tour-filter-min" name="minPrice" type="number" min="0" max="100000000" step="1"
              defaultValue={typeof filters.minPrice === "string" ? filters.minPrice : ""}
              placeholder="Any" className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--text)]" />
          </label>
          <label htmlFor="tour-filter-max" className="block text-[11px] text-[var(--text-soft)]">
            Maximum
            <input id="tour-filter-max" name="maxPrice" type="number" min="0" max="100000000" step="1"
              defaultValue={typeof filters.maxPrice === "string" ? filters.maxPrice : ""}
              placeholder="Any" className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2 text-sm text-[var(--text)]" />
          </label>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[var(--text-soft)]">
          Price values use each listing's own currency. Final supplier prices may differ.
        </p>
      </fieldset>
      <div className="flex items-center gap-2">
        <button type="submit" className="gth-btn-gold inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold">
          <Search size={15} aria-hidden="true" /> Apply filters
        </button>
        <Link href="/tours#discover" aria-label="Reset all tour filters"
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold">
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </Link>
      </div>
    </form>
  );
}

function TourListingCard({ tour, view }: { tour: PublicTour; view: ExplorerView }) {
  const isRail = view === "rail";
  const isList = view === "list";
  return (
    <article className={
      "gth-glass group flex min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-sm transition-shadow hover:shadow-md " +
      (isRail ? "w-[190px] shrink-0 snap-start flex-col sm:w-[216px]" :
       isList ? "w-full flex-col sm:flex-row" : "w-full flex-col")
    }>
      <div className={
        "relative shrink-0 overflow-hidden bg-[var(--bg-soft)] " +
        (isRail ? "h-[116px] w-full sm:h-[128px]" :
         isList ? "h-44 w-full sm:h-auto sm:w-[200px]" : "h-44 w-full sm:h-48")
      }>
        <img src={tour.image_url} width="432" height="270" loading="lazy" decoding="async"
          alt={tour.title} className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.025]" />
        <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
          {tour.category || "Tour listing"}
        </span>
      </div>
      <div className={"flex min-w-0 flex-1 flex-col " + (isRail ? "min-h-[172px] p-3" : "p-4")}>
        <p className="line-clamp-1 text-[11px] text-[var(--text-soft)]">
          {tour.city || tour.city_slug.replaceAll("-", " ")}
          {tour.country ? " • " + tour.country : ""}
        </p>
        <h3 className={"mt-1.5 line-clamp-2 font-bold leading-snug " + (isRail ? "min-h-[35px] text-[13px]" : "text-base")}>
          {tour.title}
        </h3>
        {tour.rating !== null && (
          <p className="mt-2 text-[11px] text-[var(--text-soft)]">Source rating: {tour.rating}/5 · confirm with provider</p>
        )}
        <div className="mt-auto pt-4">
          <p className={"font-bold " + (isRail ? "text-[13px]" : "text-sm")}>{priceLabel(tour.price_numeric, tour.currency)}</p>
          <Link href={"/tours/" + encodeURIComponent(String(tour.id))}
            className="gth-btn-gold mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold">
            View tour <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function ToursPage({ searchParams }: Props) {
  const { view: rawView, sort: rawSort, ...filters } = await searchParams;
  const view: ExplorerView = rawView === "grid" || rawView === "list" ? rawView : "rail";
  const sort: ExplorerSort = rawSort === "name" || rawSort === "rating" ? rawSort : "price";
  const activeCity = typeof filters.city === "string" ? filters.city.trim() : "";
  const [response, cityData] = await Promise.all([
    searchTours(filters), listMappedCities({pageSize:48}).catch(() => null),
  ]);
  // Sorting is deliberately scoped to the 48 returned records, not a claim of global best prices.
  const tours = response.items.slice().sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1) || a.title.localeCompare(b.title);
    return (a.price_numeric ?? Infinity) - (b.price_numeric ?? Infinity) || a.title.localeCompare(b.title);
  });

  const links = [
    { href: "/flights", label: "Flights", Icon: Plane },
    { href: "/hotels", label: "Hotels", Icon: MapPin },
    { href: "/destinations", label: "Destinations", Icon: Compass },
    { href: "/guides", label: "Travel guides", Icon: BookOpen },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="relative isolate overflow-hidden border-b border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:items-center lg:py-12">
          <div className="min-w-0">
            <nav aria-label="Tours breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-[var(--text-soft)]">
              <Link href="/mega-aggregator" className="inline-flex items-center gap-1 hover:underline"><Home size={14} /> Home</Link>
              <span aria-hidden="true">/</span><span aria-current="page">Tours Explorer</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">GTH PRO • Global experiences</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Find your next experience. Know the details.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-soft)] sm:text-base">
              Discover tours, attraction tickets and local experiences from source-backed listings. Compare the available information and confirm dates, inclusions and final prices with the booking provider.
            </p>
            <form action="/tours#discover" method="GET" role="search" aria-label="Quick tour city search"
              className="mt-6 flex max-w-xl flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm sm:flex-row">
              {typeof filters.category === "string" && filters.category && <input type="hidden" name="category" value={filters.category} />}
              {typeof filters.minPrice === "string" && filters.minPrice && <input type="hidden" name="minPrice" value={filters.minPrice} />}
              {typeof filters.maxPrice === "string" && filters.maxPrice && <input type="hidden" name="maxPrice" value={filters.maxPrice} />}
              {sort !== "price" && <input type="hidden" name="sort" value={sort} />}
              {view !== "rail" && <input type="hidden" name="view" value={view} />}
              <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <Search size={18} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true" />
                <span className="sr-only">Search destination city</span>
                <input type="search" name="city" maxLength={80} defaultValue={activeCity}
                  placeholder="Search a destination, e.g. Dubai"
                  className="min-h-11 w-full min-w-0 bg-transparent text-sm text-[var(--text)] outline-none" />
              </label>
              <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold">
                Explore <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-soft)]">
              <span className="inline-flex items-center gap-1"><BadgeCheck size={15} /> Source-aware listings</span>
              <span className="inline-flex items-center gap-1"><Compass size={15} /> Global tour discovery</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck size={15} /> Provider-confirmed bookings</span>
            </div>
          </div>
          <div className="relative hidden min-h-[270px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm lg:block">
            <Image src="/images/mega/tours.jpg" alt="Illustrative global travel experience scenery" fill priority
              sizes="(max-width: 1280px) 36vw, 440px" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-16 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Explore with context</p>
              <p className="mt-1 text-sm">Tour discovery • independent booking partners</p>
            </div>
          </div>
        </div>
      </section>

      <TourAffiliateMarketplace />

      <section id="discover" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-9 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Your research, in focus</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Discover experiences</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              {response.error ? "Tour catalog could not be loaded" :
                "Showing " + tours.length + " database listings (maximum 48 per search)."}
            </p>
          </div>
          <Link href="/tours#discover" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold">
            <RotateCcw size={15} aria-hidden="true" /> Clear filters
          </Link>
        </div>

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside aria-label="Tours Explorer sidebar" className="min-w-0">
            <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 lg:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-bold">
                <SlidersHorizontal size={18} /> Refine your search <span className="ml-auto text-xs font-normal text-[var(--text-soft)]">Show filters</span>
              </summary>
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <TourFilterForm filters={filters} sort={sort} view={view} />
              </div>
            </details>
            <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:sticky lg:top-28 lg:block">
              <p className="inline-flex items-center gap-2 text-base font-bold"><SlidersHorizontal size={17} /> Refine your search</p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">Filter the current catalog without changing booking services.</p>
              <div className="mt-5"><TourFilterForm filters={filters} sort={sort} view={view} /></div>
              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Explore GTH PRO</p>
                <nav aria-label="Tours Explorer quick navigation" className="mt-3 flex flex-col gap-1 text-xs">
                  <Link href="/mega-aggregator" className="rounded-lg px-2 py-2 hover:bg-[var(--bg)]">Home</Link>
                  <Link href="/tours" aria-current="page" className="rounded-lg border border-[var(--gold)] bg-[var(--bg)] px-2 py-2 font-bold">Tours Explorer</Link>
                  <Link href="/activities" className="rounded-lg px-2 py-2 hover:bg-[var(--bg)]">Activities</Link>
                  <Link href="/attractions" className="rounded-lg px-2 py-2 hover:bg-[var(--bg)]">Attractions</Link>
                  <Link href="/hotels" className="rounded-lg px-2 py-2 hover:bg-[var(--bg)]">Hotels</Link>
                  <Link href="/flights" className="rounded-lg px-2 py-2 hover:bg-[var(--bg)]">Flights</Link>
                </nav>
              </div>
              <div className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-soft)]">
                <p className="inline-flex items-center gap-2 font-semibold text-[var(--text)]"><ShieldCheck size={15} /> Booking standards</p>
                <p className="mt-2">Source listings are research references, not confirmed availability or tickets. Check all details with the supplier.</p>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
              <div>
                <p className="text-sm font-bold">Tour discovery</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">Sort only the records returned by this search.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <nav aria-label="Sort tour listings" className="flex flex-wrap gap-1">
                  {([{ value: "price", label: "Price" }, { value: "name", label: "Name" }, { value: "rating", label: "Rating" }] as const).map(option => (
                    <Link key={option.value} href={tourUrl(filters, sort, view, {field:"sort",value:option.value})}
                      aria-current={sort === option.value ? "page" : undefined}
                      className={"inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-semibold " +
                        (sort === option.value ? "border-[var(--gold)] bg-[var(--bg)]" : "border-[var(--border)] text-[var(--text-soft)]")}>
                      {option.label}
                    </Link>
                  ))}
                </nav>
                <nav aria-label="Tour listing view" className="flex items-center gap-1 rounded-xl border border-[var(--border)] p-1">
                  <Link href={tourUrl(filters, sort, view, {field:"view",value:"rail"})} aria-current={view === "rail" ? "page" : undefined}
                    aria-label="Horizontal card rail"
                    className={"inline-flex h-9 w-9 items-center justify-center rounded-lg " + (view === "rail" ? "bg-[var(--bg)]" : "")}>
                    <Compass size={16} />
                  </Link>
                  <Link href={tourUrl(filters, sort, view, {field:"view",value:"grid"})} aria-current={view === "grid" ? "page" : undefined}
                    aria-label="Grid view"
                    className={"inline-flex h-9 w-9 items-center justify-center rounded-lg " + (view === "grid" ? "bg-[var(--bg)]" : "")}>
                    <LayoutGrid size={16} />
                  </Link>
                  <Link href={tourUrl(filters, sort, view, {field:"view",value:"list"})} aria-current={view === "list" ? "page" : undefined}
                    aria-label="List view"
                    className={"inline-flex h-9 w-9 items-center justify-center rounded-lg " + (view === "list" ? "bg-[var(--bg)]" : "")}>
                    <List size={16} />
                  </Link>
                </nav>
              </div>
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
            {tours.length > 0 && (
              view === "rail" ? (
                <TourCarousel label="Source-backed tour listings">
                  {tours.map(tour => <TourListingCard key={String(tour.id)} tour={tour} view={view} />)}
                </TourCarousel>
              ) : (
                <div aria-label="Source-backed tour listings" className={
                  view === "grid" ? "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex min-w-0 flex-col gap-4"
                }>
                  {tours.map(tour => <TourListingCard key={String(tour.id)} tour={tour} view={view} />)}
                </div>
              )
            )}
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[var(--border)] p-5 text-xs leading-6 text-[var(--text-soft)]">
              <ShieldCheck size={18} className="mt-1 shrink-0" aria-hidden="true" />
              <p>Tour dates, passenger prices, meeting points, safety requirements, availability, cancellation and refunds depend on the operator and booking partner. Currency amounts are not converted for comparisons.</p>
            </div>
          </div>
        </div>
      </section>

      <MappedCityDiscovery cities={cityData?.items??[]} title="Discover tours through more mapped cities"/>
      <OSMAttractionsRail region={activeCity && ["goa", "panaji", "margao"].includes(activeCity.toLowerCase()) ? "goa" : undefined}
        countryName={activeCity ? destinationGeography(activeCity.toLowerCase()).country : null} city={activeCity || null} />
      {(!activeCity || ["goa", "panaji", "margao"].includes(activeCity.toLowerCase())) && <OpenAttractionsRail region="goa" />}
      {(!activeCity || ["mumbai", "pune", "shirdi", "ajanta-ellora"].includes(activeCity.toLowerCase())) && <OpenAttractionsRail region="maharashtra" />}

      <nav aria-label="Explore more travel services" className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-10 sm:px-6">
        {links.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="gth-glass inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold">
            <Icon size={15} aria-hidden="true" /> {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
