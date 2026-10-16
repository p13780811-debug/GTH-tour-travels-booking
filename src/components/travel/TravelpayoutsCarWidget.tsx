"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";

// Exact project-specific Travelpayouts widget supplied by the publisher.
// The country/city parameters are a preset, not global availability data.
export const CAR_WIDGET_URL = "https://tpwidg.com/content?trs=504342&shmarker=417668&locale=en&country=153&city=68511&powered_by=true&campaign_id=87&promo_id=2466";

export default function TravelpayoutsCarWidget() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    setFailed(false);
    const script = document.createElement("script");
    script.src = CAR_WIDGET_URL;
    script.async = true;
    script.charset = "utf-8";
    script.onerror = () => setFailed(true);
    // Travelpayouts injects widget markup adjacent to the source script,
    // so it must live inside the destination container, not in global <head>.
    mount.appendChild(script);
    return () => {
      mount.replaceChildren();
    };
  }, []);

  return (
    <section id="car-rental-offers" aria-labelledby="car-widget-heading"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Travelpayouts partner widget</p>
      <h2 id="car-widget-heading" className="mt-3 text-2xl font-semibold">Explore rental-car offers</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
        This partner widget was supplied with a preset country and city. Change location inside the widget if supported,
        or use the global provider links below to search other locations. Prices, vehicles and reservations are confirmed by the provider.
      </p>
      <div ref={mountRef} className="mt-6 min-h-24 w-full max-w-full overflow-x-auto" aria-label="External rental car booking widget" />
      {failed && <p role="status" className="mt-4 text-sm text-[var(--text-soft)]">
        The partner widget could not load. Please use the global car-search links below.
      </p>}
      <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
        <ShieldCheck size={17} className="mt-1 shrink-0" aria-hidden="true" />
        External provider tool · Affiliate commission may apply. Third-party scripts can be blocked by privacy settings or ad blockers.
        Always confirm pickup country, vehicle, total payable amount, deposit, insurance and cancellation rules with the provider.
      </p>
      <a href="/affiliate-disclosure" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)] underline">
        Our affiliate disclosure <ExternalLink size={14} aria-hidden="true" />
      </a>
    </section>
  );
}
