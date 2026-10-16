"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

/**
 * Travelpayouts White Label Web #23459 runs ONLY inside this disposable iframe.
 *
 * The provider module may add CSS, fonts or global event listeners to its own
 * document. Loading it in document.head of the Next.js app would leave those
 * side effects behind after client-side navigation. The iframe confines them to
 * its own document, destroyed by the browser when Flights unmounts.
 *
 * sandbox intentionally omits allow-same-origin: provider JavaScript must not
 * access the GTH PRO application's DOM, cookies or localStorage.
 */
export const WL_ID = 23459;
export const WL_SCRIPT = "https://tpwidg.com/wl_web/main.js?wl_id=23459";

type WidgetState = "loading" | "loaded" | "error";

// Self-contained document with both Travelpayouts targets and no global CSS.
// Fixed public script URLs are the only executable remote sources.
const whiteLabelDocument = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aviasales flight search</title>
</head>
<body style="margin:0">
<div id="tpwl-search"></div>
<div id="tpwl-tickets"></div>
<script>
(function () {
  var channel = "gth-tpwl-frame-23459";
  function emit(type, height) {
    window.parent.postMessage({ channel: channel, type: type, height: height }, "*");
  }
  function measure() {
    var height = Math.max(
      document.body.scrollHeight || 0,
      document.documentElement.scrollHeight || 0,
      360
    );
    emit("height", height);
  }
  if (window.ResizeObserver) {
    var observer = new ResizeObserver(measure);
    observer.observe(document.body);
    observer.observe(document.documentElement);
  }
  window.addEventListener("load", measure);
  function loadProvider(url, retry) {
    var script = document.createElement("script");
    script.type = "module";
    script.async = true;
    script.src = url;
    script.setAttribute("data-gth-white-label", "23459");
    script.onload = function () { emit("loaded"); measure(); };
    script.onerror = function () {
      script.remove();
      if (retry) loadProvider("https://tpwgts.com/wl_web/main.js?wl_id=23459", false);
      else emit("error");
    };
    document.head.appendChild(script);
  }
  loadProvider("https://tpwidg.com/wl_web/main.js?wl_id=23459", true);
  measure();
})();
</script>
</body>
</html>`;

export default function AviasalesWhiteLabel() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<WidgetState>("loading");
  const [height, setHeight] = useState(400);

  useEffect(() => {
    function handleWidgetMessage(event: MessageEvent) {
      // Opaque sandboxed frame sends origin="null"; event.source is checked.
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object" || data.channel !== "gth-tpwl-frame-23459") return;
      if (data.type === "height" && typeof data.height === "number" && Number.isFinite(data.height)) {
        setHeight(Math.max(360, Math.min(3200, Math.ceil(data.height))));
      } else if (data.type === "loaded") {
        setStatus("loaded");
      } else if (data.type === "error") {
        setStatus("error");
      }
    }
    window.addEventListener("message", handleWidgetMessage);
    return () => window.removeEventListener("message", handleWidgetMessage);
  }, []);

  return (
    <section id="flight-search" aria-labelledby="flight-white-label-heading"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--gold)]">Aviasales · Travelpayouts White Label</p>
      <h2 id="flight-white-label-heading" className="mt-2 text-xl font-bold sm:text-2xl">
        Search flights and view provider results
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Choose airports, dates and passengers below. Available supplier search results appear
        beneath the form. The separate historical fare cache is not used for booking.
      </p>
      {status === "loading" && (
        <p role="status" className="mt-4 text-sm text-[var(--text-soft)]">Loading Aviasales flight search…</p>
      )}
      {status === "error" && (
        <p role="alert" className="mt-4 rounded-xl border border-[var(--border)] p-4 text-sm text-[var(--text-soft)]">
          The supplier flight tool could not load in the isolated frame. You can still use the
          approved Aviasales provider link below to search and book.
        </p>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={whiteLabelDocument}
        title="Aviasales flight search and results"
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="eager"
        className="mt-4 w-full min-w-0 rounded-xl border-0 bg-white"
        style={{ height: height + "px" }}
      />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="flex max-w-2xl items-start gap-2 text-xs leading-5 text-[var(--text-soft)]">
          <ShieldCheck className="mt-0.5 shrink-0" size={15} aria-hidden="true" />
          Search, prices, booking and support are operated by the independent supplier. GTH PRO
          does not issue flight tickets; the seller confirms the final fare and availability.
        </p>
        <a href="/flights/out/aviasales" target="_blank" rel="noopener noreferrer sponsored"
          className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
          Search on Aviasales <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
