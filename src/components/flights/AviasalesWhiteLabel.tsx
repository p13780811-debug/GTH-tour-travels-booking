"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

/**
 * The user's Travelpayouts White Label Web widget, ID 23459.
 * Two provider-owned target elements MUST be present on the same page before
 * its module loads. No API token or paid-fare cache is sent to this widget.
 *
 * The user-provided CDN is tried first. The documented Travelpayouts CDN
 * is used only if its script fails to load, never simultaneously.
 */
export const WL_ID = 23459;
export const WL_SCRIPT = "https://tpwidg.com/wl_web/main.js?wl_id=23459";
const DOCUMENTED_CDN = "https://tpwgts.com/wl_web/main.js?wl_id=23459";

type LoadState = "loading" | "loaded" | "error";

export default function AviasalesWhiteLabel() {
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let disposed = false;
    let current: HTMLScriptElement | null = null;
    function load(url: string, fallback: boolean) {
      if (disposed) return;
      const script = document.createElement("script");
      current = script;
      script.type = "module";
      script.async = true;
      script.src = url;
      script.setAttribute("data-gth-white-label", "23459");
      script.onload = () => { if (!disposed) setState("loaded"); };
      script.onerror = () => {
        if (disposed) return;
        script.remove();
        if (fallback) load(DOCUMENTED_CDN, false);
        else setState("error");
      };
      document.head.appendChild(script);
    }

    // The form/results containers are already rendered in the tree.
    load(WL_SCRIPT, true);
    return () => {
      disposed = true;
      if (current) {
        current.onload = null;
        current.onerror = null;
        current.remove();
      }
    };
  }, []);

  return (
    <section id="flight-search" aria-labelledby="flight-white-label-heading"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">Aviasales · Travelpayouts White Label</p>
      <h2 id="flight-white-label-heading" className="mt-2 text-xl font-bold sm:text-2xl">
        Search flights and view provider results
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Use the flight form below to choose airports, dates and passengers. Search results appear beneath
        the form when returned by the White Label provider. This is supplier search, not our old historic fare cache.
      </p>
      {state === "loading" && (
        <p role="status" className="mt-4 animate-pulse text-sm text-[var(--text-soft)]">Loading Aviasales flight search…</p>
      )}
      {state === "error" && (
        <p role="alert" className="mt-4 rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-soft)]">
          The provider flight search could not load. Please check ad blockers or open the verified affiliate provider link below.
        </p>
      )}
      <div id="tpwl-search" className="mt-5 min-h-32 min-w-0 max-w-full [&_iframe]:max-w-full" aria-label="Travelpayouts live flight search form" />
      <div id="tpwl-tickets" className="mt-4 min-w-0 max-w-full [&_iframe]:max-w-full" aria-label="Travelpayouts flight search results" />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="flex max-w-2xl items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
          <ShieldCheck className="mt-0.5 shrink-0" size={15} aria-hidden="true" />
          Provider search, pricing, booking and support are operated independently. No ticket is issued by GTH PRO.
          Availability and final fare are established by the seller, not this page.
        </p>
        <a href="/flights/out/aviasales" target="_blank" rel="noopener noreferrer sponsored"
          className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
          Search on Aviasales <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
