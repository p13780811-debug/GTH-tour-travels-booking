import Link from "next/link";
import {ArrowUpRight,Compass,Plane,ShieldCheck,Ship} from "lucide-react";

export default function MaldivesConnectivity({departDate,today}:{departDate:string;today:string}){
  return <div className="border-y border-[var(--border)] bg-[var(--bg-soft)]">
    <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-16">
      <section id="maldives-flights" aria-labelledby="maldives-flights-title"
        className="gth-glass flex min-w-0 scroll-mt-24 flex-col rounded-3xl border border-[var(--border)] p-5 sm:p-7">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--gold)]">
          <Plane size={16} aria-hidden="true"/> GTH Global Booking Engine
        </p>
        <h2 id="maldives-flights-title" className="mt-3 text-2xl font-bold tracking-tight">Flights to Malé · MLE</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
          Arrival is fixed to Velana International Airport (MLE). Choose your departure airport
          and date before opening the original flight comparison engine.
        </p>
        <form action="/flights" method="get" className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
          <input type="hidden" name="destination" value="MLE"/>
          <input type="hidden" name="destinationCity" value="Male"/>
          <label className="text-xs font-semibold text-[var(--text-soft)]">Departure airport (IATA)
            <input type="text" name="origin" required minLength={3} maxLength={3} pattern="[A-Za-z]{3}"
              autoCapitalize="characters" placeholder="e.g. BOM" aria-label="Enter your departure airport IATA code"
              className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"/>
          </label>
          <label className="text-xs font-semibold text-[var(--text-soft)]">Depart on
            <input type="date" name="departDate" defaultValue={departDate} min={today} required
              className="mt-1 min-h-11 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"/>
          </label>
          <div className="sm:col-span-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm font-bold">
              <Plane size={17} className="text-[var(--gold)]" aria-hidden="true"/> Destination · MLE · Maldives
            </span>
          </div>
          <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold sm:col-span-2">
            Compare flights to Malé <ArrowUpRight size={16} aria-hidden="true"/>
          </button>
        </form>
        <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
          Flight route context is carried to the existing GTH flight page. The supplier white-label
          widget requires the final airport/date selection; no fare is implied or auto-booked.
        </p>
      </section>

      <section id="maldives-transfers" aria-labelledby="maldives-transfers-title"
        className="gth-glass flex min-w-0 scroll-mt-24 flex-col rounded-3xl border border-[var(--border)] p-5 sm:p-7">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--gold)]">
          <Ship size={16} aria-hidden="true"/> GTH Mobility · Island connections
        </p>
        <h2 id="maldives-transfers-title" className="mt-3 text-2xl font-bold tracking-tight">
          Speedboat & seaplane arrivals
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
          Plan the onward transfer from Malé Airport (MLE) to your specific island or resort.
          Seaplane availability, luggage rules and departure timing depend on the property.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-sm font-bold">Speedboat</p>
            <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Confirm the resort transfer pier, pickup operator, scheduled departure and return arrangements.</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-sm font-bold">Seaplane</p>
            <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Check daylight operating windows, baggage allowances and coordination with your arriving flight.</p>
          </div>
        </div>
        <Link href="/transfers?airport=MLE&city=Male#transfer-widget-airport"
          className="gth-btn-gold mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
          Explore MLE transfers <ArrowUpRight size={16} aria-hidden="true"/>
        </Link>
        <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
          <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true"/>
          Airport intent is shown here; the original transfer supplier widget does not support
          verified airport prefill. Select MLE and your exact resort inside that widget before booking.
        </p>
      </section>
      <div className="lg:col-span-2">
        <Link href="/tours?city=Mal%C3%A9#discover" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
          <Compass size={16} aria-hidden="true"/> Continue to verified Maldives-area experiences <ArrowUpRight size={16} aria-hidden="true"/>
        </Link>
      </div>
    </div>
  </div>;
}
