import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Compass, Globe2, Hotel, Plane, Search, ShieldCheck, Sparkles } from "lucide-react";
import { blogs, type Blog } from "@/data/blogs";
import {listMappedCities} from "@/lib/travel/mappedCities";
import MappedCityDiscovery from "@/components/travel/MappedCityDiscovery";

export const metadata: Metadata = {
  title: "Travel Journal & Guides | GTH PRO",
  description: "GTH PRO's travel knowledge platform: expert-style research checklists on flights, hotels, destinations, experiences and secure booking decisions.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "The Global Travel Journal | GTH PRO",
    description: "Practical, carefully written travel guides connecting destination inspiration to informed decisions.",
    type: "website",
    images: [{ url: "/images/global-city.jpg", alt: "GTH PRO Global Travel Journal" }],
  },
};

type Category = Blog["category"] | "All";
const categories: Category[] = ["All", "Flights", "Hotels", "Experiences", "Planning", "Safety"];
type Props = { searchParams: Promise<{ category?: string | string[]; search?: string | string[] }> };
const palette = {
  "--bg": "#061426",
  "--text": "#f7f9fd",
  "--text-soft": "#c2cfdf",
  "--border": "rgba(234,198,113,.25)",
  "--card": "rgba(8,24,42,.87)",
  "--gold": "#eac671",
} as CSSProperties;
function readingTime(content: string) {
  return Math.max(2, Math.ceil(content.trim().split(/\s+/).length / 190));
}
function filterLink(category: Category, search: string) {
  const params = new URLSearchParams();
  if (category !== "All") params.set("category", category);
  if (search) params.set("search", search);
  const query = params.toString();
  return "/blog" + (query ? "?" + query : "") + "#journal";
}

