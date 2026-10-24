"use client";

import { useState, type FormEvent } from "react";
import { ArrowRightLeft, ArrowUpRight } from "lucide-react";

type Mode = "bus" | "train" | "transfer";
const providers: Record<Mode, { label: string; url: string }> = {
  bus: { label: "redBus", url: "https://www.redbus.in/" },
  train: { label: "IRCTC", url: "https://www.irctc.co.in/nget/train-search" },
  transfer: { label: "Welcome Pickups", url: "https://www.welcomepickups.com/" },
};
const labels: Record<Mode, { origin: string; destination: string; date: string }> = {
  bus: { origin: "Departure city", destination: "Arrival city", date: "Journey date" },
  train: { origin: "Departure station or city", destination: "Arrival station or city", date: "Journey date" },
  transfer: { origin: "Pickup airport or location", destination: "Drop-off destination", date: "Pickup date" },
};

function todayLocal(): string {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

export default function TransportPlanner({ mode }: { mode: Mode }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [travellers, setTravellers] = useState(1);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const provider = providers[mode];
  const field = labels[mode];

  function invalidate() {
    setReady(false);
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const origin = from.trim();
    const destination = to.trim();
    const parsed = new Date(date + "T12:00:00");
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
      && !Number.isNaN(parsed.getTime())
      && [parsed.getFullYear(), String(parsed.getMonth() + 1).padStart(2, "0"), String(parsed.getDate()).padStart(2, "0")].join("-") === date;
    if (origin.length < 2 || destination.length < 2 || origin.length > 100 || destination.length > 100) {
      setError("Enter valid departure and arrival locations (2–100 characters each).");
    } else if (origin.toLocaleLowerCase() === destination.toLocaleLowerCase()) {
      setError("Departure and arrival locations must be different.");
    } else if (!validDate || date < todayLocal()) {
      setError("Choose a valid date that is today or later.");
    } else if (!Number.isInteger(travellers) || travellers < 1 || travellers > 8) {
      setError("Choose 1–8 travellers.");
    } else if (mode === "transfer" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime)) {
      setError("Select a valid local pickup time.");
    } else {
      setError("");
      setReady(true);
      return;
    }
    setReady(false);
  }

  return (
    <div className="gth-glass mb-12 rounded-2xl border border-[var(--border)] p-5 md:p-7">
      <h2 className="text-xl font-bold">Plan your route</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
        Prepare your journey here, then check current schedules, prices, availability and payment terms directly with the provider. This is not a live availability search or a reservation.
      </p>
      <form onSubmit={submit} className="mt-3 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4">
        <label className="block text-sm font-semibold">
          {field.origin}
          <input name="origin" type="text" required minLength={2} maxLength={100} autoComplete="off"
            value={from} onChange={(e) => { setFrom(e.target.value); invalidate(); }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-[var(--text)]"
            placeholder={mode === "transfer" ? "Airport, terminal or address" : "Departure location"} />
        </label>
        <label className="block text-sm font-semibold">
          {field.destination}
          <input name="destination" type="text" required minLength={2} maxLength={100} autoComplete="off"
            value={to} onChange={(e) => { setTo(e.target.value); invalidate(); }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-[var(--text)]"
            placeholder="Arrival location" />
        </label>
        <label className="block text-sm font-semibold">
          {field.date}
          <input name="date" type="date" required value={date} onChange={(e) => { setDate(e.target.value); invalidate(); }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-[var(--text)]" />
        </label>
        <label className="block text-sm font-semibold">
          Travellers
          <input name="travellers" type="number" min={1} max={8} step={1} required value={travellers}
            onChange={(e) => { setTravellers(e.target.valueAsNumber); invalidate(); }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-[var(--text)]" />
        </label>
        {mode === "transfer" && (
          <label className="block text-sm font-semibold sm:col-span-2">
            Pickup time (destination local time)
            <input name="time" type="time" required value={pickupTime}
              onChange={(e) => { setPickupTime(e.target.value); invalidate(); }}
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-[var(--text)]" />
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="button" onClick={() => { setFrom(to); setTo(from); invalidate(); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm">
            <ArrowRightLeft size={17} /> Swap route
          </button>
          <button type="submit" className="gth-btn-gold min-h-11 rounded-xl px-6 text-sm font-bold">
            Review journey
          </button>
        </div>
      </form>
      {error && <p role="alert" className="mt-4 text-sm font-semibold">{error}</p>}
      {ready && (
        <section aria-label="Journey review" className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-bold">Journey summary — not booked</h3>
          <p className="mt-3 break-words text-sm leading-7">{from.trim()} → {to.trim()}<br />
            {date} · {travellers} {travellers === 1 ? "traveller" : "travellers"}
            {mode === "transfer" && pickupTime ? " · Pickup " + pickupTime : ""}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            This information stays on this page and is not sent to the provider. Enter your route and date again on {provider.label}, then review its actual terms before paying.
          </p>
          <a href={provider.url} target="_blank" rel="noopener noreferrer"
            className="gth-btn-gold mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold">
            Continue on {provider.label} <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </section>
      )}
    </div>
  );
}
