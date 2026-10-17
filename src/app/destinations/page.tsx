import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Compass, Globe2, Hotel, Plane, Search, ShieldCheck, Sparkles } from "lucide-react";
import DestinationCard from "@/components/destination/DestinationCard";
import { supabase } from "@/lib/supabase";
import { destinations as curatedDestinations, destinationImageForSlug } from "@/data/destinations";
import { destinationGeography } from "@/lib/destinations/geography";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Global Destinations & Travel Discovery | GTH PRO",
  description: "Explore curated destinations, city guides, stays and travel experiences with GTH PRO. Confirm live inventory and prices with each booking provider.",
  alternates: { canonical: "/destinations" },
  openGraph: { title: "Global Destinations | GTH PRO", description: "Explore destinations with travel guides and source-backed hotel and tour discovery.", type: "website", url: "/destinations", images: ["/images/global-city.jpg"] },
  twitter: { card: "summary_large_image", title: "Global Destinations | GTH PRO", images: ["/images/global-city.jpg"] },
};

type Destination = { slug: string; title: string; image: string; description: string; location: string; country: string | null; region: string | null };
type Props = { searchParams: Promise<{ search?: string | string[]; page?: string | string[]; country?: string | string[]; region?: string | string[]; sort?: string | string[] }> };
const perPage = 18;
const featured = ["dubai", "paris", "bali", "maldives"];

