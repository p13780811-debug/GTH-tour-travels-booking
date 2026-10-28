import {ArrowUpRight, Search} from "lucide-react";
import type {PartnerSearchKind} from "@/lib/travel/partner-search";

const labels = {
  cars: {heading: "Find car rentals", field: "Pickup city or airport", hint: "e.g. Dubai", action: "Find car rentals"},
  transfers: {heading: "Find airport transfers", field: "City or arrival airport", hint: "e.g. London Heathrow", action: "Find transfers"},
} as const;

/** Native GET opens once on the first click, including without JavaScript. */
export default function TravelPartnerSearch({kind}: {kind: Extract<PartnerSearchKind, "cars" | "transfers">}) {
  const label = labels[kind];
  return <section aria-labelledby={`${kind}-partner-search`} className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
    <h2 id={`${kind}-partner-search`} className="text-xl font-semibold">{label.heading}</h2>
    <form action="/api/travel/partner-search" method="GET" target="_blank" rel="noopener noreferrer" role="search" aria-label={label.heading} className="mt-4 flex flex-wrap items-end gap-3">
      <input type="hidden" name="kind" value={kind}/>
      <label className="min-w-0 flex-1 text-sm font-medium">{label.field}
        <span className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
          <Search size={16} aria-hidden="true"/>
          <input name="destination" type="search" required minLength={2} maxLength={80} placeholder={label.hint} className="min-h-11 w-full min-w-0 bg-transparent text-[var(--text)]"/>
        </span>
      </label>
      <button type="submit" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">{label.action}<ArrowUpRight size={16} aria-hidden="true"/></button>
    </form>
    <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">Opens destination search on Klook in a new tab through our affiliate link. Choose dates, exact pickup and final options there. Search keywords do not guarantee availability.</p>
  </section>;
}
