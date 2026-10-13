import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Compass, Globe2, Hotel, MapPin, Plane, Search, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { destinations as curatedDestinations } from "@/data/destinations";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Global Destinations & Travel Discovery | GTH PRO",
  description: "Explore curated destinations, city guides, stays and travel experiences with GTH PRO. Confirm live inventory and prices with each booking provider.",
  alternates: { canonical: "/destinations" },
  openGraph: { title: "Global Destinations | GTH PRO", description: "A premium destination discovery gateway connecting travel inspiration to source-backed hotel and tour discovery.", type: "website" },
};

type Destination = { slug: string; title: string; image: string; description: string; location: string };
type Props = { searchParams: Promise<{ search?: string | string[]; page?: string | string[] }> };
const perPage = 18;
const featured = ["dubai", "paris", "bali", "maldives"];

const palette = {
  "--bg": "#061426",
  "--text": "#f6f8fe",
  "--text-soft": "#c0ccdd",
  "--text-muted": "#9caec5",
  "--border": "rgba(233,194,112,.24)",
  "--card": "rgba(9,26,45,.88)",
  "--card-strong": "#08182b",
  "--gold": "#eac671",
} as CSSProperties;

function pageLink(search: string, page: number) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return "/destinations" + (query ? "?" + query : "") + "#discover";
}

