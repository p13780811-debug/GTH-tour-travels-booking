import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { searchPublicTenders } from "@/lib/tender/catalog";
import {
  ArrowRight, BookOpen, Building2, Compass, FileSearch, Globe2,
  Hotel, MapPin, Plane, Search, ShieldCheck, Sparkles,
} from "lucide-react";
import { destinations } from "@/data/destinations";
import { blogs } from "@/data/blogs";

// Do not index infinite query-result combinations, including after public launch.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Master Search | GTH PRO Global Ecosystem",
  description: "Search the GTH PRO ecosystem and continue to real property, hotel, tender, tour, destination and editorial results.",
  robots: { index: false, follow: true },
};

type SearchCategory = "all" | "property" | "hotel" | "flight" | "tour" | "destination" | "tender" | "blog";
type Props = { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> };
const categoryIds: SearchCategory[] = ["all", "property", "hotel", "flight", "tour", "destination", "tender", "blog"];

function cleanPlace(text: string): string {
  const place = text
    .replace(/\b(?:best|cheap|luxury|top|find|book|booking|available|things to do|places to see)\b/gi, " ")
    .replace(/\b(?:hotels?|resorts?|stays?|rooms?|accommodation|lodging|tours?|activities|experiences|sightseeing|attractions)\b/gi, " ")
    .replace(/\b(?:near me|nearby|in|near|around|at)\b/gi, " ")
    .replace(/\s+/g, " ").trim();
  return place.toLowerCase() === "me" ? "" : place.slice(0, 80);
}

function inferredCategory(query: string): SearchCategory {
  if (/\b(tenders?|procurement|e-?procurement|rfp|bidding|bid notices?)\b/i.test(query)) return "tender";
  if (/\b(real estate|properties|property|villas?|apartments?|flats?|penthouses?|plots?|homes?|houses?|[1-9]\s*bhk)\b/i.test(query)) return "property";
  if (/\b(hotels?|resorts?|stays?|accommodation|lodging|guesthouses?|rooms?)\b/i.test(query)) return "hotel";
  if (/\b(flights?|airfares?|airlines?|air tickets?)\b/i.test(query)) return "flight";
  if (/\b(tours?|activities|sightseeing|excursions?|experiences|things to do)\b/i.test(query)) return "tour";
  if (/\b(blogs?|guides?|articles?|travel tips|checklists?|how to)\b/i.test(query)) return "blog";
  if (/\b(destinations?|places? to visit|cities|travel to|visit)\b/i.test(query)) return "destination";
  return "all";
}

// Only existing first-party destinations are allowed. Never create arbitrary redirects.
function targetFor(category: SearchCategory, rawQuery: string): string {
  const q = rawQuery.trim().slice(0, 100);
  const withParam = (route: string, key: string, value: string, hash = "") =>
    route + (value ? "?" + new URLSearchParams({ [key]: value }).toString() : "") + hash;

  if (category === "property") {
    const type = /\bvillas?\b/i.test(q) ? "Villa" : /\b(apartments?|flats?|[1-9]\s*bhk)\b/i.test(q) ? "Apartment" : "";
    const area = q.replace(/\b(real estate|properties|property|villas?|apartments?|flats?|penthouses?|plots?|homes?|houses?|for sale|for rent|buy|rent|[1-9]\s*bhk|in|near)\b/gi, " ").replace(/\s+/g, " ").trim();
    const params = new URLSearchParams();
    if (area) params.set("query", area);
    if (type) params.set("type", type);
    if (/\bfor rent\b|\brental\b/i.test(q)) params.set("listing", "rent");
    return "/real-estate" + (params.size ? "?" + params.toString() : "") + "#listing-results";
  }
  if (category === "tender") {
    const subject = q.replace(/\b(tenders?|procurement|e-?procurement|rfp|bidding|bid notices?|find|search|for|in)\b/gi, " ").replace(/\s+/g, " ").trim();
    return withParam("/tender", "q", subject || q, "#tender-find");
  }
  if (category === "hotel") {
    const cityPhrase = q.match(/\b(?:hotels?|resorts?|stays?)\s+(?:in|near|at)\s+(.+)$/i);
    if (cityPhrase) return withParam("/hotels", "city", cleanPlace(cityPhrase[1]));
    const hotelName = cleanPlace(q);
    const knownCity = destinations.some((place) => place.name.toLowerCase() === hotelName.toLowerCase());
    return withParam("/hotels", knownCity ? "city" : "name", hotelName);
  }
  if (category === "tour") return withParam("/tours", "city", cleanPlace(q));
  if (category === "destination") {
    const place = q.replace(/^(?:find|discover|destinations?|travel to|visit|places? to visit|cities in)\s+/i, "").trim();
    return withParam("/destinations", "search", place, "#discover");
  }
  if (category === "blog") {
    const subject = q.replace(/^(?:find|read|travel|blog|blogs|guide|guides|article|articles)\s+/i, "").trim();
    return withParam("/blog", "search", subject, "#journal");
  }
  if (category === "flight") {
    // Flight results require actual airport codes and a future departure date.
    // Do not fabricate these from place names or display fake fare availability.
    const flight = q.match(/\b([A-Z]{3})\s+(?:to|→|-)\s+([A-Z]{3})\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})\b/i);
    if (flight) return "/flights?" + new URLSearchParams({
      origin: flight[1].toUpperCase(), destination: flight[2].toUpperCase(), depart_date: flight[3],
    }).toString();
    return "/flights";
  }
  return withParam("/search", "q", q);
}

