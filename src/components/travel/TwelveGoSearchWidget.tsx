"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Official search form from the owner's 12Go affiliate form constructor.
 * The provider-approved White Label is used only when its SSL is working.
 * No private API keys, invented results or unsupported route-specific links.
 */
const AFFILIATE_ID = "17380992";
const WIDGET_SCRIPT = "https://cdn0.trainbusferry.com/tools/form/en/?id=17380992&domain=12go.asia";
const AFFILIATE_HOME = "https://12go.asia/?z=17380992";

type TransportMode = "bus" | "train";

export default function TwelveGoSearchWidget({ mode }: { mode: TransportMode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;
    // Load vendor code only after the visitor chooses to open the form.
    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.dataset.one2go = AFFILIATE_ID;
    script.dataset.color = "default";
    script.dataset.language = "en";
    script.dataset.width = "250";
    script.dataset.height = "320";
    script.dataset.border = "1";
    script.dataset.domain = "12go.asia";
    script.onerror = () => setFailed(true);
    container.appendChild(script);
    return () => {
      script.onerror = null;
      container.replaceChildren();
    };
  }, [enabled]);

  return (
    <section className="gth-glass mb-10 rounded-2xl border border-[var(--border)] p-5 md:p-7" aria-label="12Go transport search">
      <h2 className="text-xl font-bold">Search international {mode === "bus" ? "buses" : "train connections"} with 12Go</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        An official 12Go partner search form for supported regions and operators. Search results,
        prices, tickets, payments and refunds are supplied by 12Go, not GTH PRO. Indian Railways
        ticketing and PNR information remain available only through the official rail providers.
      </p>
      {!enabled && (
        <button type="button" onClick={() => setEnabled(true)}
          className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold">
          Open 12Go transport search
        </button>
      )}
      {enabled && (
        <div className="mt-5 min-w-0" role="group" aria-label="12Go hosted transport search form">
          <div ref={containerRef} className="w-full max-w-full overflow-x-auto" />
          {failed && <p role="status" className="mt-3 text-sm text-[var(--text-soft)]">
            The 12Go form could not load. You can continue on its official booking site below.
          </p>}
        </div>
      )}
      <p className="mt-4 text-xs text-[var(--text-soft)]">
        Powered by <a href={AFFILIATE_HOME} target="_blank" rel="sponsored noopener noreferrer"
          className="underline underline-offset-2">12Go system</a>
      </p>
      <a href="/go/12go" target="_blank" rel="sponsored noopener noreferrer"
        className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold">
        Continue to 12Go booking
      </a>
      <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">
        This booking link uses the approved GTH PRO White Label when its HTTPS is active, otherwise
        the official tracked 12Go partner checkout. No payment is processed by GTH PRO.
      </p>
      <p className="mt-2 text-xs text-[var(--text-soft)]">
        Affiliate disclosure: GTH PRO may earn a commission if you book through our 12Go partner link.
      </p>
    </section>
  );
}
