"use client";

import {useEffect,useState} from "react";
import {BedDouble, Compass} from "lucide-react";
import GTHTransportSearchWidget from "@/components/travel/GTHTransportSearchWidget";
import {resolveHotelRoute} from "@/lib/travel/hotel-routing";

const panels = [
  ["hotels", "Hotels"],
  ["transport", "Flights, bus, train & ferry"],
  ["experiences", "Tours & activities"],
] as const;

type Panel = typeof panels[number][0];

export default function DestinationTravelSearch({city, country, countryCode}: {
  city: string;
  country: string | null;
  countryCode: string | null;
}) {
  const [active, setActive] = useState<Panel>("hotels");
  const [transportOpened, setTransportOpened] = useState(false);
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [dateError, setDateError] = useState(false);
  useEffect(() => {
    function alignPanel() {
      const panel = panels.find(([key]) => window.location.hash === "#destination-" + key + "-tab")?.[0];
      if (!panel) return;
      if (panel === "transport") setTransportOpened(true);
      setActive(panel);
    }
    alignPanel();
    window.addEventListener("hashchange", alignPanel);
    return () => window.removeEventListener("hashchange", alignPanel);
  }, []);
  const field = "mt-1 block h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-base text-[var(--text)]";

  return <section id="destination-travel-search" aria-labelledby="destination-travel-heading"
    className="mx-auto max-w-7xl scroll-mt-24 px-4 py-6">
    <div className="gth-glass rounded-2xl border border-[var(--border)] p-4 sm:p-6">
      <h2 id="destination-travel-heading" className="text-xl font-bold sm:text-2xl">
        Plan your trip to {city}
      </h2>
      <div role="group" aria-label="Travel search type" className="mt-4 flex flex-wrap gap-2">
        {panels.map(([key, label]) => <button key={key} id={"destination-"+key+"-tab"} type="button" aria-pressed={active === key}
          onClick={() => {
            setActive(key);
            if (key === "transport") setTransportOpened(true);
            window.history.replaceState(window.history.state, "", "#destination-" + key + "-tab");
          }}
          className={active === key
            ? "gth-btn-gold min-h-11 rounded-xl px-4 text-sm font-semibold"
            : "min-h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold"}>
          {label}
        </button>)}
      </div>
      <div hidden={active !== "hotels"} className="mt-4">
        <form action="/hotels#hotel-booking-experience" method="get" aria-label="Destination hotel search"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={event => {
            const nights = (Date.parse(checkout) - Date.parse(checkin)) / 86_400_000;
            if (checkin < new Date().toISOString().slice(0,10) || nights < 1 || nights > 90) {
              event.preventDefault();
              setDateError(true);
            } else {
              setDateError(false);
              const adults = new FormData(event.currentTarget).get("adults");
              const route = resolveHotelRoute({destination:city,countryCode:countryCode??undefined,
                checkIn:checkin,checkOut:checkout,adults:typeof adults==="string"?adults:undefined});
              if (route.status==="ready") {
                event.preventDefault();
                window.location.assign(route.url);
              }
            }
          }}>
          <input type="hidden" name="view" value="booking"/>
          <input type="hidden" name="city" value={city}/>
          {countryCode && <input type="hidden" name="country" value={countryCode}/>}
          <label className="text-sm font-semibold">Destination
            <input readOnly value={[city, country].filter(Boolean).join(", ")} className={field}/>
          </label>
          <label className="text-sm font-semibold">Check-in
            <input type="date" name="checkin" value={checkin} onChange={event=>setCheckin(event.target.value)} required className={field}/>
          </label>
          <label className="text-sm font-semibold">Check-out
            <input type="date" name="checkout" min={checkin || undefined} value={checkout} onChange={event=>setCheckout(event.target.value)} required className={field}/>
          </label>
          <label className="text-sm font-semibold">Adults
            <input type="number" name="adults" min={1} max={20} defaultValue={2} required className={field}/>
          </label>
          <button className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <BedDouble size={18} aria-hidden="true"/> Find stays
          </button>
        </form>
        {dateError && <p role="alert" className="mt-2 text-sm">Choose current or future stay dates with a check-out 1–90 nights after check-in.</p>}
      </div>
      <div hidden={active !== "transport"} className="mt-4">
        {transportOpened && <>
          <GTHTransportSearchWidget mode="flight" initialDestination={city}/>
          <a href={"/flights?" + new URLSearchParams({destinationCity:city}) + "#flight-search"}
            className="text-sm font-semibold underline">More flight search options</a>
        </>}
      </div>
      {active === "experiences" && <nav aria-label="Destination experiences" className="mt-4 flex flex-wrap gap-3">
        {[["tours", "Explore tours"], ["activities", "Explore activities"], ["attractions", "Explore attractions"]].map(([id, label]) =>
          <a key={id} href={"#destination-" + id} className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <Compass size={17} aria-hidden="true"/>{label}
          </a>)}
      </nav>}
    </div>
  </section>;
}
