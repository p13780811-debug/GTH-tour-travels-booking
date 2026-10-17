"use client";

import { useState } from "react";
import { ArrowUpRight, ShieldCheck, Ticket } from "lucide-react";

/**
 * Direct supplier handoffs, not a simulated inventory widget.
 * The former provider-specific product embed lacked a selected ticket ID
 * and could leave an empty frame or show an unrelated default offer.
 * Never load an external script just to fill a permanently blank panel.
 */
const panels = {
  cards: {
    name: "Attraction tickets",
    description: "Explore attraction tickets and city passes with established providers.",
    options: [
      { name: "Tiqets", detail: "Museums, landmarks and attraction admission", url: "https://www.tiqets.com/", sponsored: false },
      { name: "Klook", detail: "Attractions and bookable travel activities", url: "https://klook.tpo.lv/IKb6eSUe", sponsored: true },
      { name: "Go City", detail: "Multi-attraction city passes", url: "https://gocity.tpo.lv/NdfDWRGS", sponsored: true },
    ],
  },
  product: {
    name: "More ticket options",
    description: "Explore other tour formats. Exact offers and prices appear on the provider website.",
    options: [
      { name: "WeGoTrip", detail: "Audio guides and city walking experiences", url: "https://wegotrip.tpo.lv/ZQjE9yR2", sponsored: true },
      { name: "KKday", detail: "Day trips, experiences and local activities", url: "https://kkday.tpo.lv/ytfvDLam", sponsored: true },
      { name: "Tiqets", detail: "Find tickets directly with the ticket provider", url: "https://www.tiqets.com/", sponsored: false },
    ],
  },
} as const;

type WidgetTab = keyof typeof panels;

export default function TiqetsPartnerWidgets() {
  const [selected, setSelected] = useState<WidgetTab>("cards");
  const panel = panels[selected];

  return (
    <section aria-labelledby="tiqets-partners-heading"
      className="gth-glass mt-9 min-w-0 rounded-2xl border border-[var(--border)] p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Ticket size={23} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Tickets & activities</p>
          <h3 id="tiqets-partners-heading" className="mt-1 text-lg font-bold sm:text-xl">Explore attraction tickets</h3>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
        Choose a supplier to check actual locations, dates, ticket availability, prices and cancellation conditions.
        These links are not an on-site booking engine.
      </p>
      <div role="group" aria-label="Ticket provider categories" className="mt-5 flex flex-wrap gap-2">
        {(["cards", "product"] as const).map(tab => (
          <button key={tab} type="button" aria-pressed={selected === tab}
            aria-controls="tiqets-ticket-results" onClick={() => setSelected(tab)}
            className={selected === tab
              ? "gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold"
              : "inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold"}>
            {panels[tab].name}
          </button>
        ))}
      </div>
      <div id="tiqets-ticket-results" role="region" aria-label={panel.name}
        className="mt-5 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
        <h4 className="font-semibold">{panel.name}</h4>
        <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{panel.description}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {panel.options.map(option => (
            <a key={option.url} href={option.url} target="_blank"
              rel={option.sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer nofollow"}
              className="group flex min-h-32 flex-col justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 transition hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              <div>
                <p className="text-base font-semibold">{option.name}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{option.detail}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                Browse on provider website <ArrowUpRight size={15} aria-hidden="true"/>
              </span>
            </a>
          ))}
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true"/>
        Affiliate-tracked links are marked as sponsored. Tiqets' direct website link is not affiliate-tracked.
        GTH PRO does not confirm or issue tickets, and displayed providers are not confirmed inventory.
      </p>
    </section>
  );
}
