"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CarFront, MapPin } from "lucide-react";

// Public Travelpayouts tracking IDs and widget configurations supplied for GTH PRO.
// These are referral identifiers, not privileged API keys.
// Do not build script URLs from visitor input.
const widgets = {
  airport: {
    title: "intui.travel airport transfers",
    description: "Search intui.travel airport pickup and drop-off options in its own supplier widget. Confirm geographic coverage and pickup details with the provider.",
    src: "https://tpwidg.com/content?trs=504342&shmarker=417668&locale=en&header=Airport%20transfers%20executed%20by%20local%20Professional%20companies&powered_by=true&color_scheme=bg&b_counter=true&b_benefit=true&b_descr=true&b_about=true&b_map=true&b_reviews=true&b_breadcrumbs=true&b_poweredby=true&b_numbers=true&b_trustpilot=true&b_assortment=true&b_reliable=true&b_extended=true&b_how=true&b_faq=true&b_why=true&b_easybook=true&campaign_id=22&promo_id=1504",
  },
  options: {
    title: "Kiwitaxi transfer options",
    description: "Review Kiwitaxi transfer options. All quoted prices, coverage and booking conditions are supplied by Kiwitaxi.",
    src: "https://tpwidg.com/content?currency=USD&trs=504342&shmarker=417668&locale=en&powered_by=true&transfer_options_limit=10&transfer_options=MCR&disable_currency_selector=true&hide_form_extras=true&hide_external_links=true&campaign_id=1&promo_id=3879",
  },
  additional: {
    title: "More travel services",
    description: "An additional Travelpayouts partner widget. Its exact supplier and services must be confirmed in the Travelpayouts dashboard before being named.",
    src: "https://tpwidg.com/content?trs=504342&shmarker=417668&locale=en&show_header=true&powered_by=true&campaign_id=627&promo_id=8951",
  },
} as const;

type WidgetType = keyof typeof widgets;
type LoadState = "loading" | "loaded" | "error";

export default function TransferProviderWidgets() {
  const [active, setActive] = useState<WidgetType>("airport");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;

    // tpwidg scripts render beside their own script tag. Mount in the
    // selected panel, rather than in Next's document head or all site pages.
    mount.replaceChildren();
    const script = document.createElement("script");
    script.src = widgets[active].src;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => setLoadState("loaded");
    script.onerror = () => setLoadState("error");
    mount.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
      mount.replaceChildren();
    };
  }, [active]);

  function select(type: WidgetType) {
    if (type === active) return;
    setLoadState("loading");
    setActive(type);
  }

  return (
    <section aria-labelledby="transfer-provider-heading" className="gth-glass mb-8 min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <CarFront size={21} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">intui.travel · Kiwitaxi · Travelpayouts</p>
          <h2 id="transfer-provider-heading" className="mt-1 text-xl font-bold sm:text-2xl">Compare airport transfers</h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
        Search using Travelpayouts partner widgets. Supplier results, locations, prices, availability,
        payments and confirmations are handled by the external provider, not by GTH PRO.
      </p>

      <div role="group" aria-label="Transfer search view" className="mt-5 flex flex-wrap gap-2">
        <button type="button" aria-pressed={active === "airport"} onClick={() => select("airport")}
          className={active === "airport"
            ? "gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            : "inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold"}>
          <MapPin size={16} aria-hidden="true" /> intui.travel
        </button>
        <button type="button" aria-pressed={active === "options"} onClick={() => select("options")}
          className={active === "options"
            ? "gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            : "inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold"}>
          <CarFront size={16} aria-hidden="true" /> Kiwitaxi
        </button>
        <button type="button" aria-pressed={active === "additional"} onClick={() => select("additional")}
          className={active === "additional"
            ? "gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            : "inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold"}>
          <ArrowUpRight size={16} aria-hidden="true" /> More travel tools
        </button>
      </div>

      <div className="mt-5 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
        <h3 className="font-semibold">{widgets[active].title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{widgets[active].description}</p>
        {loadState === "loading" && <p role="status" className="mt-4 text-sm text-[var(--text-soft)]">Loading provider search…</p>}
        {loadState === "error" && (
          <p role="alert" className="mt-4 text-sm text-[var(--text-soft)]">
            The provider widget could not load. Check your network or content-blocker settings, or try the alternative partner below.
          </p>
        )}
        <div ref={host} aria-label={widgets[active].title} className="mt-4 min-w-0 max-w-full overflow-x-auto [&_iframe]:max-w-full" />
        {active === "airport" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
            <p className="min-w-0 flex-1 text-xs leading-5 text-[var(--text-soft)]">
              intui.travel may block embedded booking on some browsers. If the supplier panel is blank,
              compare Kiwitaxi instead or continue directly with Welcome Pickups.
            </p>
            <button type="button" onClick={() => select("options")}
              className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text)]">
              Try Kiwitaxi
            </button>
            <a href="https://tpo.lv/GFuzmgYk" target="_blank" rel="noopener noreferrer sponsored"
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[var(--gold)]">
              Welcome Pickups <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-[var(--text-soft)]">
          Affiliate disclosure: GTH PRO may earn a commission when you book through a partner.
          Your booking and support agreement is with that partner.
        </p>
        <a href="https://tpo.lv/GFuzmgYk" target="_blank" rel="noopener noreferrer sponsored"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold">
          Alternative: Welcome Pickups <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
