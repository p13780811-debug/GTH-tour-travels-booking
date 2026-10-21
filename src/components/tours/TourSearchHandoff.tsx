import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { directTourSearch, TOUR_CATEGORIES, type TourSearch } from "@/lib/tours/discovery";

type Props = {
  search: TourSearch; error: string | null; status: number;
  catalogTotal: number; basePath: "/tours" | "/activities";
};
export default function TourSearchHandoff({ search, error, status, catalogTotal, basePath }: Props) {
  const direct = status === 400 ? null : directTourSearch(search);
  const category = TOUR_CATEGORIES.find(item => item.value === search.category)?.label;
  const filtered = Boolean(search.city || search.category || search.currency || search.minPrice || search.maxPrice || search.page > 1);
  return <section aria-label="Tour search summary" className="mx-auto max-w-7xl px-4 pt-7 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">Your experience search</p>
        <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
          {search.city ? "Explore experiences in " + search.city : "Choose how you want to explore"}
        </h2>
        {category && <p className="mt-2 text-sm text-[var(--text-soft)]">{category}</p>}
      </div>
      {filtered && <Link href={basePath+"#discover"} className="gth-btn">Clear filters</Link>}
    </div>
    {status === 400 ? <p role="alert" className="mt-4 rounded-xl border border-[var(--border)] p-4 text-sm">
      {error} <Link href={basePath+"#discover"} className="underline">Reset search</Link>
    </p> : <>
      {direct && <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={direct} target="_blank" rel="noopener noreferrer nofollow" className="gth-btn-gold inline-flex items-center gap-2">
          <Search size={16} aria-hidden="true"/>Search {search.city} on Klook<ArrowUpRight size={15} aria-hidden="true"/>
        </a>
        <p className="max-w-xl text-xs leading-6 text-[var(--text-soft)]">
          Opens a direct destination search. Confirm dates and budget on Klook.
          The provider cards below retain their existing affiliate program links.
        </p>
      </div>}
      {error ? <p role="status" className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
        Our reviewed listings are temporarily unavailable. You can still browse the independent provider options below.
      </p> : catalogTotal === 0 ? <p role="status" className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
        Explore the provider options below for current tours and tickets{search.city ? " in " + search.city : ""}.
        Individual GTH PRO tour offers are not published yet; this does not mean the destination is sold out.
      </p> : null}
    </>}
  </section>;
}
