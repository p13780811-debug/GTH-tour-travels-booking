import Link from "next/link";
import { ArrowUpRight, Building2, Plane } from "lucide-react";

/** Contextual discovery only: no live price, availability, or partner-API claims. */
export default function CrossVerticalLinks({
  kind, city, compact = false,
}: { kind: "property" | "travel"; city?: string | null; compact?: boolean }) {
  const name = typeof city === "string" ? city.trim().slice(0, 80) : "";
  if (!name || !/^[\p{L}\p{N} .'-]{2,80}$/u.test(name)) return null;
  if (kind === "property") {
    const route = "/flights#flight-search";
    return <aside aria-label="Plan a property visit" className={
      "rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] " +
      (compact ? "mt-3 px-3 py-3" : "mt-6 px-5 py-5")
    }>
      <p className="flex items-center gap-2 text-xs font-semibold"><Plane size={15} aria-hidden="true" /> Planning a site visit to {name}?</p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
        Travelling from another city? Compare flights using our Aviasales White Label. Choose your own airport and dates; fares come from the supplier.
      </p>
      <Link href={route} className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-[var(--gold)]">
        Check flights to {name} <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </aside>;
  }
  const href = "/real-estate?" + new URLSearchParams({ city: name }).toString() + "#listing-results";
  return <aside aria-label="Explore local living" className="mx-auto mt-8 max-w-7xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--text)] sm:p-7">
    <p className="flex items-center gap-2 text-sm font-bold"><Building2 size={18} aria-hidden="true" /> Love {name}? Explore local living.</p>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
      Discover long-term housing, published inventory and registered projects in this city.
      Registry references are not offers for sale or rent; confirm current availability independently.
    </p>
    <Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--gold)]">
      Explore real estate in {name} <ArrowUpRight size={15} aria-hidden="true" />
    </Link>
  </aside>;
}
