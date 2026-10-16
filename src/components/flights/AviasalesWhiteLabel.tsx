"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, RefreshCw, ShieldCheck } from "lucide-react";

type WidgetStatus = "loading" | "ready" | "error";

/**
 * Supplier WL 23459 needs a normal HTTPS document: an opaque srcDoc sandbox
 * cannot be treated as an officially supported booking environment.
 *
 * /flights/embed is a standalone SAMEORIGIN-framed route, not the application
 * root. The vendor's dynamically inserted CSS is contained in that document.
 * The parent validates postMessage origin and source, and never injects the
 * vendor script or styles into the persistent Next.js document.
 */
export const WL_ID = 23459;
export const WL_SCRIPT = "https://tpwidg.com/wl_web/main.js?wl_id=23459";
export const WL_FRAME_ROUTE = "/flights/embed";

export default function AviasalesWhiteLabel() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<WidgetStatus>("loading");
  const [height, setHeight] = useState(420);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setStatus((current) => current === "loading" ? "error" : current);
    }, 20_000);

    function onMessage(event: MessageEvent) {
      const frame = iframeRef.current;
      if (!frame || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
      const value: unknown = event.data;
      if (!value || typeof value !== "object") return;
      const payload = value as Record<string, unknown>;
      if (payload.channel !== "gth-tpwl-23459") return;
      if (payload.type === "height" && typeof payload.height === "number" && Number.isFinite(payload.height)) {
        setHeight(Math.min(6000, Math.max(360, Math.ceil(payload.height))));
      }
      if (payload.type === "ready") {
        window.clearTimeout(timeout);
        setStatus("ready");
      }
      if (payload.type === "error") {
        window.clearTimeout(timeout);
        setStatus("error");
      }
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };
  }, [attempt]);

  function retry() {
    setStatus("loading");
    setHeight(420);
    setAttempt((value) => value + 1);
  }

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
        Compare results from the flight provider, then complete payment with the ticket seller.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-soft)]">
        <span className="rounded-lg border border-[var(--border)] px-3 py-2">1. Choose your route</span>
        <span className="rounded-lg border border-[var(--border)] px-3 py-2">2. Select dates & passengers</span>
        <span className="rounded-lg border border-[var(--border)] px-3 py-2">3. Compare flights & book</span>
      </div>

      {status === "error" ? (
        <div role="alert" className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6">
          <h3 className="text-base font-semibold">Flight search is temporarily unavailable here</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
            Your browser, a content blocker or the supplier may prevent the embedded booking form from loading.
            Use the Aviasales partner link to search and book directly, or retry the embedded search.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/flights/out/aviasales" target="_blank" rel="noopener noreferrer sponsored"
              className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
              Open Aviasales flight search <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <button type="button" onClick={retry}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold">
              <RefreshCw size={16} aria-hidden="true" /> Retry on GTH PRO
            </button>
          </div>
        </div>
      ) : (
        <div className="relative mt-5 min-w-0 overflow-hidden rounded-xl bg-[var(--bg)]">
          <iframe key={attempt} ref={iframeRef} src={WL_FRAME_ROUTE}
            title="Aviasales flight search, date selection and results"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="eager"
            className={"w-full min-w-0 border-0 bg-white transition-opacity duration-200 " + (status === "ready" ? "opacity-100" : "opacity-0")}
            style={{ height: height + "px" }}
          />
          {status === "loading" && (
            <div role="status" aria-live="polite"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--card)] p-5 text-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" aria-hidden="true" />
              <p className="text-sm font-semibold">Connecting to Aviasales flight search…</p>
              <p className="max-w-sm text-xs leading-5 text-[var(--text-soft)]">
                The search form will appear here. If it cannot load, we will offer a direct supplier search instead.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
        <p className="flex max-w-2xl items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck className="mt-1 shrink-0" size={15} aria-hidden="true" />
          Flights and ticket prices are provided by independent sellers. GTH PRO does not issue tickets;
          final fare, baggage rules, availability, payment and support depend on the chosen provider.
        </p>
        <a href="/flights/out/aviasales" target="_blank" rel="noopener noreferrer sponsored"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
          Search directly on Aviasales <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
