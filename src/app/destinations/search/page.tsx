import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { destinations as curatedDestinations, destinationImageForSlug } from "@/data/destinations";
import { destinationGeography } from "@/lib/destinations/geography";
import { destinationDetailHref } from "@/lib/destinations/detail-link";
import { validatedCountry } from "@/lib/destinations/country";
import DestinationCard, { type DestinationCardInfo } from "@/components/destination/DestinationCard";

export const metadata: Metadata = {
  title: "Search Destinations | GTH PRO",
  description: "Find the right city or country before exploring its supplier-backed travel options.",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ search?: string | string[]; country?: string | string[] }> };
const MAX_RESULTS = 40;
const NAME_QUERY = /^[\p{L}\p{M}\p{N} .,'’‘()&/–—-]{2,70}$/u;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const identity = (place: Pick<DestinationCardInfo, "slug" | "country">) =>
  place.slug + "::" + (place.country ?? "").normalize("NFKC").toLowerCase();

function curatedMatches(search: string, country: string): DestinationCardInfo[] {
  return curatedDestinations
    .filter(place => [place.name, place.slug].some(value => value.toLowerCase().includes(search.toLowerCase())))
    .map(place => ({
      slug: place.slug, title: place.name, image: place.image_url,
      description: place.description, location: "Editorial destination guide",
      ...destinationGeography(place.slug),
    }))
    .filter(place => !country || place.country === country);
}

async function findMatches(search: string, country: string): Promise<DestinationCardInfo[]> {
  const found = new Map<string, DestinationCardInfo>();
  for (const place of curatedMatches(search, country)) found.set(identity(place), place);
  // This is only destination identity data. Supplier products are loaded on the city page.
  try {
    // Escape user LIKE operators so the query is a bounded literal substring search.
    const escaped = search.replace(/[\\%_]/g, "\\$&");
    let lookup = supabase.from("destinations")
      .select("slug,name,description,country")
      .eq("is_active", true)
      .ilike("name", "%" + escaped + "%")
      .order("name", { ascending: true })
      .limit(MAX_RESULTS);
    if (country) lookup = lookup.eq("country", country);
    const { data, error } = await lookup.abortSignal(AbortSignal.timeout(4500));
    if (!error && Array.isArray(data)) for (const place of data) {
      if (typeof place.slug !== "string" || place.slug.length > 140 || !SLUG.test(place.slug) ||
          typeof place.name !== "string" || !place.name.trim()) continue;
      const geography = destinationGeography(place.slug, typeof place.country === "string" ? place.country : null);
      if (country && geography.country !== country) continue;
      const item: DestinationCardInfo = {
        slug: place.slug, title: place.name.trim().slice(0, 120),
        image: destinationImageForSlug(place.slug),
        description: typeof place.description === "string" && place.description.trim()
          ? place.description.trim().slice(0, 280)
          : "Explore this destination and confirm current details with travel providers.",
        location: "Destination directory", ...geography,
      };
      const key = identity(item);
      if (!found.has(key)) found.set(key, item);
    }
  } catch {
    // Keep editorial destinations searchable if the database is temporarily unavailable.
  }
  const exact = search.toLocaleLowerCase("en");
  return [...found.values()].sort((a, b) => {
    const score = (place: DestinationCardInfo) => {
      const name = place.title.toLocaleLowerCase("en");
      return name === exact ? 0 : name.startsWith(exact) ? 1 : 2;
    };
    return score(a) - score(b) || a.title.localeCompare(b.title) ||
      (a.country ?? "").localeCompare(b.country ?? "");
  }).slice(0, MAX_RESULTS);
}

export default async function DestinationSearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = typeof params.search === "string" ? params.search : "";
  const search = raw.normalize("NFKC").trim().replace(/\s+/gu, " ");
  const country = validatedCountry(params.country);
  if (!search) redirect("/destinations");

  const valid = search.length <= 70 && NAME_QUERY.test(search) &&
    !search.includes("..") && !search.includes("://");
  // An established editorial city can open immediately without a supplier or
  // database round trip. Respect any explicit country filter.
  const curatedExact = valid ? curatedMatches(search, country).filter(place =>
    place.title.normalize("NFKC").toLocaleLowerCase("en") === search.toLocaleLowerCase("en")) : [];
  if (curatedExact.length === 1) redirect(destinationDetailHref(curatedExact[0]));
  const places = valid ? await findMatches(search, country) : [];
  const exact = places.filter(place => place.title.normalize("NFKC").toLocaleLowerCase("en") ===
    search.toLocaleLowerCase("en"));
  // A single unambiguous exact match opens a NEW destination page immediately.
  // Never silently choose one of two different countries with the same city name.
  if (exact.length === 1) redirect(destinationDetailHref(exact[0]));

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/destinations" className="inline-flex min-h-10 items-center gap-2 text-sm underline">
          <ArrowLeft size={16}/> All destinations
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Destination search results</h1>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          {valid ? `Search results for “${search}”` : "Enter a city or country name to search."}
        </p>
        <form role="search" method="get" action="/destinations/search" className="mt-5 flex max-w-xl flex-col gap-2 sm:flex-row">
          {country && <input type="hidden" name="country" value={country}/>}
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3">
            <Search size={18} aria-hidden="true"/>
            <span className="sr-only">Destination name</span>
            <input name="search" type="search" defaultValue={search} maxLength={70} required
              placeholder="Goa, Mumbai, Paris..." className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none"/>
          </label>
          <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
            Search <ArrowRight size={16}/>
          </button>
        </form>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-label="Matching destinations">
      {places.length ? <>
        <h2 className="text-xl font-semibold">{places.length} matching destinations</h2>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          Select the correct city and country to open its dedicated destination page.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          {places.map(place => <DestinationCard key={identity(place)} destination={place}/>)}
        </div>
        {places.length === MAX_RESULTS && <p className="mt-5 text-sm text-[var(--text-soft)]">
          Showing the first {MAX_RESULTS} matches. Refine your search to narrow the results.
        </p>}
      </> : <div role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">{valid ? "No matching destinations found" : "Search term not supported"}</h2>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          Try a city name such as Goa, Mumbai, Dubai or Paris. No unrelated city is substituted.
        </p>
      </div>}
    </section>
  </main>;
}