function pageLink(search: string, page: number, country = "", region = "", sort = "name") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (country) params.set("country", country);
  if (region) params.set("region", region);
  if (sort !== "name") params.set("sort", sort);
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
    ...destinationGeography(item.slug),
  }));
  const all = new Map(base.map((item) => [item.slug, item]));
  try {
    // Read real published catalogue rows in bounded batches; no page-size 200 truncation.
    // Never surface inactive records or assume every DB location has licensed media.
    for (let offset = 0; offset < 1200; offset += 200) {
      const { data, error } = await supabase.from("destinations")
        .select("name,slug,description,country")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .range(offset, offset + 199);
      if (error || !data) break;
      for (const item of data) {
      if (typeof item.slug !== "string" || !/^[a-z]+(?:-[a-z]+)*$/.test(item.slug) || item.slug.length > 80
        || typeof item.name !== "string" || !item.name.trim()) continue;
      const previous = all.get(item.slug);
      all.set(item.slug, {
        slug: item.slug,
        title: item.name.trim().slice(0, 120),
        image: previous?.image || destinationImageForSlug(item.slug),
        location: previous ? "Editorial destination guide" : "Destination directory",
        ...destinationGeography(item.slug, item.country),
        description: typeof item.description === "string" && item.description.trim()
          ? item.description.trim().slice(0, 280)
          : previous?.description || "Explore local highlights and verify current travel details with official providers.",
      });
      }
      if (data.length < 200) break;
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
  const countries = [...new Set(allDestinations.flatMap(item => item.country ? [item.country] : []))].sort((a,b) => a.localeCompare(b));
  const regions = [...new Set(allDestinations.flatMap(item => item.region ? [item.region] : []))].sort((a,b) => a.localeCompare(b));
  const country = typeof params.country === "string" && countries.includes(params.country) ? params.country : "";
  const region = typeof params.region === "string" && regions.includes(params.region) ? params.region : "";
  const sort = params.sort === "country" ? "country" : "name";
  const selected = search.toLowerCase();
  const filtered = allDestinations.filter(item => 
    (!selected || [item.title, item.slug, item.description, item.country || "", item.region || ""].some(value => value.toLowerCase().includes(selected))) &&
    (!country || item.country === country) &&
    (!region || item.region === region)
  ).sort((a, b) => sort === "country"
    ? (a.country || "zzz").localeCompare(b.country || "zzz") || a.title.localeCompare(b.title)
    : a.title.localeCompare(b.title));
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const page = Math.min(requestedPage, pages);
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const featuredDestinations = featured.map((slug) => allDestinations.find((item) => item.slug === slug)).filter((item): item is Destination => Boolean(item));
  const railNames = [...new Set(visible.map((item)=>item.region||"Other regions"))].sort((a,b)=>a.localeCompare(b));
  const rails = railNames.map((name)=>({name,items:visible.filter((item)=>(item.region||"Other regions")===name)}));
  const countryParam = country || "";
  const regionParam = region || "";

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <Image src="/images/global-city.jpg" alt="" fill priority sizes="100vw"
          className="absolute -z-20 object-cover opacity-20" />
        <div className="absolute inset-0 -z-10 bg-[var(--bg)]/80" />
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">
              <Globe2 size={16}/> GTH PRO Worldwide Explorer
            </p>
            <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              One world. Every destination. One ecosystem.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              Explore cities and regions across the globe, then connect to Hotels, Flights, Tours, Activities,
              Transport, Real Estate and Tender discovery from each destination guide.
            </p>
            <form role="search" action="/destinations" method="get"
              className="mt-6 flex max-w-xl flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:flex-row">
              <label htmlFor="destination-search" className="sr-only">Search global destinations</label>
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <Search size={18} className="shrink-0 text-[var(--text-soft)]"/>
                <input id="destination-search" name="search" type="search" defaultValue={search} maxLength={70}
                  placeholder="Search city, country or interest" className="min-h-11 w-full min-w-0 bg-transparent text-sm text-[var(--text)] outline-none"/>
              </div>
              <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
                Explore <ArrowRight size={16}/>
              </button>
            </form>
            <p className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-soft)]">
              <span className="inline-flex items-center gap-1"><Hotel size={15}/> Hotels</span>
              <span className="inline-flex items-center gap-1"><Plane size={15}/> Flights</span>
              <span className="inline-flex items-center gap-1"><Compass size={15}/> Experiences</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck size={15}/> Verified source context</span>
            </p>
          </div>
          {featuredDestinations.length>0&&<div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Featured destinations</h2>
              <span className="text-xs text-[var(--text-soft)]">Swipe to explore <ArrowRight size={13} className="inline"/></span>
            </div>
            <div role="region" aria-label="Featured destinations horizontal rail" tabIndex={0}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
              {featuredDestinations.map((destination)=><DestinationCard key={destination.slug} destination={destination}/>)}
            </div>
          </div>}
        </div>
      </section>

      <section id="discover" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">
              <Sparkles size={16}/> Worldwide destination directory
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Explore by region</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
              Open any destination to browse the full GTH PRO Travel, Real Estate and Tenders category explorer.
            </p>
          </div>
          <p role="status" className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs text-[var(--text-soft)]">
            {filtered.length} destinations · {countries.length} countries in directory
          </p>
        </div>
        <form role="search" action="/destinations" method="get"
          aria-label="Filter worldwide destination directory"
          className="mt-6 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="text-xs font-semibold">Search destination
            <input name="search" type="search" defaultValue={search} maxLength={70}
              placeholder="City, country or theme" className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"/>
          </label>
          <label className="text-xs font-semibold">Region
            <select name="region" defaultValue={regionParam} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]">
              <option value="">All regions</option>
              {regions.map(value=><option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold">Country
            <select name="country" defaultValue={countryParam} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]">
              <option value="">All countries</option>
              {countries.map(value=><option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold">Sort
            <select name="sort" defaultValue={sort} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]">
              <option value="name">Destination A–Z</option>
              <option value="country">Country A–Z</option>
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" className="gth-btn-gold inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">Apply <ArrowRight size={15}/></button>
            <Link href="/destinations#discover" className="inline-flex min-h-11 items-center px-2 text-xs font-semibold underline">Reset</Link>
          </div>
        </form>
        <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
          Directory locations are editorial references; country grouping does not prove live inventory, official partnerships or verified travel prices.
        </p>
        {visible.length>0?rails.map((rail)=>(
          <section key={rail.name} aria-label={rail.name+" destinations"} className="mt-9">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold sm:text-xl">{rail.name}</h3>
              <span className="text-xs text-[var(--text-soft)]">{rail.items.length} shown · Scroll horizontally <ArrowRight size={14} className="inline"/></span>
            </div>
            <div role="region" aria-label={rail.name+" destination cards"} tabIndex={0}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
              {rail.items.map((destination)=><DestinationCard key={destination.slug} destination={destination}/>)}
            </div>
          </section>
        )):(
          <div role="status" className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <p className="text-lg font-semibold">No matching destinations yet</p>
            <p className="mt-3 text-sm text-[var(--text-soft)]">Try another city or explore the full collection.</p>
            <Link href="/destinations#discover" className="mt-4 inline-flex items-center gap-2 text-sm underline">View all destinations <ArrowRight size={16}/></Link>
          </div>
        )}
        {pages>1&&<nav aria-label="Destination pages" className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
          {page>1?<Link href={pageLink(search, page - 1, country, region, sort)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4"><ChevronLeft size={16}/> Previous</Link>:null}
          <span>Page {page} of {pages}</span>
          {page<pages?<Link href={pageLink(search, page + 1, country, region, sort)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4">Next <ChevronRight size={16}/></Link>:null}
        </nav>}
      </section>
      <section className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-10 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold">Go from inspiration to a real itinerary.</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">Providers confirm actual prices, opening hours, travel conditions and availability.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/hotels" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm"><Hotel size={16}/> Find Hotels</Link>
            <Link href="/flights" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm"><Plane size={16}/> Flights</Link>
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm"><BookOpen size={16}/> Guides</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
