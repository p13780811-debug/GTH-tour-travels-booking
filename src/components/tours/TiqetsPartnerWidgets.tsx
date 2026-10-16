"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Ticket } from "lucide-react";

/**
 * Public, publisher-provided Tiqets / Travelpayouts promotion widgets.
 * No visitor input or private credential is ever incorporated into the script URL.
 * This renders provider-controlled offers, not GTH PRO tour inventory.
 */
export const TIQETS_CARDS_WIDGET = "https://tpwidg.com/content?currency=USD&trs=504342&shmarker=417668&language=en&locale=en&layout=horizontal&cards=4&powered_by=true&campaign_id=89&promo_id=3947";
export const TIQETS_PRODUCT_WIDGET = "https://tpwidg.com/content?currency=USD&trs=504342&shmarker=417668&product=&language=en&layout=horizontal&powered_by=true&campaign_id=89&promo_id=3948";

const tabs = {
  cards: {
    name: "Attraction tickets",
    description: "Tiqets attraction discovery. Available places and price details are supplied by the booking partner.",
    src: TIQETS_CARDS_WIDGET,
  },
  product: {
    name: "More ticket options",
    description: "Additional Tiqets supplier tool. A product is not preselected; the provider determines what can be displayed.",
    src: TIQETS_PRODUCT_WIDGET,
  },
} as const;
type WidgetTab = keyof typeof tabs;
type WidgetStatus = "loading" | "loaded" | "failed";

export default function TiqetsPartnerWidgets() {
  const [selected, setSelected] = useState<WidgetTab>("cards");
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    mount.replaceChildren();
    const script = document.createElement("script");
    script.src = tabs[selected].src;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => setStatus("loaded");
    script.onerror = () => setStatus("failed");
    // External widget scripts place output alongside the script's host.
    mount.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
      mount.replaceChildren();
    };
  }, [selected]);

  function select(tab: WidgetTab) {
    if (selected === tab) return;
    setStatus("loading");
    setSelected(tab);
  }

  return (
    <section aria-labelledby="tiqets-partners-heading" className="gth-glass mt-9 min-w-0 rounded-2xl border border-[var(--border)] p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Ticket size={23} className="shrink-0 text-[var(--gold)]" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Tiqets · Travelpayouts</p>
          <h3 id="tiqets-partners-heading" className="mt-1 text-lg font-bold sm:text-xl">Explore attraction tickets</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
        These affiliate widgets are hosted by an external provider. Products, service locations, ticket
        dates, availability and final payment amounts are confirmed only on the supplier website.
      </p>
      <div role="group" aria-label="Tiqets search tools" className="mt-5 flex flex-wrap gap-2">
        {(["cards", "product"] as const).map((tab) => (
          <button type="button" key={tab} aria-pressed={selected === tab} onClick={() => select(tab)}
            className={selected === tab
              ? "gth-btn-gold inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold"
              : "inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold"}>
            {tabs[tab].name}
          </button>
        ))}
      </div>
      <div className="mt-5 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
        <h4 className="font-semibold">{tabs[selected].name}</h4>
        <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">{tabs[selected].description}</p>
        {status === "loading" && <p className="mt-3 text-sm text-[var(--text-soft)]" role="status">Loading ticket provider…</p>}
        {status === "failed" && (
          <p role="alert" className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            This ticket tool could not load. Browser content blockers or supplier availability may affect it.
            Use the provider's own site to explore tickets.
          </p>
        )}
        <div ref={mountRef} className="mt-4 min-w-0 max-w-full overflow-x-auto [&_iframe]:max-w-full"
          aria-label={tabs[selected].name} />
      </div>
      <a href="https://www.tiqets.com/" target="_blank" rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
        Open Tiqets directly <ExternalLink size={16} aria-hidden="true" />
      </a>
      <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">
        The direct website link above is not an affiliate-tracked link. GTH PRO may receive a commission
        from a booking made using the embedded partner widgets.
      </p>
    </section>
  );
}
