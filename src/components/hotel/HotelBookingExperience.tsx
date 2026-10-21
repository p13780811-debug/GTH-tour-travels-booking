"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Globe2, RotateCcw, ShieldCheck } from "lucide-react";
import { HOTEL_BOOKING_ORIGIN, HOTEL_WIDGET_SCRIPT, hotelBookingParams,
  hotelWidgetSearchParams, parseHotelBookingSearch } from "@/lib/travel/hotel-whitelabel";

type SearchSDK = {
  init: (options: { domain: string; deepLinkParams: string }) => void;
  SearchBar: { create: (options: {
    selector: string; primaryColor: string;
    labelsOverride: { searchAction: string; placePlaceholderText: string };
    onSearchClick: (value: unknown) => void;
  }) => Promise<void> };
};
type WidgetWindow = Window & { LiteAPI?: SearchSDK };
// Vendor styles/listeners are confined to a disposable document, not the GTH shell.
const searchDocument = '<!doctype html><html lang="en" class="gth-hotel-widget-root"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Search worldwide hotels</title></head><body class="gth-hotel-search-widget"><main id="gth-hotel-search"></main></body></html>';

export default function HotelBookingExperience() {
  const router = useRouter();
  const query = useSearchParams();
  const restored = parseHotelBookingSearch(new URLSearchParams(query.toString()));
  const restoredQuery = restored ? hotelBookingParams(restored).toString() : "";
  const [bookingQuery, setBookingQuery] = useState(restoredQuery);
  const [showSearch, setShowSearch] = useState(!restoredQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const searchFrame = useRef<HTMLIFrameElement>(null);
  const dispose = useRef<(() => void) | null>(null);
  const resultSection = useRef<HTMLDivElement>(null);
  const handoff = bookingQuery ? `/api/hotels/booking?${bookingQuery}` : "";
  useEffect(() => {
    setBookingQuery(restoredQuery);
    if (restoredQuery) setShowSearch(false);
  }, [restoredQuery]);
  useEffect(() => () => { dispose.current?.(); }, []);

  const search = useCallback((payload: unknown) => {
    const params = hotelWidgetSearchParams(payload);
    if (!params) {
      setError("Please select a destination, valid stay dates and guest ages, then search again.");
      return;
    }
    const value = params.toString();
    dispose.current?.();
    setError(""); setBookingQuery(value); setShowSearch(false);
    router.replace(`/hotels?view=booking&${value}`, { scroll: false });
    resultSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [router]);

  const loadSearch = useCallback(async () => {
    dispose.current?.();
    const frame = searchFrame.current, doc = frame?.contentDocument;
    const win = frame?.contentWindow as WidgetWindow | null;
    if (!frame || !doc || !win) return;
    let active = true;
    let layoutObserver: MutationObserver | undefined;
    let themeObserver: MutationObserver | undefined;
    let resizeObserver: ResizeObserver | undefined;
    const deadline = window.setTimeout(() => {
      if (active) { setLoading(false); setError("Hotel search is taking longer than expected. Retry or open our secure booking site below."); }
    }, 20000);
    const resize = () => {
      // Dynamic content height is layout state. Visual styles stay in globals.css.
      if (active) frame.height = String(Math.min(1200, Math.max(420, doc.body.scrollHeight + 24)));
    };
    dispose.current = () => {
      active = false; window.clearTimeout(deadline);
      layoutObserver?.disconnect(); themeObserver?.disconnect(); resizeObserver?.disconnect();
      win.removeEventListener("resize", resize);
    };
    setLoading(true); setError("");
    const syncTheme = () => {
      doc.documentElement.className = `${document.documentElement.className} gth-hotel-widget-root`;
    };
    syncTheme();
    themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    try {
      await new Promise<void>((resolve, reject) => {
        const script = doc.createElement("script");
        script.src = HOTEL_WIDGET_SCRIPT;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Hotel search unavailable"));
        doc.head.appendChild(script);
      });
      if (!active) return;
      if (!win.LiteAPI) throw new Error("Hotel search unavailable");
      // Reuse the app's compiled global styles, after vendor CSS, including in dev.
      for (const sheet of document.querySelectorAll('link[rel="stylesheet"], style')) {
        doc.head.appendChild(sheet.cloneNode(true));
      }
      const color = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
      win.LiteAPI.init({ domain: new URL(HOTEL_BOOKING_ORIGIN).hostname, deepLinkParams: "language=en&currency=INR" });
      await win.LiteAPI.SearchBar.create({
        selector: "#gth-hotel-search", primaryColor: color,
        labelsOverride: { searchAction: "Find rooms", placePlaceholderText: "City, airport or landmark worldwide" },
        onSearchClick: value => { if (active) search(value); },
      });
      if (!active) return;
      layoutObserver = new MutationObserver(resize);
      layoutObserver.observe(doc.body, { childList: true, subtree: true, attributes: true });
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(doc.body);
      win.addEventListener("resize", resize);
      resize(); window.clearTimeout(deadline); setLoading(false);
    } catch {
      if (active) {
        window.clearTimeout(deadline); setLoading(false);
        setError("Hotel search could not load. Retry or use our secure booking site below.");
      }
    }
  }, [search]);

  return <section className="gth-hotel-booking" aria-labelledby="hotel-booking-heading">
    <div className="gth-hotel-booking-heading">
      <div><p className="gth-hotel-eyebrow"><Globe2 size={16} aria-hidden="true" /> GTH PRO worldwide hotel booking</p>
        <h2 id="hotel-booking-heading">Find your next stay</h2>
        <p>Search destinations worldwide. Explore supplier star ratings, photos, amenities and room options for your stay.</p>
      </div>
      <a className="gth-btn gth-hotel-booking-action" href={handoff || `${HOTEL_BOOKING_ORIGIN}/?language=en&currency=INR`}
        target="_blank" rel="noopener noreferrer">Open secure booking site <ExternalLink size={16} aria-hidden="true" /></a>
    </div>
    <p className="gth-hotel-booking-note"><ShieldCheck size={16} aria-hidden="true" />
      Hotel content and rates are supplied by our booking provider. Review taxes, room inclusions and cancellation terms before paying.
    </p>
    {bookingQuery && <button type="button" className="gth-btn gth-hotel-booking-action" aria-expanded={showSearch}
      aria-controls="hotel-live-search" onClick={() => setShowSearch(value => !value)}>
      {showSearch ? "Hide new search" : "Start a new hotel search"}
    </button>}
    {showSearch && <div id="hotel-live-search" className="gth-hotel-search-panel">
      {loading && <p role="status">Loading worldwide hotel search…</p>}
      <iframe key={attempt} ref={searchFrame} srcDoc={searchDocument} onLoad={() => void loadSearch()}
        title="Worldwide hotel destination, dates and guests" className="gth-hotel-search-frame" height="420"
        sandbox="allow-scripts allow-same-origin" />
    </div>}
    {error && <div role="alert" className="gth-hotel-booking-error"><p>{error}</p>
      <button type="button" className="gth-btn gth-hotel-booking-action" onClick={() => {
        dispose.current?.(); setLoading(true); setError(""); setShowSearch(true); setAttempt(value => value + 1);
      }}><RotateCcw size={16} aria-hidden="true" /> Retry hotel search</button>
    </div>}
    <div ref={resultSection} className="gth-hotel-booking-results">
      {handoff && <>
        <div className="gth-hotel-booking-heading"><div><h3>Your stay, rooms and booking options</h3>
          <p>Explore hotel details below. Use the secure booking site for a full-window experience and payment.</p></div>
          <a className="gth-btn-gold gth-hotel-booking-action" href={handoff} target="_blank" rel="noopener noreferrer">
            Continue on secure booking site <ExternalLink size={16} aria-hidden="true" /></a>
        </div>
        <iframe key={handoff} src={handoff} title="GTH PRO hotel availability, amenities and room booking"
          className="gth-hotel-results-frame" height="1000" referrerPolicy="no-referrer" />
        <p className="gth-hotel-booking-note">If results are blocked by your browser, use “Continue on secure booking site”. This link keeps the dates and guests from your GTH search.</p>
      </>}
    </div>
  </section>;
}
