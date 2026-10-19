import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Compass, Globe2, Hotel, Plane, Search, ShieldCheck, SlidersHorizontal, MapPinned, BadgeCheck } from "lucide-react";
import DestinationCard from "@/components/destination/DestinationCard";
import DestinationExplorerResults from "@/components/destination/DestinationExplorerResults";
import { supabase } from "@/lib/supabase";
import { destinations as curatedDestinations, destinationImageForSlug } from "@/data/destinations";
import { destinationGeography } from "@/lib/destinations/geography";
import {listMappedCities} from "@/lib/travel/mappedCities";
import MappedCityDiscovery from "@/components/travel/MappedCityDiscovery";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Global Destinations & Travel Discovery | GTH PRO",
  description: "Explore curated destinations, city guides, stays and travel experiences with GTH PRO. Confirm live inventory and prices with each booking provider.",
  alternates: { canonical: "/destinations" },
  openGraph: { title: "Global Destinations | GTH PRO", description: "Explore destinations with travel guides and source-backed hotel and tour discovery.", type: "website", url: "/destinations", images: ["/images/global-city.jpg"] },
  twitter: { card: "summary_large_image", title: "Global Destinations | GTH PRO", images: ["/images/global-city.jpg"] },
};

type Destination = { slug: string; title: string; image: string; description: string; location: string; country: string | null; region: string | null };
type Props = { searchParams: Promise<{ search?: string | string[]; page?: string | string[]; country?: string | string[]; region?: string | string[]; sort?: string | string[]; view?: string | string[] }> };
const perPage = 18;
const featured = ["dubai", "paris", "bali", "maldives"];

function pageLink(search: string, page: number, country = "", region = "", sort = "name", view = "grid") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (country) params.set("country", country);
  if (region) params.set("region", region);
  if (sort !== "name") params.set("sort", sort);
  if (view === "list") params.set("view", "list");
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


function DestinationFilterForm({search,region,country,sort,view,regions,countries}:{
 search:string;region:string;country:string;sort:"name"|"country";view:"grid"|"list";
 regions:string[];countries:string[];
}){
 const control="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]";
 return <form role="search" method="get" action="/destinations" aria-label="Refine destination directory" className="grid gap-4">
  <input type="hidden" name="view" value={view}/>
  <label className="block text-xs font-semibold text-[var(--text)]">City, country or interest
   <input type="search" name="search" defaultValue={search} maxLength={70} placeholder="Search destinations" className={control}/>
  </label>
  <label className="block text-xs font-semibold text-[var(--text)]">Region
   <select name="region" defaultValue={region} className={control}>
    <option value="">All regions</option>{regions.map(value=><option value={value} key={value}>{value}</option>)}
   </select>
  </label>
  <label className="block text-xs font-semibold text-[var(--text)]">Country
   <select name="country" defaultValue={country} className={control}>
    <option value="">All countries</option>{countries.map(value=><option value={value} key={value}>{value}</option>)}
   </select>
  </label>
  <label className="block text-xs font-semibold text-[var(--text)]">Sort results
   <select name="sort" defaultValue={sort} className={control}>
    <option value="name">Destination name A–Z</option><option value="country">Country A–Z</option>
   </select>
  </label>
  <div className="flex flex-wrap items-center gap-2">
   <button type="submit" className="gth-btn-gold inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold">Apply filters <ArrowRight size={15}/></button>
   <Link href="/destinations#discover" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-xs font-semibold">Reset</Link>
  </div>
 </form>;
}

