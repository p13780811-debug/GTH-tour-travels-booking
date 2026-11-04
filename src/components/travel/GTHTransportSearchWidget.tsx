"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Approved 12Go affiliate search-form constructor output (affiliate 17380992).
 * Keep exactly one supplier-owned form on each GTH PRO transport page:
 * a customer enters origin, destination, date and passengers only once.
 *
 * The previous 250px fixed-size embed made the form tiny on mobile/desktop.
 * Measure the real parent width, set explicit provider dimensions, and rebuild
 * only when changing responsive breakpoint or rotating to a different width.
 * No undocumented route prefill URLs, paid API, custom CSS theme or fake fares.
 */
const AFFILIATE_ID = "17380992";
const SEARCH_FORM_SRC = "https://cdn0.trainbusferry.com/tools/form/en/?id=17380992&domain=12go.asia";

type Mode = "bus" | "train";
type LoadStatus = "loading" | "ready" | "error";

function sizeFor(width: number) {
  if (width < 640) return { category: "mobile", height: 680 };
  if (width < 1024) return { category: "tablet", height: 520 };
  return { category: "desktop", height: 440 };
}

export default function GTHTransportSearchWidget({ mode }: { mode: Mode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let lastWidth = 0;
    let lastCategory = "";
    let activeScript: HTMLScriptElement | undefined;
    let observer: ResizeObserver | undefined;
    let checkTimer: number | undefined;
    let loadTimer: number | undefined;

    const mount = () => {
      if (disposed) return;
      const width = Math.floor(host.getBoundingClientRect().width);
      if (width < 240) return; // Wait for the actual responsive layout.
      const { category, height } = sizeFor(width);
      if (activeScript && category === lastCategory && Math.abs(width - lastWidth) < 100) return;
      // Avoid destroying a journey while the visitor interacts with the provider form.
      if (activeScript && host.contains(document.activeElement)) return;

      lastWidth = width;
      lastCategory = category;
      window.clearTimeout(checkTimer);
      window.clearTimeout(loadTimer);
      host.replaceChildren();
      setStatus("loading");

      const script = document.createElement("script");
      script.src = SEARCH_FORM_SRC;
      script.async = true;
      script.dataset.one2go = AFFILIATE_ID;
      script.dataset.color = "default";
      script.dataset.language = "en";
      script.dataset.width = String(width);
      script.dataset.height = String(height);
      script.dataset.border = "0";
      script.dataset.domain = "12go.asia";
      let failed = false;
      script.onerror = () => {
        failed = true;
        if (!disposed && script === activeScript) setStatus("error");
      };
      script.onload = () => {
        if (!disposed && script === activeScript && !failed) setStatus("ready");
      };
      // Some script bundles load successfully but get blocked before rendering.
      loadTimer = window.setTimeout(() => {
        if (disposed || script !== activeScript || failed) return;
        const rendered = host.querySelector("iframe, form, input, [data-one2go]");
        if (!rendered && host.children.length <= 1) setStatus("error");
      }, 12000);
      activeScript = script;
      host.appendChild(script);
    };

    // The vendor form is sized from the parent, not a hard-coded 250px widget.
    observer = new ResizeObserver(() => {
      window.clearTimeout(checkTimer);
      checkTimer = window.setTimeout(mount, 120);
    });
    observer.observe(host);
    mount();

    return () => {
      disposed = true;
      observer?.disconnect();
      window.clearTimeout(checkTimer);
      window.clearTimeout(loadTimer);
      if (activeScript) {
        activeScript.onerror = null;
        activeScript.onload = null;
      }
      host.replaceChildren();
    };
  }, []);

  return (
    <section id="journey-search" className="gth-glass mb-10 w-full min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--border)] p-2 sm:p-6" aria-labelledby="gth-ground-search-heading">
      <div className="px-2 pt-2 sm:px-0 sm:pt-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">GTH PRO · Global travel</p>
        <h2 id="gth-ground-search-heading" className="mt-1 text-xl font-bold sm:text-2xl">
          {mode === "bus" ? "Search bus journeys" : "Search global train journeys"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          Enter your route, travel date and passengers once. Current tickets and checkout are handled by the connected booking partner; available modes and routes vary by location.
        </p>
      </div>
      <div
        ref={hostRef}
        role="region"
        aria-label={mode === "bus" ? "Bus ticket search form" : "Train ticket search form"}
        className="mt-4 w-full min-w-0 max-w-full overflow-x-auto [&_iframe]:max-w-full"
      />
      {status === "loading" && (
        <p role="status" className="px-2 pb-3 text-sm text-[var(--text-soft)]">Loading booking search…</p>
      )}
      {status === "error" && (
        <div role="alert" className="mx-2 mb-3 rounded-xl border border-[var(--border)] p-4 text-sm sm:mx-0">
          <p>The booking form could not load in this browser. You can open the booking search directly.</p>
          <a href="/go/transport" className="gth-btn-gold mt-3 inline-flex min-h-11 items-center rounded-xl px-4 font-semibold">
            Open booking search
          </a>
        </div>
      )}
      <p className="px-2 pb-2 text-xs leading-5 text-[var(--text-soft)] sm:px-0">
        GTH PRO may receive a referral commission. Final availability, fares, payment and refunds are managed by the booking provider.
      </p>
    </section>
  );
}
