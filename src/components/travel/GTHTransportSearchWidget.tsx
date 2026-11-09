"use client";

import { useState } from "react";
import { ArrowRight, BusFront, Ship, TrainFront, PlaneTakeoff } from "lucide-react";

/**
 * First-party GTH PRO transport search.
 *
 * Deliberately uses native HTML controls and GET navigation rather than
 * an unresponsive, fixed-height, third-party injected search iframe.
 * Origin, destination, departure date, passenger count and transport mode
 * are sent ONCE to a validated server-side route deep-link handoff.
 * No paid API or browser-held affiliate credentials.
 */
export type TransportMode = "bus" | "train" | "ferry" | "flight";

const modes = [
  { mode: "bus" as const, label: "Bus", Icon: BusFront },
  { mode: "train" as const, label: "Train", Icon: TrainFront },
  { mode: "ferry" as const, label: "Ferry", Icon: Ship },
  { mode: "flight" as const, label: "Flight", Icon: PlaneTakeoff },
];

export default function GTHTransportSearchWidget({ mode }: { mode: TransportMode }) {
  const [activeMode, setActiveMode] = useState<TransportMode>(mode);
  const today = new Date().toISOString().slice(0, 10);
  const field =
    "mt-2 block h-12 w-full min-w-0 max-w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-base text-[var(--text)] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]";
  return (
    <section id="journey-search"
      aria-labelledby="gth-ground-search-heading"
      className="gth-glass mb-8 w-full min-w-0 scroll-mt-24 rounded-2xl border border-[var(--border)] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">GTH PRO · Global travel</p>
          <h2 id="gth-ground-search-heading" className="mt-1 text-xl font-bold sm:text-2xl">
            {activeMode === "bus" ? "Search bus journeys" : activeMode === "train" ? "Search global train journeys" : activeMode === "flight" ? "Search flights" : "Search ferry journeys"}
          </h2>
        </div>
        <nav aria-label="Choose 12Go transport type" className="grid w-full min-w-0 grid-cols-4 gap-1 sm:w-auto sm:gap-2">
          {modes.map(({ mode: item, label, Icon }) => (
            <button key={item} type="button" onClick={() => setActiveMode(item)}
              aria-current={activeMode === item ? "true" : undefined}
              aria-pressed={activeMode === item}
              className={activeMode === item
                ? "inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-xl bg-[image:var(--btn-bg)] px-1.5 py-2 text-xs font-bold text-[var(--btn-text)] shadow-[var(--btn-shadow)] sm:gap-2 sm:px-3 sm:text-sm"
                : "inline-flex min-h-12 min-w-0 items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-1.5 py-2 text-xs font-semibold text-[var(--text)] sm:gap-2 sm:px-3 sm:text-sm"}>
              <Icon size={17} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
      </div>
      <form method="GET" action="/go/transport/search" className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" autoComplete="on">
        <input type="hidden" name="mode" value={activeMode} />
        <label className="block min-w-0 text-sm font-semibold">
          From
          <input className={field} type="text" name="from" minLength={2} maxLength={80}
            placeholder={activeMode === "ferry" ? "e.g. Phuket" : activeMode === "train" || activeMode === "flight" ? "e.g. Bangkok" : "e.g. Mumbai"}
            autoComplete="address-level2" required />
        </label>
        <label className="block min-w-0 text-sm font-semibold">
          To
          <input className={field} type="text" name="to" minLength={2} maxLength={80}
            placeholder={activeMode === "ferry" ? "e.g. Koh Phi Phi" : activeMode === "train" || activeMode === "flight" ? "e.g. Chiang Mai" : "e.g. Goa"}
            autoComplete="off" required />
        </label>
        <label className="block min-w-0 text-sm font-semibold">
          Departure date
          <input className={field} type="date" name="date" min={today} required />
        </label>
        <label className="block min-w-0 text-sm font-semibold">
          Travelers
          <select className={field} name="people" defaultValue="1" required>
            {Array.from({length:8},(_,i)=>i+1).map(count=>(
              <option value={count} key={count}>{count} {count===1?"traveler":"travelers"}</option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit"
            className="gth-btn-gold inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-bold sm:w-auto sm:min-w-64">
            Find tickets <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
      <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
        Search opens a route-specific 12Go partner page with your itinerary and public affiliate tracking.
        Exact stations or airports, schedules, date and passenger selection depend on route coverage; reconfirm on 12Go before payment.
        GTH PRO may receive a referral commission.
      </p>
    </section>
  );
}
