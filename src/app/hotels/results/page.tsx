import TravelSectionNav from "@/components/travel/TravelSectionNav";
import type { Metadata } from "next";
import HotelResults from "./HotelResults";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hotel Search Results | GTH PRO",
  robots: { index: false, follow: true },
};

type SearchValue = string | string[] | undefined;
type PageProps = {
  searchParams: Promise<Record<string, SearchValue>>;
};

function first(value: SearchValue): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const city = first(params.city).slice(0, 80);
  const destination = first(params.destination).slice(0, 80);
  const name = first(params.name).slice(0, 80);
  const country = first(params.country).toUpperCase().slice(0, 2);
  const category = first(params.category);
  const rawSort = first(params.sort);
  const rawSource = first(params.source);
  const sort = rawSort === "name_desc" ? "name_desc" : "name_asc";
  const source = rawSource === "partner" || rawSource === "directory" ? rawSource : "all";
  const checkin=first(params.checkin).slice(0,10);
  const checkout=first(params.checkout).slice(0,10);
  const adults=first(params.adults).slice(0,2);
  const hasScope = Boolean(city || destination || name || country || category);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-7xl">
<header data-travel-hero="true">
        <h1 className="text-2xl font-bold md:text-4xl">Hotel source directory</h1>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          Research-only accommodation records, not Nuitee live room inventory. For actual booking dates and current rooms, use our hosted Nuitee search.
        </p>
</header>
<TravelSectionNav />
        <Link href={"/hotels?"+new URLSearchParams({view:"booking",...(city?{city}:{}),...(destination?{destination}:{}),...(name?{name}:{})}).toString()}
          className="gth-btn-gold mt-5 inline-flex min-h-12 items-center rounded-xl px-5 text-sm font-semibold">Book a stay on Nuitee</Link>
        {hasScope ? (
          <div className="mt-8">
            <HotelResults scope={{ city, destination, name, country, category, sort, source, checkin, checkout, adults }} />
          </div>
        ) : (
          <div className="gth-glass mt-8 rounded-2xl border border-[var(--border)] p-6" role="status">
            Enter a destination or hotel name to explore source-backed accommodation listings.
            <a className="gold-text ml-2 underline" href="/hotels">Search hotels</a>
          </div>
        )}
      </div>
    </main>
  );
}