const sections = [
  { id: "property", title: "Real Estate", detail: "Search projects, villas, apartments and listings", Icon: Building2 },
  { id: "hotel", title: "Hotels", detail: "Find hotels by destination and compare source listings", Icon: Hotel },
  { id: "flight", title: "Flights", detail: "Search flight routes, dates and observed fares", Icon: Plane },
  { id: "tender", title: "Tenders", detail: "Research current source-backed procurement notices", Icon: FileSearch },
  { id: "tour", title: "Tours", detail: "Discover tours and experiences by location", Icon: Compass },
  { id: "destination", title: "Destinations", detail: "Explore global cities and editorial destination guides", Icon: MapPin },
  { id: "blog", title: "Travel Journal", detail: "Read practical planning, hotel and safety articles", Icon: BookOpen },
] as const;

const theme = {
  "--bg": "#061426",
  "--text": "#f6f8fe",
  "--text-soft": "#c3cfdf",
  "--card": "rgba(7,24,44,.92)",
  "--border": "rgba(234,198,113,.3)",
  "--gold": "#eac671",
} as CSSProperties;

export default async function MasterSearchResults({ searchParams }: Props) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const requested = typeof params.category === "string" ? params.category : "all";
  const selected: SearchCategory = categoryIds.includes(requested as SearchCategory) ? requested as SearchCategory : "all";
  if (query) {
    const intent = selected !== "all" ? selected : inferredCategory(query);
    if (intent === "tender") {
      const subject = query.replace(/\b(tenders?|procurement|e-?procurement|rfp|bidding|bid notices?|find|search|for|in)\b/gi, " ").replace(/\s+/g, " ").trim();
      const results = await searchPublicTenders({ q: subject || query, country: "", sector: "", page: 1 });
      if (results.ok && results.total === 1 &&
        results.items[0].title.trim().toLowerCase() === (subject || query).toLowerCase()) {
        redirect("/tender/" + results.items[0].id);
      }
      redirect(targetFor(intent, query));
    }
    if (intent !== "all") redirect(targetFor(intent, query));
  }
  if (!query && selected !== "all") redirect(targetFor(selected, ""));

  // A true master query checks public records by title/name, not just menu labels.
  // These are read-only anon/RLS queries; no service-role key on this page.
  type HotelMatch = { id: string; name: string; city: string; source: string };
  let hotelMatches: HotelMatch[] = [];
  let propertyMatches: { slug: string; title: string; city: string }[] = [];
  let tenderMatches: { id: string; title: string; buyer: string; country_code: string }[] = [];
  if (query.length >= 2) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const escaped = "%" + query.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
        const [suppliers, catalog, properties] = await Promise.all([
          db.from("hotels").select("id,name,city").eq("is_public", true)
            .ilike("name", escaped).order("name").limit(6),
          db.from("hotel_catalog").select("source_id,name,city").ilike("name", escaped)
            .order("name").limit(6),
          db.from("properties").select("title,slug,city").ilike("title", escaped)
            .order("title").limit(6),
        ]);
        hotelMatches = [
          ...(suppliers.error ? [] : (suppliers.data || []).map(item => ({
            id: String(item.id), name: item.name as string, city: item.city as string, source: "Partner listing",
          }))),
          ...(catalog.error ? [] : (catalog.data || []).map(item => ({
            id: "osm:" + item.source_id, name: item.name as string,
            city: (item.city as string | null) || "", source: "Public hotel catalog",
          }))),
        ].filter(item => typeof item.name === "string" && item.name.trim());
        propertyMatches = (properties.error ? [] : (properties.data || [])).filter(item =>
          typeof item.title === "string" && typeof item.slug === "string" &&
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)
        ).map(item => ({
          title: item.title as string, slug: item.slug as string,
          city: typeof item.city === "string" ? item.city : "",
        }));
      } catch { /* Hotel catalog availability must not break the master results page. */ }
    }
    const notices = await searchPublicTenders({ q: query, country: "", sector: "", page: 1 });
    if (notices.ok) tenderMatches = notices.items.slice(0, 6).map(item => ({
      id: item.id, title: item.title, buyer: item.buyer, country_code: item.country_code,
    }));
  }
  const term = query.toLowerCase();
  const places = query ? destinations.filter(item =>
    [item.name, item.slug, item.description].some(value => value.toLowerCase().includes(term))).slice(0, 6) : [];
  const articles = query ? blogs.filter(item =>
    [item.title, item.description, item.category, item.content].some(value => value.toLowerCase().includes(term))).slice(0, 4) : [];

  return (
    <main style={theme} className="min-h-screen bg-[#061426] text-[#f6f8fe]">
      <section className="relative isolate overflow-hidden border-b border-[#eac671]/25">
        <Image src="/images/global-earth.jpg" alt="" fill priority sizes="100vw" className="absolute -z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020b1d]/95 via-[#061426]/90 to-[#061426]/68" />
        <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 md:py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-[#ffe29d]">
            <Globe2 size={18} /> GTH PRO / GLOBAL INTELLIGENCE ECOSYSTEM
          </Link>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {query ? <>Explore results for <span className="text-[#efd087]">{query}</span></> : <>Explore the <span className="text-[#efd087]">GTH PRO ecosystem.</span></>}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#d4dfea] sm:text-base">
            {query
              ? "Continue this search within the relevant GTH PRO platform. Destination and editorial matches below come from our existing published catalog."
              : "Search multiple industries through one entry point. Choose a platform for direct results, or search all for connected discovery."}
          </p>
          <form role="search" method="get" action="/search"
            className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-[#eac671]/45 bg-[#06172c]/95 p-3 shadow-[0_14px_38px_rgba(0,0,0,.3)] sm:grid-cols-[minmax(0,1fr)_170px_auto] sm:items-center">
            <label className="flex min-h-12 min-w-0 items-center gap-3 px-3">
              <Search size={20} className="shrink-0 text-[#eac671]" />
              <span className="sr-only">Search any GTH PRO topic</span>
              <input name="q" type="search" maxLength={100} required defaultValue={query}
                placeholder="e.g. Hotels in Mumbai, villas in Dubai, tenders..."
                className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[#b8c6d8]" />
            </label>
            <label className="sr-only" htmlFor="result-category">Platform</label>
            <select id="result-category" name="category" defaultValue="all"
              className="min-h-12 min-w-0 rounded-xl border border-[#eac671]/30 bg-[#0e243c] px-3 text-sm text-white">
              <option value="all">All GTH PRO</option>
              <option value="property">Real Estate</option>
              <option value="hotel">Hotels</option>
              <option value="flight">Flights</option>
              <option value="tour">Tours</option>
              <option value="destination">Destinations</option>
              <option value="tender">Tenders</option>
              <option value="blog">Travel Guides</option>
            </select>
            <button type="submit" className="gth-btn-gold min-h-12 rounded-xl px-6 text-sm font-bold">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 md:py-16">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#eac671]">
          <Sparkles size={17} /> {query ? "Search across the platforms" : "Choose a platform"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Explore connected platforms</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#c3cfdf]">
          These cards open each platform's actual search or discovery page; they do not claim a shared live inventory or guaranteed results.
        </p>
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ id, title, detail, Icon }) => (
            <Link key={id} href={targetFor(id, query)}
              className="group flex min-w-0 flex-col rounded-2xl border border-[#eac671]/25 bg-[#0d233b] p-6 transition duration-200 hover:-translate-y-1 hover:border-[#efd087]/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffe49b]">
              <Icon className="text-[#f2d48d]" size={28} strokeWidth={1.65} />
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#c5d2e2]">{detail}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d48d]">
                {query ? "Search in " + title : "Explore " + title} <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {(places.length > 0 || articles.length > 0 || hotelMatches.length > 0 || propertyMatches.length > 0 || tenderMatches.length > 0) && (
        <section className="border-t border-[#eac671]/20 bg-[#07182b]">
          <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 md:py-16">
            <h2 className="text-2xl font-semibold sm:text-3xl">Matching public records and guides</h2>
            <p className="mt-3 text-sm text-[#c5d2e2]">Real public catalog matches only. Open each match for its source-aware details or filtered results.</p>
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hotelMatches.map(item => (
                <Link key={"hotel-" + item.id} href={"/hotels?" + new URLSearchParams({
                  name: item.name, ...(item.city ? { city: item.city } : {}),
                }).toString()}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#eac671]/30 bg-[#0d233b] p-5 hover:border-[#efd087]/70">
                  <Hotel size={25} className="text-[#f2d48d]" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#eac671]">{item.source}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{item.name}</h3>
                  <p className="mt-2 text-sm text-[#c5d2e2]">{item.city || "Location not specified"}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#f2d48d]">
                    View matching hotel listing <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
              {propertyMatches.map(item => (
                <Link key={"property-" + item.slug} href={"/real-estate/" + item.slug}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#eac671]/30 bg-[#0d233b] p-5 hover:border-[#efd087]/70">
                  <Building2 size={25} className="text-[#f2d48d]" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#eac671]">Public property record</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#c5d2e2]">{item.city || "Location not specified"}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#f2d48d]">
                    View property record <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
              {tenderMatches.map(item => (
                <Link key={"tender-" + item.id} href={"/tender/" + item.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#eac671]/30 bg-[#0d233b] p-5 hover:border-[#efd087]/70">
                  <FileSearch size={25} className="text-[#f2d48d]" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#eac671]">Published tender · {item.country_code}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#c5d2e2]">{item.buyer}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-[#f2d48d]">
                    View tender notice <ArrowRight size={16} />
                  </span>
                </Link>
              ))}
              {places.map(place => (
                <Link key={"destination-" + place.slug} href={"/destinations/" + place.slug}
                  className="group overflow-hidden rounded-2xl border border-[#eac671]/25 bg-[#0d233b]">
                  <div className="relative h-40">
                    <Image src={place.image_url} alt={place.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wide text-[#eac671]">Destination guide</p>
                    <h3 className="mt-2 text-lg font-semibold">{place.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-[#c5d2e2]">{place.description}</p>
                  </div>
                </Link>
              ))}
              {articles.map(article => (
                <Link key={"article-" + article.slug} href={"/blog/" + article.slug}
                  className="group overflow-hidden rounded-2xl border border-[#eac671]/25 bg-[#0d233b]">
                  <div className="relative h-40">
                    <Image src={article.image} alt={article.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-wide text-[#eac671]">Travel Journal · {article.category}</p>
                    <h3 className="mt-2 text-lg font-semibold">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-[#c5d2e2]">{article.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {query && !hotelMatches.length && !propertyMatches.length && !tenderMatches.length && !places.length && !articles.length && (
        <section className="mx-auto max-w-[1200px] px-5 pb-10 sm:px-8">
          <p role="status" className="rounded-2xl border border-[#eac671]/30 bg-[#0d233b] p-6 text-sm leading-7 text-[#d4dfea]">
            No matching published record found for “{query}” in the currently connected catalogs.
            This is not confirmation that a hotel, property or tender does not exist.
            Choose a platform above to broaden your search.
          </p>
        </section>
      )}
      <div className="mx-auto flex max-w-[1200px] items-start gap-3 px-5 py-9 text-xs leading-6 text-[#aebed2] sm:px-8">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#eac671]" />
        Search routes lead to existing GTH PRO discovery tools. Confirm booking, eligibility, prices and current availability with relevant providers.
      </div>
    </main>
  );
}
