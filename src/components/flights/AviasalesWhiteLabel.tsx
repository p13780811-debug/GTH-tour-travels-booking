"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, RefreshCw, ShieldCheck } from "lucide-react";

/**
 * Original Travelpayouts WL Web Widget #23459 integration.
 *
 * Supplier documentation places the module in the page document and expects
 * BOTH #tpwl-search and #tpwl-tickets there. Moving this into srcDoc or a
 * sandboxed iframe prevented the previously working form from rendering.
 *
 * Do not load this script globally in RootLayout. Only the Flights route owns
 * it; unload it and provider-tagged injected head styles on route teardown.
 */
export const WL_ID = 23459;
export const WL_SCRIPT = "https://tpwidg.com/wl_web/main.js?wl_id=23459";
const FALLBACK_SCRIPT = "https://tpwgts.com/wl_web/main.js?wl_id=23459";

type LoadState = "loading" | "ready" | "error";

function isSupplierHeadAsset(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  if (node.tagName === "SCRIPT") {
    const src = (node as HTMLScriptElement).src;
    return src.startsWith("https://tpwidg.com/wl_web/") ||
      src.startsWith("https://tpwgts.com/wl_web/");
  }
  if (node.tagName === "LINK") {
    const href = (node as HTMLLinkElement).href;
    return /https:\/\/(?:[^/]*\.)?(?:tpwidg\.com|tpwgts\.com)\//.test(href) ||
      /(?:travelpayouts|tpwl|aviasales)/i.test(href);
  }
  if (node.tagName === "STYLE") {
    const css = node.textContent || "";
    return /(?:tpwl|travelpayouts|aviasales|tpwgts|tpwidg)/i.test(css);
  }
  return false;
}

export default function AviasalesWhiteLabel() {
  const [status, setStatus] = useState<LoadState>("loading");
  const searchRef = useRef<HTMLDivElement>(null);
  const ticketsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let currentScript: HTMLScriptElement | null = null;
    const supplierAssets = new Set<HTMLElement>();

    // The vendor may insert styles into the global document while active.
    // Track only recognizable supplier assets; never delete Next.js/theme CSS.
    const headObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (isSupplierHeadAsset(node)) supplierAssets.add(node);
        }
      }
    });
    headObserver.observe(document.head, { childList: true });

    const isFormPresent = () =>
      !!searchRef.current?.querySelector("form, input, button, [role='combobox'], iframe") ||
      !!ticketsRef.current?.querySelector("form, input, button, article, iframe");

    function readyIfRendered() {
      if (disposed) return;
      if (isFormPresent()) setStatus("ready");
    }

    const contentObserver = new MutationObserver(readyIfRendered);
    if (searchRef.current) contentObserver.observe(searchRef.current, { childList: true, subtree: true });
    if (ticketsRef.current) contentObserver.observe(ticketsRef.current, { childList: true, subtree: true });

    const timeout = window.setTimeout(() => {
      if (!disposed && !isFormPresent()) setStatus("error");
    }, 20_000);

    function load(url: string, canRetry: boolean) {
      if (disposed) return;
      const script = document.createElement("script");
      script.type = "module";
      script.async = true;
      script.src = url;
      script.setAttribute("data-gth-white-label", String(WL_ID));
      currentScript = script;
      script.onload = readyIfRendered;
      script.onerror = () => {
        script.remove();
        if (disposed) return;
        if (canRetry) load(FALLBACK_SCRIPT, false);
        else setStatus("error");
      };
      document.head.appendChild(script);
    }

    load(WL_SCRIPT, true);
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      contentObserver.disconnect();
      headObserver.disconnect();
      if (currentScript) {
        currentScript.onload = null;
        currentScript.onerror = null;
        currentScript.remove();
      }
      // Only provider-tagged CSS/scripts; preserve every global stylesheet.
      for (const asset of supplierAssets) {
        if (isSupplierHeadAsset(asset)) asset.remove();
      }
    };
  }, []);

  return (
    <section id="flight-search" aria-labelledby="flight-white-label-heading"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">
        Aviasales · Travelpayouts White Label
      </p>
      <h2 id="flight-white-label-heading" className="mt-2 text-xl font-bold sm:text-2xl">
        Find flights for your trip
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Select your departure airport, destination, travel dates and passengers.
        Compare results from the flight provider, then book with the ticket seller.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-soft)]">
        <span className="rounded-lg border border-[var(--border)] px-3 py-2">1. Choose your route</span>
        <span className="rounded-lg border border-[var(--border)] px-3 py-2">2. Dates & passengers</span>
        <span className="rounded-lg border border-[var(--border)] px-3 py-2">3. Compare & book</span>
      </div>

      {status === "loading" && (
        <p role="status" className="mt-4 text-sm text-[var(--text-soft)]">
          Loading flight search…
        </p>
      )}
      {status === "error" && (
        <div role="alert" className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
          <h3 className="text-base font-semibold">Flight search is unavailable right now</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
            The supplier search form has not appeared. You can book directly with Aviasales
            or refresh this page to retry loading the White Label.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="/flights/out/aviasales" target="_blank" rel="noopener noreferrer sponsored"
              className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
              Open Aviasales flight search <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <button type="button" onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
              <RefreshCw size={16} aria-hidden="true" /> Reload flight search
            </button>
          </div>
        </div>
      )}

      <div id="tpwl-search" ref={searchRef}
        className="mt-5 min-h-24 min-w-0 max-w-full [&_iframe]:max-w-full"
        aria-label="Live Aviasales flight search form" />
      <div id="tpwl-tickets" ref={ticketsRef}
        className="mt-4 min-w-0 max-w-full [&_iframe]:max-w-full"
        aria-label="Live Aviasales flight search results" />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
        <p className="flex max-w-2xl items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck className="mt-1 shrink-0" size={15} aria-hidden="true" />
          Results, fares and bookings are supplied by independent ticket sellers.
          GTH PRO does not issue tickets; check final price and availability with the provider.
        </p>
        <a href="/flights/out/aviasales" target="_blank" rel="noopener noreferrer sponsored"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
          Search directly on Aviasales <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
