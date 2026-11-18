"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Globe2, RotateCcw, ShieldCheck } from "lucide-react";
import { HOTEL_BOOKING_ORIGIN, hotelBookingParams, hotelWhiteLabelUrl, parseHotelBookingSearch } from "@/lib/travel/hotel-whitelabel";
import {resolveHotelRoute, cleanHotelDestination} from "@/lib/travel/hotel-routing";
import {hotelCurrency} from "@/lib/travel/hotel-currency";

// A static first-party form inside the EXISTING iframe and GTH class shell.
// No supplier SDK or Places/autocomplete request is loaded by GTH search input.
const searchDocument = `<!doctype html><html lang="en" class="gth-hotel-widget-root"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Search worldwide hotels</title></head><body class="gth-hotel-search-widget"><main id="gth-hotel-search"><form id="gth-hotel-native-search" class="gth-glass flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] p-3" role="search"><label class="min-w-44 flex-1 text-sm">City or destination<input name="destination" required maxlength="80" autocomplete="off" placeholder="Mumbai, London, Goa…" class="gth-input mt-1 block w-full" /></label><label class="text-sm">Check-in<input name="checkIn" type="date" class="gth-input mt-1 block w-full" /></label><label class="text-sm">Check-out<input name="checkOut" type="date" class="gth-input mt-1 block w-full" /></label><label class="text-sm">Adults<input name="adults" type="number" min="1" max="20" value="2" class="gth-input mt-1 block w-20" /></label><label class="text-sm">Rooms<input name="rooms" type="number" min="1" max="8" value="1" class="gth-input mt-1 block w-20" /></label><button type="submit" class="gth-btn-gold min-h-11 rounded-xl px-4 font-semibold">Find rooms</button></form></main></body></html>`;

