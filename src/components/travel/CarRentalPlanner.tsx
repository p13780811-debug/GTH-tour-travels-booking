"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, ArrowRightLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";

function localToday() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}
function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  return !Number.isNaN(d.getTime()) &&
    [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-") === s;
}

export default function CarRentalPlanner() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [different, setDifferent] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromTime, setFromTime] = useState("10:00");
  const [toTime, setToTime] = useState("10:00");
  const [driverAge, setDriverAge] = useState("30");
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const [today, setToday] = useState("");
  const dateMin = today || localToday();

  function invalidate() { setReview(false); setError(""); }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const actualDropoff = different ? dropoff.trim() : pickup.trim();
    if (pickup.trim().length < 2 || pickup.trim().length > 120 ||
      actualDropoff.length < 2 || actualDropoff.length > 120) {
      setError("Enter valid pickup and drop-off cities or airport names.");
    } else if (!validDate(fromDate) || !validDate(toDate) || fromDate < localToday() ||
      toDate < fromDate || (toDate === fromDate && toTime <= fromTime)) {
      setError("Choose valid pickup and return dates; return must be after pickup.");
    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(fromTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(toTime)) {
      setError("Choose valid pickup and return times.");
    } else if (!Number.isInteger(Number(driverAge)) || Number(driverAge) < 18 || Number(driverAge) > 99) {
      setError("Enter the main driver's age, between 18 and 99.");
    } else {
      setError("");
      setReview(true);
      return;
    }
    setReview(false);
  }

  return <section aria-labelledby="rental-planner-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">Worldwide trip planning</p>
    <h2 id="rental-planner-heading" className="mt-3 text-2xl font-semibold">Plan a car rental</h2>
    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
      Prepare your pickup and return details. This planner is not an inventory or price search:
      a rental provider will show actual cars, eligibility, availability and booking prices.
    </p>
    <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit} onFocus={()=>{if(!today)setToday(localToday());}}>
      <label className="text-sm font-semibold">Pickup city or airport
        <input type="text" required minLength={2} maxLength={120} autoComplete="off"
          value={pickup} onChange={e=>{setPickup(e.target.value);invalidate();}}
          placeholder="e.g. Dubai International Airport"
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]" />
      </label>
      <label className="text-sm font-semibold">Return location
        <input type="text" required minLength={2} maxLength={120} autoComplete="off"
          disabled={!different} value={different?dropoff:pickup}
          onChange={e=>{setDropoff(e.target.value);invalidate();}}
          placeholder="Same as pickup"
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)] disabled:opacity-70"/>
      </label>
      <label className="sm:col-span-2 inline-flex min-h-10 items-center gap-2 text-sm">
        <input type="checkbox" checked={different} onChange={e=>{setDifferent(e.target.checked);invalidate();}}/>
        Return the vehicle at a different location (one-way rental)
      </label>
      <label className="text-sm font-semibold">Pickup date
        <input type="date" required min={dateMin} value={fromDate} onChange={e=>{setFromDate(e.target.value);invalidate();}}
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]"/>
      </label>
      <label className="text-sm font-semibold">Pickup time (local)
        <input type="time" required value={fromTime} onChange={e=>{setFromTime(e.target.value);invalidate();}}
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]"/>
      </label>
      <label className="text-sm font-semibold">Return date
        <input type="date" required min={fromDate||dateMin} value={toDate} onChange={e=>{setToDate(e.target.value);invalidate();}}
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]"/>
      </label>
      <label className="text-sm font-semibold">Return time (local)
        <input type="time" required value={toTime} onChange={e=>{setToTime(e.target.value);invalidate();}}
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]"/>
      </label>
      <label className="text-sm font-semibold">Main driver's age
        <input type="number" required min="18" max="99" value={driverAge}
          onChange={e=>{setDriverAge(e.target.value);invalidate();}}
          className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-[var(--text)]"/>
      </label>
      <div className="flex items-end">
        <button type="submit" className="gth-btn-gold inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-semibold">
          Review rental details <ArrowRight size={17} aria-hidden="true"/>
        </button>
      </div>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-[var(--text)]">{error}</p>}
    {review && <div role="status" className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
      <h3 className="font-semibold">Your rental request · Not booked</h3>
      <p className="mt-3 flex items-start gap-2 text-sm leading-7"><MapPin size={18} className="mt-1 shrink-0" aria-hidden="true"/>
        {pickup.trim()} <ArrowRightLeft size={16} className="mt-1 shrink-0" aria-hidden="true"/> {different?dropoff.trim():pickup.trim()}
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm leading-7"><CalendarDays size={18} className="mt-1 shrink-0" aria-hidden="true"/>
        {fromDate} {fromTime} → {toDate} {toTime} · Driver age {driverAge}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
        Details are held only in your browser and are not submitted to providers.
        Use the partner widget or open a worldwide car-rental site below and enter these details there.
        One-way charges, licence and minimum driving-age rules vary by country and provider.
      </p>
      <a href="#car-rental-offers" className="gth-btn-gold mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
        Explore partner rental widget <ArrowRight size={16}/>
      </a>
      <a href="https://www.discovercars.com/" target="_blank" rel="noopener noreferrer"
        className="ml-0 mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm sm:ml-3">
        Worldwide rental search <ExternalLink size={16}/>
      </a>
    </div>}
  </section>;
}
