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

function isSupplierHeadAsset(node: HTMLElement): boolean {
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
    // Official TPWL Widget results URL. Without this setting, TPWL submits
    // /?flightSearch=... and displays our unrelated ecosystem homepage.
    // Keep the provider's results on this site's /flights route (preview-safe).
    const configuredWindow = window as typeof window & {
      TPWL_CONFIGURATION?: Record<string, unknown>;
    };
    const initialConfiguration = configuredWindow.TPWL_CONFIGURATION;
    const configuredResultsUrl = new URL("/flights", window.location.origin).href;
    configuredWindow.TPWL_CONFIGURATION = {
      ...initialConfiguration,
      resultsURL: configuredResultsUrl,
    };
    const supplierAssets = new Set<HTMLElement>();
    // Snapshot BEFORE loading the vendor. Modern Next.js route CSS belongs to
    // the app and must never be removed during a flight widget teardown.
    const originalHeadStyles = new Set<HTMLElement>(
      Array.from(document.head.querySelectorAll<HTMLElement>('style, link[rel="stylesheet"]')),
    );

    // Verified in a real 1366px Chrome A/B test: the WL injects an anonymous
    // ~190KB CSS Modules bundle whose unlayered rules override GTH's Tailwind
    // utilities (md:hidden, flex, padding, etc.). In the existing Tailwind
    // 'base' layer those same supplier rules keep working without overriding
    // GTH utilities. This is NOT a new manual stylesheet or global CSS edit.
    function lowerPriorityForSupplierBundle(node: HTMLElement) {
      if (!(node instanceof HTMLStyleElement)) return;
      if (node.dataset.gthTpwlLayered === "base") return;
      const css = node.textContent || "";
      if (css.length < 50_000 || !css.includes(".Modal-module__root___")) return;
      node.dataset.gthTpwlLayered = "base";
      node.textContent = "@layer base {" + css + "}";
    }

    function isNextAppStylesheet(node: HTMLElement) {
      if (node.tagName === "STYLE") {
        return node.hasAttribute("data-next-hide-fouc") ||
          node.hasAttribute("data-nextjs") || node.hasAttribute("data-n-href");
      }
      if (node.tagName !== "LINK") return false;
      const link = node as HTMLLinkElement;
      return link.href.includes("/_next/") ||
        link.hasAttribute("data-precedence") ||
        link.hasAttribute("data-n-p") ||
        link.hasAttribute("data-n-href");
    }

    // The vendor may insert styles into the global document while active.
    // Track only recognizable supplier assets; never delete Next.js/theme CSS.
    const headObserver = new MutationObserver((records) => {
      for (const record of records) {
        // Some versions append an empty style node and populate it later.
        if (record.target instanceof HTMLStyleElement) {
          lowerPriorityForSupplierBundle(record.target);
        }
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          lowerPriorityForSupplierBundle(node);
          if (isSupplierHeadAsset(node)) {
            supplierAssets.add(node);
            continue;
          }
          // Vendors may insert anonymous <style> blocks with generic selectors
          // instead of putting "tpwl" in their content. They are tracked by
          // insertion time and removed ONLY on widget unmount. Never collect
          // Next.js stylesheets or styles already in the document.
          if (!originalHeadStyles.has(node) &&
              (node.tagName === "STYLE" ||
                (node.tagName === "LINK" &&
                 (node as HTMLLinkElement).rel === "stylesheet")) &&
              !isNextAppStylesheet(node)) {
            supplierAssets.add(node);
          }
        }
      }
    });
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });

    // The WL vendor may render nested divs and upgrade its form asynchronously.
    // A previous selector-only MutationObserver produced "unavailable" even
    // while the visible blue Search flights form had already appeared.
    function hasProviderContent() {
      for (const root of [searchRef.current, ticketsRef.current]) {
        if (!root) continue;
        if (root.querySelector("form, input, button, select, iframe, [role='combobox'], [role='button']")) {
          return true;
        }
        // Some vendor custom elements expose text and multiple nested nodes
        // before native form controls are added.
        if (root.querySelectorAll("*").length >= 4 &&
            (root.textContent || "").trim().length >= 12) return true;
      }
      return false;
    }

    function reconcileStatus() {
      if (!disposed && hasProviderContent()) setStatus("ready");
    }

    const contentObserver = new MutationObserver(reconcileStatus);
    if (searchRef.current) contentObserver.observe(searchRef.current, { childList: true, subtree: true, characterData: true });
    if (ticketsRef.current) contentObserver.observe(ticketsRef.current, { childList: true, subtree: true, characterData: true });
    // Poll briefly because some suppliers render through portals or mutate
    // properties without inserting observable nodes. This also clears any
    // stale error when the form appears after the fallback deadline.
    const healthCheck = window.setInterval(reconcileStatus, 750);
    const timeout = window.setTimeout(() => {
      if (!disposed && !hasProviderContent()) setStatus("error");
    }, 20_000);

    function load(url: string, canRetry: boolean) {
      if (disposed) return;
      const script = document.createElement("script");
      script.type = "module";
      script.async = true;
      script.src = url;
      script.setAttribute("data-gth-white-label", String(WL_ID));
      currentScript = script;
      script.onload = reconcileStatus;
      script.onerror = () => {
        script.remove();
        if (disposed) return;
        // A supplier module can build its UI before a later subresource fails.
        // Never start a SECOND TPWL instance over an already rendered form.
        if (hasProviderContent()) {
          reconcileStatus();
          return;
        }
        if (canRetry) {
          // Allow asynchronous UI rendering to finish before the fallback CDN;
          // two live White Label instances can inject duplicate global styles.
          window.setTimeout(() => {
            if (disposed) return;
            if (hasProviderContent()) reconcileStatus();
            else load(FALLBACK_SCRIPT, false);
          }, 1200);
        } else if (!hasProviderContent()) {
          setStatus("error");
        }
      };
      document.head.appendChild(script);
    }

    load(WL_SCRIPT, true);
    return () => {
      disposed = true;
      // Restore the previously registered configuration for other route tools;
      // never clear a configuration that another component replaced meanwhile.
      if (configuredWindow.TPWL_CONFIGURATION?.resultsURL === configuredResultsUrl) {
        if (initialConfiguration === undefined) delete configuredWindow.TPWL_CONFIGURATION;
        else configuredWindow.TPWL_CONFIGURATION = initialConfiguration;
      }
      window.clearTimeout(timeout);
      window.clearInterval(healthCheck);
      contentObserver.disconnect();
      headObserver.disconnect();
      if (currentScript) {
        currentScript.onload = null;
        currentScript.onerror = null;
        currentScript.remove();
      }
      // Only provider-tagged CSS/scripts; preserve every global stylesheet.
      for (const asset of supplierAssets) {
        if (!originalHeadStyles.has(asset) && !isNextAppStylesheet(asset) &&
            (isSupplierHeadAsset(asset) || asset.tagName === "STYLE" ||
             (asset.tagName === "LINK" &&
              (asset as HTMLLinkElement).rel === "stylesheet"))) asset.remove();
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
      <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">
        Flight results stay on GTH PRO. For flight-only search, make sure the supplier&apos;s
        <strong> Show hotels</strong> checkbox is unchecked; hotel discovery is available separately in GTH PRO Hotels.
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
