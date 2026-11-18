import {airportIndex} from "@/lib/travel/nuiteeAirportIndex";
import type {ConnectedTrip} from "@/lib/travel/connected-trip";

/**
 * /travel Flights only. Reuse the existing validated 12Go flight search gateway.
 * Provider routes use city slugs, not airport IATA codes. The offline airport
 * index supplies city labels; it is not evidence of bookable flight inventory.
 *
 * No 12Go/API fetch is made. If the airports are unknown or the travel date
 * exceeds the gateway's 400-day window, return null so the existing Aviasales
 * itinerary URL remains available instead of showing /flights?search=invalid.
 * 12Go's link searches the departure leg. A round-trip return itinerary is
 * selected separately with the provider; never invent an unsupported argument.
 */
export function connected12GoFlightHref(trip: ConnectedTrip, now = new Date()): string | null {
  const origin = /^[A-Z]{3}$/.test(trip.origin)
    ? airportIndex.find(airport => airport.code === trip.origin) : undefined;
  const destination = /^[A-Z]{3}$/.test(trip.destination)
    ? airportIndex.find(airport => airport.code === trip.destination) : undefined;
  if (!origin || !destination || origin.code === destination.code ||
      origin.city.toLocaleLowerCase("en") === destination.city.toLocaleLowerCase("en")) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trip.start)) return null;
  const departure = Date.parse(trip.start + "T00:00:00Z");
  if (!Number.isFinite(departure) ||
      new Date(departure).toISOString().slice(0,10) !== trip.start ||
      departure < now.getTime() - 2 * 86_400_000 ||
      departure > now.getTime() + 400 * 86_400_000) return null;

  // The original ground-transport route validates, encodes and adds its own
  // approved public affiliate ID before redirecting to 12go.asia/en/flights.
  // Hotel adults are NOT flight passengers: one is the neutral search default.
  const params = new URLSearchParams({
    mode: "flight", from: origin.city, to: destination.city,
    date: trip.start, people: "1",
  });
  return "/go/transport/search?" + params.toString();
}
