"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Globe2, RotateCcw, ShieldCheck } from "lucide-react";
import { HOTEL_BOOKING_ORIGIN, HOTEL_WIDGET_SCRIPT, hotelBookingParams,
  hotelWidgetSearchParams, hotelWhiteLabelUrl, parseHotelBookingSearch } from "@/lib/travel/hotel-whitelabel";

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

// A hosted cross-origin booking page cannot inherit our responsive card styles.
// Keep it embedded only when the viewport has room for the supplier layout.
const embeddedResultsMedia = "(min-width: 1024px)";
function subscribeResultsViewport(onChange: () => void) {
  const media = window.matchMedia(embeddedResultsMedia);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function resultsViewportSnapshot() { return window.matchMedia(embeddedResultsMedia).matches; }
function serverResultsViewportSnapshot() { return false; }

export default function HotelBookingExperience() {
  const router = useRouter();
  const embedResults = useSyncExternalStore(subscribeResultsViewport, resultsViewportSnapshot, serverResultsViewportSnapshot);
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
  const scrollToResults = useRef(false);
  // Public supplier URLs work independently of GTH redirect-route deployment/protection.
  // The same strict allowlist validates both SDK callbacks and restored query strings.
  const selectedStay = bookingQuery ? parseHotelBookingSearch(new URLSearchParams(bookingQuery)) : null;
  const handoff = selectedStay ? hotelWhiteLabelUrl(selectedStay) : "";
  const invalidStay = query.get("bookingError") === "invalid-stay" ||
    (["checkin", "checkout", "occupancies"].some(key => query.has(key)) && !restored);
  useEffect(() => {
    setBookingQuery(restoredQuery);
    if (restoredQuery) setShowSearch(false);
  }, [restoredQuery]);
  useEffect(() => () => { dispose.current?.(); }, []);
  useEffect(() => {
    if (!bookingQuery || showSearch || !scrollToResults.current) return;
    scrollToResults.current = false;
    resultSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [bookingQuery, showSearch]);

  const search = useCallback((payload: unknown) => {
    const params = hotelWidgetSearchParams(payload);
    if (!params) {
      setError("Please select a destination, valid stay dates and guest ages, then search again.");
      return;
    }
    const stay = parseHotelBookingSearch(params);
    if (!stay) return;
    if (!window.matchMedia(embeddedResultsMedia).matches) {
      // Same-tab navigation gives the supplier the actual phone viewport and
      // leaves Back pointing to the search, rather than a redirect loop.
      window.location.assign(hotelWhiteLabelUrl(stay));
      return;
    }
    const value = params.toString();
    dispose.current?.();
    scrollToResults.current = true;
    setError(""); setBookingQuery(value); setShowSearch(false);
    router.replace(`/hotels?view=booking&${value}`, { scroll: false });
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
      if (active) frame.height = String(Math.min(1200, Math.max(110, doc.body.scrollHeight + 24)));
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
      const enhanced = new WeakSet<HTMLElement>();
      const enhanceSearchControls = () => {
        const destination = doc.querySelector<HTMLInputElement>(".search-input");
        destination?.setAttribute("aria-label", "Worldwide hotel destination");
        const controls: [string, string][] = [
          [".desktop-dates .date-description", "Choose check-in and checkout dates"],
          [".mobile-checkin .date-description", "Choose check-in date"],
          [".mobile-checkout .date-description", "Choose checkout date"],
          [".field.last > span", "Choose guests and rooms; guest counts apply per room"],
        ];
        for (const [selector, label] of controls) {
          const control = doc.querySelector<HTMLElement>(selector);
          if (!control) continue;
          control.setAttribute("role", "button"); control.tabIndex = 0;
          control.setAttribute("aria-label", label);
          if (!enhanced.has(control)) control.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); control.click(); }
          });
          enhanced.add(control);
        }
      };
      enhanceSearchControls();
      const labelGuestControls = () => {
        for (const row of doc.querySelectorAll(".guest-control")) {
          const label = row.querySelector("label")?.textContent?.trim();
          if (!label) continue;
          const buttons = row.querySelectorAll("button");
          buttons[0]?.setAttribute("aria-label", `Decrease ${label.toLowerCase()}`);
          buttons[1]?.setAttribute("aria-label", `Increase ${label.toLowerCase()}`);
          row.querySelector("input")?.setAttribute("aria-label", label);
        }
      };
      layoutObserver = new MutationObserver(() => { enhanceSearchControls(); labelGuestControls(); resize(); });
      layoutObserver.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
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
      <div><div className="hidden sm:block"><p className="gth-hotel-eyebrow"><Globe2 size={16} aria-hidden="true" /> GTH PRO worldwide hotel booking</p></div>
        <h2 id="hotel-booking-heading">Find your next stay</h2>
        <p className="hidden sm:block">Search destinations worldwide. Explore supplier star ratings, photos, amenities and room options for your stay.</p>
      </div>
    </div>
    {bookingQuery && <button type="button" className="gth-btn gth-hotel-booking-action" aria-expanded={showSearch}
      aria-controls="hotel-live-search" onClick={() => setShowSearch(value => !value)}>
      {showSearch ? "Hide new search" : "Start a new hotel search"}
    </button>}
    {showSearch && <div id="hotel-live-search" className="gth-hotel-search-panel">
      {loading && <p role="status">Loading worldwide hotel search…</p>}
      <iframe key={attempt} ref={searchFrame} srcDoc={searchDocument} onLoad={() => void loadSearch()}
        title="Worldwide hotel destination, dates and guests" className="gth-hotel-search-frame" height="110"
        aria-describedby="hotel-room-occupancy-help" sandbox="allow-scripts allow-same-origin" />
      <p id="hotel-room-occupancy-help">Guests and child ages apply to each room. For rooms with different guests, use the secure booking site.</p>
    </div>}
    {invalidStay && <p role="alert" className="gth-hotel-booking-note">This saved booking link has incomplete or expired stay details. Please choose your destination, dates and guests again.</p>}
    {error && <div role="alert" className="gth-hotel-booking-error"><p>{error}</p>
      <button type="button" className="gth-btn gth-hotel-booking-action" onClick={() => {
        dispose.current?.(); setLoading(true); setError(""); setShowSearch(true); setAttempt(value => value + 1);
      }}><RotateCcw size={16} aria-hidden="true" /> Retry hotel search</button>
    </div>}
    {!handoff && <a className="gth-btn gth-hotel-booking-action mt-3" href={handoff || `${HOTEL_BOOKING_ORIGIN}/?language=en&currency=INR`}
      target="_blank" rel="noopener noreferrer">Open secure booking site <ExternalLink size={16} aria-hidden="true" /></a>}
    <p className="gth-hotel-booking-note"><ShieldCheck size={16} aria-hidden="true" />
      Hotel content and rates are supplied by our booking provider. Review taxes, room inclusions and cancellation terms before paying.
    </p>
    <div ref={resultSection} className="gth-hotel-booking-results">
      {handoff && <>
        <div className="gth-hotel-booking-heading"><div><h3>{embedResults ? "Your stay, rooms and booking options" : "Your hotel results"}</h3>
          <p>{embedResults ? "Explore hotel details below. Use the secure booking site for a full-window experience and payment." : "View hotels, total prices and room options on our secure booking site."}</p></div>
          <a className="gth-btn-gold gth-hotel-booking-action" href={handoff} target={embedResults ? "_blank" : undefined} rel="noopener noreferrer">
            Continue on secure booking site <ExternalLink size={16} aria-hidden="true" /></a>
        </div>
        {embedResults && <iframe key={handoff} src={handoff} title="GTH PRO hotel availability, amenities and room booking"
          className="gth-hotel-results-frame" height="1000" referrerPolicy="no-referrer" />}
        {embedResults && <p className="gth-hotel-booking-note">If results are blocked by your browser, use “Continue on secure booking site”. This link keeps the dates and guests from your GTH search.</p>}
      </>}
    </div>
  </section>;
}