export default async function BlogList({ searchParams }: Props) {
  const params = await searchParams;
  const selected: Category = typeof params.category === "string" && categories.includes(params.category as Category)
    ? params.category as Category : "All";
  const search = (typeof params.search === "string" ? params.search : "").trim().slice(0, 70);
  const query = search.toLowerCase();
  const articles = blogs.filter((article) =>
    (selected === "All" || article.category === selected)
    && (!query || [article.title, article.description, article.category, article.content].some((value) => value.toLowerCase().includes(query))));
  const lead = blogs[0];
  const mapped=await listMappedCities({pageSize:48}).catch(()=>null);

  return (
    <main style={palette} className="min-h-screen bg-[#061426] text-[#f7f9fd]">
      <section className="relative isolate overflow-hidden border-b border-[#eac671]/25">
        <Image src="/images/global-city.jpg" alt="" fill priority sizes="100vw" className="absolute -z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020b1d]/95 via-[#041426]/92 to-[#08213d]/70" />
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-14 sm:px-8 md:py-20 lg:min-h-[470px] lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#eac671]/40 bg-[#041326]/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#efd18d]">
              <BookOpen size={15} /> GTH PRO / Global Travel Journal
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl lg:text-[60px]">
              Better journeys begin <span className="text-[#f0d38d]">with knowledge.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#d2dceb] sm:text-base">
              Destination intelligence, research checklists and helpful explanations for decisions that matter before you book.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs">
              <Link href="/destinations" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/35 bg-[#0b2037]/80 px-4 text-[#fce5af]">
                <Globe2 size={17} /> Destination Collection
              </Link>
              <Link href="/guides" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/35 bg-[#0b2037]/80 px-4 text-[#fce5af]">
                <Compass size={17} /> Planning Resources
              </Link>
            </div>
          </div>
          <Link href={"/blog/" + lead.slug} className="group relative isolate flex min-h-[240px] flex-col justify-end overflow-hidden rounded-2xl border border-[#eac671]/35 bg-[#071d34] p-6 shadow-[0_15px_40px_rgba(0,0,0,.35)] sm:min-h-[300px]">
            <Image src={lead.image} alt={lead.title} fill sizes="(max-width: 1024px) 100vw, 44vw" className="absolute inset-0 -z-10 object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#020b1d]/95 via-[#041224]/60 to-[#031327]/15" />
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#f6d687]">Featured Research</p>
            <h2 className="mt-3 max-w-sm text-2xl font-semibold leading-tight text-white sm:text-3xl">{lead.title}</h2>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#ffe3a0]">Read the guide <ArrowUpRight size={17} /></span>
          </Link>
        </div>
      </section>

      <MappedCityDiscovery cities={mapped?.items??[]} title="Explore real cities before your next trip"/>
      <section id="journal" className="mx-auto max-w-[1400px] scroll-mt-12 px-5 py-12 sm:px-8 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#eac671]"><Sparkles size={15} /> GTH PRO Editorial</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">The Knowledge Library</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c2cfdf]">Thoughtful planning guides, not promotional hotel inventories or unverified live travel offers.</p>
          </div>
          <span className="rounded-full border border-[#eac671]/30 px-4 py-2 text-xs text-[#c9d6e8]" role="status">{articles.length} {articles.length === 1 ? "guide" : "guides"}</span>
        </div>

        <form role="search" action="/blog" method="get" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {selected !== "All" && <input type="hidden" name="category" value={selected} />}
          <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#eac671]/35 bg-[#0b2037] px-4">
            <Search size={18} className="shrink-0 text-[#eac671]" />
            <span className="sr-only">Search editorial guides</span>
            <input type="search" name="search" maxLength={70} defaultValue={search} placeholder="Search topics, flights, hotels or safety..."
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[#a8bbd3]" />
          </label>
          <button type="submit" className="gth-btn-gold min-h-12 rounded-xl px-7 text-sm font-bold">Search Guides</button>
        </form>
        <nav aria-label="Browse travel editorial categories" className="mt-6 flex gap-2 overflow-x-auto pb-3">
          {categories.map((category) => (
            <Link key={category} href={filterLink(category, search)} aria-current={selected === category ? "page" : undefined}
              className={"shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition " +
                (selected === category
                  ? "border-[#f6d68a] bg-[#eac671] text-[#081323]"
                  : "border-[#eac671]/35 bg-[#0b2037] text-[#e4eaf4] hover:border-[#eac671]/75")}>
              {category}
            </Link>
          ))}
        </nav>

        {articles.length ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.slug} href={"/blog/" + article.slug}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eac671]/25 bg-[#0b2037] shadow-[0_10px_30px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-1 hover:border-[#eac671]/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f6d68a]">
                <div className="relative h-[225px] overflow-hidden sm:h-[250px]">
                  <Image src={article.image} alt={article.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061426]/65 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[.1em]">
                    <span className="text-[#f0d38d]">{article.category}</span>
                    <span className="text-[#b9c9df]">{readingTime(article.content)} min read</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold leading-snug text-white">{article.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#c3cfde]">{article.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-[#f2d48e]">Read Article <ArrowRight size={16} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div role="status" className="mt-7 rounded-2xl border border-[#eac671]/30 bg-[#0b2037] p-9 text-center">
            <p className="text-lg font-semibold">No guides match your search</p>
            <p className="mt-3 text-sm text-[#c2cfdf]">Try another topic or explore all editorial guides.</p>
            <Link href="/blog#journal" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d48e] underline">Browse all guides <ArrowRight size={16} /></Link>
          </div>
        )}
      </section>

      <section className="border-t border-[#eac671]/20 bg-[#041021]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-5 px-5 py-9 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-[#ffe1a0]">Research before reserving.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#bdc9da]">Travel requirements, fares and cancellations can change. Confirm current information with official authorities and booking providers.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/flights" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-5 text-sm text-[#ffe1a0]"><Plane size={17} /> Flights</Link>
            <Link href="/hotels" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-5 text-sm text-[#ffe1a0]"><Hotel size={17} /> Hotels</Link>
            <Link href="/destinations" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#eac671]/40 px-5 text-sm text-[#ffe1a0]"><Compass size={17} /> Destinations</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