export default async function DestinationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const mapped=await listMappedCities({pageSize:48}).catch(()=>null);
  const search = (typeof params.search === "string" ? params.search : "").trim().slice(0, 70);
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const requestedPage = /^[1-9]\d{0,3}$/.test(rawPage) ? Number(rawPage) : 1;
  const allDestinations = await loadDestinations();
  const countries = [...new Set(allDestinations.flatMap(item => item.country ? [item.country] : []))].sort((a,b) => a.localeCompare(b));
  const regions = [...new Set(allDestinations.flatMap(item => item.region ? [item.region] : []))].sort((a,b) => a.localeCompare(b));
  const country = typeof params.country === "string" && countries.includes(params.country) ? params.country : "";
  const region = typeof params.region === "string" && regions.includes(params.region) ? params.region : "";
  const sort = params.sort === "country" ? "country" : "name";
  const view = params.view === "list" ? "list" : "grid";
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
  const railNames = [...new Set(visible.map(item=>item.region||"Other regions"))].sort((a,b)=>a.localeCompare(b));
  const rails = railNames.map(name=>({name,items:visible.filter(item=>(item.region||"Other regions")===name)}));
  const countryParam = country || "";
  const regionParam = region || "";

  return (
   <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
     <div className="absolute inset-0 -z-20 bg-[var(--bg-soft)]"/>
     <div className="absolute inset-y-0 right-0 -z-10 hidden w-[52%] lg:block">
      <Image src="/images/global-city.jpg" alt="" fill priority sizes="52vw" className="object-cover opacity-35"/>
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/35 to-transparent"/>
     </div>
     <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-soft)]">
       <Globe2 size={15}/> GTH PRO · Global Travel Explorer
      </p>
      <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl">Find your next destination. Know where to start.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-soft)]">Browse worldwide destinations with clear country and region context. Save your research, compare options and open the right travel services without going back.</p>
      <form role="search" action="/destinations" method="get" className="mt-5 flex max-w-xl flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm sm:flex-row">
       {country&&<input type="hidden" name="country" value={country}/>}
       {region&&<input type="hidden" name="region" value={region}/>}
       {sort!=="name"&&<input type="hidden" name="sort" value={sort}/>}
       {view==="list"&&<input type="hidden" name="view" value={view}/>}
       <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <Search size={18} className="shrink-0 text-[var(--text-soft)]"/>
        <span className="sr-only">Search worldwide destinations</span>
        <input name="search" type="search" defaultValue={search} maxLength={70} placeholder="City, region, country or interest" className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none"/>
       </label>
       <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">Search <ArrowRight size={16}/></button>
      </form>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text-soft)]">
       <span className="inline-flex items-center gap-1"><MapPinned size={14}/>{allDestinations.length} catalog destinations</span>
       <span className="inline-flex items-center gap-1"><Globe2 size={14}/>{countries.length} countries represented</span>
       <span className="inline-flex items-center gap-1"><ShieldCheck size={14}/> Source-aware travel research</span>
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-soft)]">GTH PRO destination artwork is illustrative. Listings are not a guarantee of live hotel inventory or independently verified ticket availability.</p>
     </div>
    </section>

    <section id="discover" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 lg:py-10">
     <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
       <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">Your research, in focus</p>
       <h2 className="mt-1 text-2xl font-bold tracking-tight">Explore destinations</h2>
      </div>
      <span role="status" className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--text-soft)]">{filtered.length} matches · Page {page} of {pages}</span>
     </div>
     <nav aria-label="Explore destination regions" className="mb-5 flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-2">
      {[{label:"All regions",value:""},...regions.map(value=>({label:value,value}))].map(item=>
       <Link key={item.label} href={pageLink(search,1,country,item.value,sort,view)} aria-current={region===item.value?"page":undefined}
        className={"inline-flex min-h-10 shrink-0 items-center rounded-xl border px-3 text-xs font-semibold "+(region===item.value?"border-[var(--gold)] bg-[var(--card)]":"border-[var(--border)] text-[var(--text-soft)] hover:bg-[var(--card)]")}>{item.label}</Link>
      )}
     </nav>
     <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[255px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0">
       <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-bold"><SlidersHorizontal size={18}/> Refine your search <span className="ml-auto text-xs font-normal text-[var(--text-soft)]">Open filters</span></summary>
        <div className="mt-4 border-t border-[var(--border)] pt-4"><DestinationFilterForm search={search} country={countryParam} region={regionParam} sort={sort} view={view} countries={countries} regions={regions}/></div>
       </details>
       <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:sticky lg:top-28 lg:block">
        <h3 className="inline-flex items-center gap-2 text-base font-bold"><SlidersHorizontal size={17}/> Refine your search</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Filter the published directory by geography and editorial content.</p>
        <div className="mt-5"><DestinationFilterForm search={search} country={countryParam} region={regionParam} sort={sort} view={view} countries={countries} regions={regions}/></div>
        <div className="mt-6 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-soft)]">
         <p className="inline-flex items-center gap-2 font-semibold text-[var(--text)]"><BadgeCheck size={15}/> Data standards</p>
         <p className="mt-2">Country and region labels are editorial geography. Booking availability, supplier prices and AI verification are not asserted here.</p>
        </div>
       </div>
      </aside>
      <div className="min-w-0">
       {visible.length>0?(
        <DestinationExplorerResults items={visible} initialView={view} page={page}/>
       ):(
        <div role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
         <p className="text-base font-semibold">No matching destinations</p>
         <p className="mt-2 text-sm text-[var(--text-soft)]">Try a broader city or country, or reset your filters.</p>
         <Link href="/destinations#discover" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline">Reset search and filters <ArrowRight size={16}/></Link>
        </div>
       )}
       {pages>1&&<nav aria-label="Destination pages" className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm">
        {page>1?<Link href={pageLink(search,page-1,country,region,sort,view)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4"><ChevronLeft size={16}/> Previous</Link>:null}
        <span>Page {page} / {pages}</span>
        {page<pages?<Link href={pageLink(search,page+1,country,region,sort,view)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4">Next <ChevronRight size={16}/></Link>:null}
       </nav>}
      </div>
     </div>
     <p className="mt-5 text-xs leading-5 text-[var(--text-soft)]">Shortlisted places and personal notes stay on this device. These locations are editorial references; data and images provide travel inspiration, not booking or regulatory verification.</p>
    </section>

    {featuredDestinations.length>0&&<section aria-labelledby="featured-destinations-heading" className="mx-auto max-w-7xl min-w-0 border-t border-[var(--border)] px-4 pb-4 pt-8 sm:px-6">
     <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="featured-destinations-heading" className="text-lg font-bold">Featured destination guides</h2><span className="text-xs text-[var(--text-soft)]">Scroll horizontally <ArrowRight size={14} className="inline"/></span></div>
     <div role="region" aria-label="Featured destinations horizontal rail" tabIndex={0} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
      {featuredDestinations.map(destination=><DestinationCard key={destination.slug} destination={destination}/>)}
     </div>
    </section>}

    {rails.length>0&&<section className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-label="Browse destinations by region">
     <h2 className="mb-4 text-xl font-bold">Browse by region</h2>
     {rails.map(rail=><section key={rail.name} aria-label={rail.name+" destinations"} className="mb-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-semibold">{rail.name}</h3><span className="text-xs text-[var(--text-soft)]">{rail.items.length} on this page · Scroll horizontally</span></div>
      <div role="region" tabIndex={0} aria-label={rail.name+" destination cards"} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4">
       {rail.items.map((destination)=><DestinationCard key={destination.slug} destination={destination}/>)}
      </div>
     </section>)}
    </section>}
    <MappedCityDiscovery cities={mapped?.items??[]} title="Cities recently mapped by contributors"/>

    <section className="border-t border-[var(--border)] bg-[var(--card)]">
     <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-8 sm:px-6">
      <div><h2 className="text-xl font-semibold">Go from discovery to a practical itinerary.</h2><p className="mt-2 text-sm text-[var(--text-soft)]">Confirm current availability, travel conditions and final prices with the booking providers.</p></div>
      <div className="flex flex-wrap gap-2">
       <Link href="/hotels" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm"><Hotel size={16}/> Hotels</Link>
       <Link href="/flights" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm"><Plane size={16}/> Flights</Link>
       <Link href="/tours" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm"><Compass size={16}/> Tours</Link>
       <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm"><BookOpen size={16}/> Guides</Link>
      </div>
     </div>
    </section>
   </main>
  );
}
