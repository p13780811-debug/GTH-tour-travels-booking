"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, CalendarDays, MapPin, Plane, Search, BedDouble, Compass } from "lucide-react";

type Place = { name: string; code: string; country: string | null };
type Field = "origin" | "destination";
type SearchDefaults = {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
};

const AIRPORT = /^[A-Z]{3}$/;

function todayLocal(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function initialAirport(code: string | undefined, fallback: string): string {
  return code && AIRPORT.test(code) ? code : fallback;
}

export default function FlightHero({ initial = {} }: { initial?: SearchDefaults }) {
  const router = useRouter();
  const listId = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState(initialAirport(initial.origin, "CCU"));
  const [destination, setDestination] = useState(initialAirport(initial.destination, ""));
  const [originCode, setOriginCode] = useState(initialAirport(initial.origin, "CCU"));
  const [destinationCode, setDestinationCode] = useState(initialAirport(initial.destination, ""));
  const [departDate, setDepartDate] = useState(initial.departDate || "");
  const [returnDate, setReturnDate] = useState(initial.returnDate || "");
  const [roundTrip, setRoundTrip] = useState(Boolean(initial.returnDate));
  const [active, setActive] = useState<Field | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setOrigin(initialAirport(initial.origin, "CCU"));
    setDestination(initialAirport(initial.destination, ""));
    setOriginCode(initialAirport(initial.origin, "CCU"));
    setDestinationCode(initialAirport(initial.destination, ""));
    setDepartDate(initial.departDate || "");
    setReturnDate(initial.returnDate || "");
    setRoundTrip(Boolean(initial.returnDate));
  }, [initial.origin, initial.destination, initial.departDate, initial.returnDate]);

  useEffect(() => {
    if (!active) { setPlaces([]); setSuggesting(false); return; }
    const value = (active === "origin" ? origin : destination).trim();
    if (value.length < 2 || value.length > 64) { setPlaces([]); return; }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSuggesting(true);
      try {
        const response = await fetch(`/api/places?term=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const data: unknown = await response.json();
        if (!controller.signal.aborted) {
          setPlaces(Array.isArray(data)
            ? data.filter((item): item is Place => item && typeof item.name === "string" &&
                typeof item.code === "string" && AIRPORT.test(item.code)).slice(0, 8)
            : []);
        }
      } catch {
        if (!controller.signal.aborted) setPlaces([]);
      } finally {
        if (!controller.signal.aborted) setSuggesting(false);
      }
    }, 250);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [active, origin, destination]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const choose = (field: Field, place: Place) => {
    if (field === "origin") {
      setOrigin(`${place.name} (${place.code})`);
      setOriginCode(place.code);
    } else {
      setDestination(`${place.name} (${place.code})`);
      setDestinationCode(place.code);
    }
    setError("");
    setActive(null);
    setPlaces([]);
  };

  const airportCode = (value: string, selected: string): string | null => {
    const typed = value.trim().toUpperCase();
    if (AIRPORT.test(typed)) return typed;
    const display = value.match(/\(([A-Za-z]{3})\)$/);
    if (display && display[1].toUpperCase() === selected) return selected;
    return null;
  };

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
    setOriginCode(destinationCode);
    setDestinationCode(originCode);
    setError("");
    setActive(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const from = airportCode(origin, originCode);
    const to = airportCode(destination, destinationCode);
    const today = todayLocal();

    if (!from || !to || from === to) {
      setError("Choose two different airports using an IATA code or an airport suggestion.");
      return;
    }
    if (!departDate || departDate < today) {
      setError("Choose a valid future departure date.");
      return;
    }
    if (roundTrip && (!returnDate || returnDate < departDate)) {
      setError("Return date must be on or after departure.");
      return;
    }
    const query = new URLSearchParams({ origin: from, destination: to, depart_date: departDate });
    if (roundTrip) query.set("return_date", returnDate);
    setActive(null);
    router.push(`/flights?${query}`);
  };

  const renderAirport = (field: Field, label: string, value: string) => {
    const currentCode = field === "origin" ? originCode : destinationCode;
    return (
      <div className="relative min-w-0 flex-1">
        <label htmlFor={field} className="mb-2 block text-xs font-semibold text-[var(--text-soft)]">{label}</label>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
          <MapPin size={18} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true" />
          <input
            id={field}
            type="text"
            value={value}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={active === field && places.length > 0}
            aria-controls={active === field ? `${listId}-options` : undefined}
            aria-autocomplete="list"
            placeholder={field === "origin" ? "City or airport" : "Where to?"}
            className="min-w-0 w-full bg-transparent text-sm text-[var(--text)] outline-none"
            onFocus={() => setActive(field)}
            onChange={(event) => {
              const next = event.target.value.slice(0, 80);
              if (field === "origin") { setOrigin(next); setOriginCode(""); }
              else { setDestination(next); setDestinationCode(""); }
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") { setActive(null); return; }
              if (event.key === "ArrowDown" && places.length) {
                event.preventDefault();
                document.getElementById(`${listId}-option-0`)?.focus();
                return;
              }
              if (event.key === "Enter" && places.length && !currentCode) {
                event.preventDefault();
                choose(field, places[0]);
              }
            }}
          />
        </div>
        {active === field && (suggesting || places.length > 0) && (
          <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            {suggesting && <p className="px-4 py-3 text-xs text-[var(--text-soft)]" role="status">Finding airports...</p>}
            {places.length > 0 && (
              <ul id={`${listId}-options`} role="listbox" aria-label={`${label} airports`} className="max-h-64 overflow-y-auto">
                {places.map((place, index) => (
                  <li key={place.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      id={`${listId}-option-${index}`}
                      onClick={() => choose(field, place)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setActive(null);
                      }}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-[var(--bg)] focus-visible:outline focus-visible:outline-2"
                    >
                      <span className="truncate">{place.name}{place.country ? `, ${place.country}` : ""}</span>
                      <strong className="text-xs">{place.code}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section ref={root} className="mx-auto w-full max-w-7xl px-4 pt-8 pb-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
            GTH PRO • Global flight discovery
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[var(--text)] md:text-5xl">Find your next flight</h1>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Explore observed fares and compare options before booking directly with a partner.</p>
        </div>
        <nav aria-label="Travel categories" className="flex flex-wrap gap-2 text-sm">
          <Link href="/flights" aria-current="page" className="gth-btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold">
            <Plane size={16} /> Flights
          </Link>
          <Link href="/hotels" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2">
            <BedDouble size={16} /> Hotels
          </Link>
          <Link href="/tours" className="gth-glass inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2">
            <Compass size={16} /> Tours
          </Link>
        </nav>
      </div>
      <form onSubmit={submit} className="gth-glass space-y-4 rounded-3xl border border-[var(--border)] p-4 shadow-lg md:p-6">
        <fieldset className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text)]">
          <legend className="sr-only">Trip type</legend>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input type="radio" name="trip-type" checked={!roundTrip} onChange={() => setRoundTrip(false)} /> One-way
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input type="radio" name="trip-type" checked={roundTrip} onChange={() => setRoundTrip(true)} /> Round-trip
          </label>
        </fieldset>
        <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.7fr)]">
          {renderAirport("origin", "From", origin)}
          <button type="button" onClick={swap} aria-label="Swap departure and destination" className="gth-glass flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)]" title="Swap airports">
            <ArrowLeftRight size={18} aria-hidden="true" />
          </button>
          {renderAirport("destination", "To", destination)}
          <div className="min-w-0">
            <label htmlFor="departure" className="mb-2 block text-xs font-semibold text-[var(--text-soft)]">Departure</label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
              <CalendarDays size={16} className="shrink-0" />
              <input id="departure" type="date" min={todayLocal()} value={departDate} required onChange={(event) => setDepartDate(event.target.value)}
                className="min-w-0 w-full bg-transparent text-sm text-[var(--text)]" />
            </div>
          </div>
          {roundTrip && (
            <div className="min-w-0">
              <label htmlFor="return" className="mb-2 block text-xs font-semibold text-[var(--text-soft)]">Return</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
                <CalendarDays size={16} className="shrink-0" />
                <input id="return" type="date" min={departDate || todayLocal()} value={returnDate} required onChange={(event) => setReturnDate(event.target.value)}
                  className="min-w-0 w-full bg-transparent text-sm text-[var(--text)]" />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-[var(--text-soft)]">
            Travelers, cabin class, baggage and final prices are selected or confirmed on the partner website.
          </p>
          <button type="submit" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-7 py-3 font-semibold">
            <Search size={18} /> Search fares
          </button>
        </div>
        {error && <p role="alert" className="text-sm font-medium text-[var(--text)]">{error}</p>}
      </form>
    </section>
  );
}