export default function HotelBookingExperience({ currency = "INR" }: { searchPath?: "/hotels" | "/app/hotels";currency?:string }) {
  const displayCurrency=hotelCurrency(currency);
  // Supplier results are opened on the White Label, never fetched in a GTH iframe.
  const embedResults = false;
  const query = useSearchParams();
  // A text-only city cannot be converted to a supplier Place ID safely.
  // Carry the intent visibly, then require the official Nuitee destination picker.
  const cityInput=(query.get("city")||query.get("destination")||"").replace(/-/g," ").trim().slice(0,80);
  const hotelInput=(query.get("name")||"").trim().slice(0,80);
  const cityHint=/^[\p{L}\p{M}\s.\x27-]{2,80}$/u.test(cityInput)?cityInput:"";
  const hotelHint=/^[\p{L}\p{M}\p{N}\s.\x27&-]{2,80}$/u.test(hotelInput)?hotelInput:"";
  const restored = parseHotelBookingSearch(new URLSearchParams(query.toString()));
  const restoredQuery = restored ? hotelBookingParams(restored).toString() : "";
  const [bookingQuery, setBookingQuery] = useState(restoredQuery);
  const [showSearch, setShowSearch] = useState(!restoredQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const searchFrame = useRef<HTMLIFrameElement>(null);
  const dispose = useRef<(() => void) | null>(null);
  const initializedDocument = useRef<Document | null>(null);


  // Public supplier URLs work independently of GTH redirect-route deployment/protection.
  // Restore only allowlisted prior booking query strings.
  const selectedStay = bookingQuery ? parseHotelBookingSearch(new URLSearchParams(bookingQuery)) : null;
  const handoff = selectedStay ? hotelWhiteLabelUrl(selectedStay) : "";
  const invalidStay = query.get("bookingError") === "invalid-stay" ||
    (["checkin", "checkout", "occupancies"].some(key => query.has(key)) && !restored);
  useEffect(() => {
    setBookingQuery(restoredQuery);
    if (restoredQuery) setShowSearch(false);
  }, [restoredQuery]);
  useEffect(() => () => { dispose.current?.(); }, []);


  const search = useCallback((payload: {destination:string;checkIn?:string;checkOut?:string;adults?:string;rooms?:string}) => {
    const destination=cleanHotelDestination(payload.destination);
    if (!destination) {
      setError("Enter a valid city or destination.");
      return;
    }
    const result=resolveHotelRoute({...payload,destination,currency:displayCurrency});
    if (result.status==="ready") {
      // Direct browser handoff; no GTH provider Places or rate request.
      window.location.assign(result.url);
      return;
    }
    setError("This destination has no reviewed booking Place ID yet. Open the secure booking site below and select the exact city there.");
  }, [displayCurrency]);

  const loadSearch = useCallback(() => {
    const frame = searchFrame.current, doc = frame?.contentDocument;
    if (!frame || !doc || initializedDocument.current === doc) return;
    dispose.current?.();
    initializedDocument.current = doc;
    const form=doc.getElementById("gth-hotel-native-search") as HTMLFormElement | null;
    if (!form) { setLoading(false);setError("Hotel search could not load.");return; }
    // Existing linked GTH global stylesheet only: no style tags, inline CSS or overrides.
    for (const sheet of document.querySelectorAll('link[rel="stylesheet"]')) {
      doc.head.appendChild(sheet.cloneNode(true));
    }
    const onSubmit=(event:Event)=>{
      event.preventDefault();
      const data=new FormData(form);
      search({destination:String(data.get("destination")??""),
        checkIn:String(data.get("checkIn")??""),checkOut:String(data.get("checkOut")??""),
        adults:String(data.get("adults")??""),rooms:String(data.get("rooms")??"")});
    };
    form.addEventListener("submit",onSubmit);
    const height=()=>{frame.height=String(Math.min(1200,Math.max(110,doc.body.scrollHeight+24)));};
    const observer=new ResizeObserver(height);
    observer.observe(doc.body);
    height();
    dispose.current=()=>{observer.disconnect();form.removeEventListener("submit",onSubmit);};
    setLoading(false);setError("");
  }, [search]);

  // Existing city-level CTAs now open the exact reviewed city in White Label.
  // Unknown cities remain on GTH, never routed to unrelated inventory.
  useEffect(() => {
    if (query.get("manual")==="1" || restoredQuery) return;
    const incoming=query.get("city")||query.get("destination");
    if (!incoming) return;
    const result=resolveHotelRoute({destination:incoming,
      checkIn:query.get("checkin")||undefined,checkOut:query.get("checkout")||undefined,
      adults:query.get("adults")||undefined,rooms:query.get("rooms")||undefined,
      currency:displayCurrency});
    if (result.status==="ready") window.location.replace(result.url);
  }, [query,restoredQuery,displayCurrency]);

  // Bootstrap the static local search form even if iframe content loaded before React hydration.
  useEffect(() => {
    if (showSearch && searchFrame.current?.contentDocument?.readyState === "complete") void loadSearch();
  }, [loadSearch, showSearch, attempt]);

  const searchToggle = bookingQuery ? <button type="button" className="gth-btn gth-hotel-booking-action" aria-expanded={showSearch}
      aria-controls="hotel-live-search" onClick={() => setShowSearch(value => !value)}>
      {showSearch ? "Hide new search" : "Start a new hotel search"}
    </button> : null;

  return <section className="gth-hotel-booking" aria-labelledby="hotel-booking-heading">
    <div className="gth-hotel-booking-heading">
      <div><div className="hidden sm:block"><p className="gth-hotel-eyebrow"><Globe2 size={16} aria-hidden="true" /> GTH PRO worldwide hotel booking</p></div>
        <h2 id="hotel-booking-heading">Find your next stay</h2>
        <p className="hidden sm:block">Search destinations worldwide. Explore supplier star ratings, photos, amenities and room options for your stay.</p>
      </div>
    </div>
    {showSearch && searchToggle}
    {showSearch && (cityHint||hotelHint) && <p role="status" className="gth-hotel-booking-note">
      {cityHint?`Destination requested: ${cityHint}. `:""}{hotelHint?`Hotel requested: ${hotelHint}. `:""}
      Choose dates and guests below. Reviewed cities open direct booking results;
      other destinations require selection on the secure booking site.
    </p>}
    {showSearch && <div id="hotel-live-search" className="gth-hotel-search-panel">
      {loading && <p role="status">Loading local hotel form…</p>}
      <iframe key={attempt} ref={searchFrame} srcDoc={searchDocument} onLoad={() => loadSearch()}
        title="Worldwide hotel destination, dates and guests" className="gth-hotel-search-frame" height="110"
        aria-describedby="hotel-room-occupancy-help" sandbox="allow-scripts allow-same-origin" />
      <p id="hotel-room-occupancy-help">Dates default to tomorrow for one night when omitted. Choose individual child ages on the secure booking site.</p>
    </div>}
    {invalidStay && <p role="alert" className="gth-hotel-booking-note">This saved booking link has incomplete or expired stay details. Please choose your destination, dates and guests again.</p>}
    {error && <div role="alert" className="gth-hotel-booking-error"><p>{error}</p>
      <button type="button" className="gth-btn gth-hotel-booking-action" onClick={() => {
        dispose.current?.(); setLoading(true); setError(""); setShowSearch(true); setAttempt(value => value + 1);
      }}><RotateCcw size={16} aria-hidden="true" /> Retry hotel search</button>
    </div>}
    {!handoff && <a className="gth-btn gth-hotel-booking-action mt-3" href={handoff || `${HOTEL_BOOKING_ORIGIN}/?language=en&currency=${displayCurrency}`}
      target="_blank" rel="noopener noreferrer">Open secure booking site <ExternalLink size={16} aria-hidden="true" /></a>}

    <aside className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]" aria-label="Explore hotels without dates">
      <p>Still choosing where to stay? Browse the GTH PRO hotel directory without dates. Directory listings are for discovery, not proof of live rooms or prices. Exact booking links appear only for independently reviewed hotel matches.</p>
      <a href="/hotels?view=directory" className="gth-btn mt-3 inline-flex min-h-11 items-center gap-2 font-semibold">
        Browse hotels without dates <ExternalLink size={16} aria-hidden="true" />
      </a>
    </aside>

    <div className="gth-hotel-booking-results">
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
    {!showSearch && searchToggle}
    <p className="gth-hotel-booking-note"><ShieldCheck size={16} aria-hidden="true" />
      Hotel content and rates are supplied by our booking provider. Review taxes, room inclusions and cancellation terms before paying.
    </p>
  </section>;
}