async function loadDestinations(): Promise<Destination[]> {
  const base: Destination[] = curatedDestinations.map((item) => ({
    slug: item.slug,
    title: item.name,
    image: item.image_url,
    description: item.description,
    location: "Editorial destination guide",
  }));
  const all = new Map(base.map((item) => [item.slug, item]));
  try {
    const { data, error } = await supabase.from("destinations")
      .select("name,slug,description").order("name", { ascending: true }).limit(200);
    if (!error && data) for (const item of data) {
      if (typeof item.slug !== "string" || !/^[a-z]+(?:-[a-z]+)*$/.test(item.slug) || item.slug.length > 80
        || typeof item.name !== "string" || !item.name.trim()) continue;
      const previous = all.get(item.slug);
      all.set(item.slug, {
        slug: item.slug,
        title: item.name.trim().slice(0, 120),
        image: previous?.image || "/images/default-city.jpg",
        location: "Global destination guide",
        description: typeof item.description === "string" && item.description.trim()
          ? item.description.trim().slice(0, 280)
          : previous?.description || "Explore local highlights and verify current travel details with official providers.",
      });
    }
  } catch {
    // Curated editorial guides remain available during data-provider outages.
  }
  return [...all.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export default async function DestinationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = (typeof params.search === "string" ? params.search : "").trim().slice(0, 70);
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const requestedPage = /^[1-9]\d{0,3}$/.test(rawPage) ? Number(rawPage) : 1;
  const allDestinations = await loadDestinations();
  const selected = search.toLowerCase();
  const filtered = selected
    ? allDestinations.filter((item) => [item.title, item.slug, item.description].some((value) => value.toLowerCase().includes(selected)))
    : allDestinations;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const page = Math.min(requestedPage, pages);
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const featuredDestinations = featured.map((slug) => allDestinations.find((item) => item.slug === slug)).filter((item): item is Destination => Boolean(item));

  return (
    <main style={palette} className="min-h-screen bg-[#061426] text-[#f6f8fe]">
      <section className="relative isolate overflow-hidden border-b border-[#eac671]/25">
        <Image src="/images/global-city.jpg" alt="" fill priority sizes="100vw" className="absolute -z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020b1c]/95 via-[#061426]/90 to-[#071b33]/65" />
        <div className="mx-auto grid max-w-[1400px] items-center gap-9 px-5 py-16 sm:px-8 md:py-20 lg:min-h-[570px] lg:grid-cols-[1.15fr_.85fr] lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eac671]/45 bg-[#051426]/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[.17em] text-[#f4d58a]">
              <Globe2 size={15} /> GTH PRO / Global Travel Discovery
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl lg:text-[62px]">
              The world is yours <span className="text-[#efd087]">to discover.</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[#d2dceb] sm:text-base">
              Explore destination stories, connect with source-backed hotel and tour listings, and plan every journey with more confidence.
            </p>
            <form role="search" action="/destinations" method="get" className="mt-8 flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-[#eac671]/35 bg-[#041326]/90 p-3 shadow-[0_16px_45px_rgba(0,0,0,.32)] sm:flex-row">
              <label htmlFor="destination-search" className="sr-only">Search global destinations</label>
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3">
                <Search size={20} className="shrink-0 text-[#eac671]" />
                <input id="destination-search" name="search" type="search" defaultValue={search}
                  placeholder="Search a city, country or travel theme" maxLength={70}
                  className="min-h-12 w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[#afc0d5] focus-visible:outline-none" />
              </div>
              <button type="submit" className="gth-btn-gold inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold">
                Discover <ArrowRight size={16} />
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-[#d2dceb]">
              <span className="flex items-center gap-2"><Compass size={16} className="text-[#eac671]" /> Curated guides</span>
              <span className="flex items-center gap-2"><Hotel size={16} className="text-[#eac671]" /> Hotel discovery</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#eac671]" /> Verified booking handoff</span>
            </div>
          </div>
          <div className="grid h-[250px] grid-cols-2 gap-3 sm:h-[325px] lg:h-[385px]">
            {featuredDestinations.slice(0, 4).map((item, index) => (
              <Link href={"/destinations/" + item.slug} key={item.slug}
                className={"group relative overflow-hidden rounded-2xl border border-[#eac671]/35 bg-[#0b2038] shadow-[0_15px_32px_rgba(0,0,0,.25)] " + (index % 2 === 0 ? "translate-y-0" : "translate-y-3")}>
                <Image src={item.image} alt={item.title} fill sizes="(max-width: 1024px) 42vw, 20vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#031021]/95 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 text-sm font-semibold tracking-wide text-white sm:text-lg">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="discover" className="mx-auto max-w-[1400px] scroll-mt-16 px-5 py-12 sm:px-8 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#eac671]"><Sparkles size={15} /> Global Collection</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Destinations worth exploring</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c0ccdd]">
              {search ? "Matching destinations for your search." : "Editorial inspiration from across the globe."} Booking and live availability are confirmed by partners.
            </p>
          </div>
          <div className="rounded-full border border-[#eac671]/30 px-4 py-2 text-xs text-[#dbe3f2]" role="status">
            {filtered.length} {filtered.length === 1 ? "destination" : "destinations"}
          </div>
        </div>

        {visible.length ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            {visible.map((destination, index) => (
              <Link href={"/destinations/" + destination.slug} key={destination.slug}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eac671]/25 bg-[#0c2037] shadow-[0_10px_30px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-1 hover:border-[#efd087]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#efd087]">
                <div className="relative h-[230px] overflow-hidden sm:h-[250px] xl:h-[280px]">
                  <Image src={destination.image} alt={destination.title} fill loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061426]/90 via-transparent to-transparent" />
                  <span className="absolute bottom-4 left-5 flex items-center gap-2 text-xs font-semibold text-[#ffdb89]"><MapPin size={15} /> Destination {String((page - 1) * perPage + index + 1).padStart(2, "0")}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-2xl font-semibold leading-tight text-white">{destination.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#c2cfdf]">{destination.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#efd087]">Explore destination <ArrowRight size={16} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div role="status" className="mt-8 rounded-2xl border border-[#eac671]/30 bg-[#10223a] p-10 text-center">
            <p className="text-lg font-semibold">No matching destinations yet</p>
            <p className="mt-3 text-sm text-[#c0ccdd]">Try another city or explore the full collection.</p>
            <Link href="/destinations#discover" className="mt-5 inline-flex items-center gap-2 text-[#efd087] underline">View all destinations <ArrowRight size={16} /></Link>
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Destination pages" className="mt-9 flex flex-wrap items-center justify-center gap-3 text-sm">
            {page > 1 ? <Link href={pageLink(search, page - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-4 text-[#f7e0aa]"><ChevronLeft size={16} /> Previous</Link> : null}
            <span className="px-3 text-[#d1dcee]">Page {page} of {pages}</span>
            {page < pages ? <Link href={pageLink(search, page + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-4 text-[#f7e0aa]">Next <ChevronRight size={16} /></Link> : null}
          </nav>
        )}
      </section>

      <section className="border-t border-[#eac671]/20 bg-[#041021]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.17em] text-[#eac671]">Plan with confidence</p>
            <h2 className="mt-2 text-2xl font-semibold">Go from inspiration to a real itinerary.</h2>
            <p className="mt-2 text-sm text-[#c0ccdd]">Browse live provider links where available; final prices, entry rules and availability require independent confirmation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/hotels" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"><Hotel size={17} /> Find Hotels</Link>
            <Link href="/flights" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-5 text-sm text-[#ffe2a2]"><Plane size={17} /> Compare Flights</Link>
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-5 text-sm text-[#ffe2a2]"><BookOpen size={17} /> Travel Guides</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
