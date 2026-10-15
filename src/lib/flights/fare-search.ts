/**
 * Aviasales Data API returns cached fare observations, not bookable inventory.
 * Only safe, public, explicitly selected fields leave the server.
 */
/** Exact route searches are delegated to the partner; no flight times or prices are invented. */
export function fullFlightPartnerSearchUrl(origin: string, destination: string, departure: string, returnDate: string | null = null): string {
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination ||
      !/^\d{4}-\d{2}-\d{2}$/.test(departure) || (returnDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)))
    throw new Error("Invalid flight route");
  const ddmm = (date: string) => date.slice(8,10) + date.slice(5,7);
  const path = origin + ddmm(departure) + destination + (returnDate ? ddmm(returnDate) : "") + "1";
  const url = new URL("https://www.aviasales.com/search/" + path);
  // Currency is an advisory preference. The provider may choose its own regional currency.
  url.searchParams.set("currency", "inr");
  return url.toString();
}

export type FareOption = {
  id: string;
  origin: string;
  destination: string;
  originAirport: string | null;
  destinationAirport: string | null;
  departureAt: string;
  returnAt: string | null;
  airlineCode: string | null;
  flightNumber: string | null;
  price: number;
  currency: "INR";
  transfers: number | null;
  durationMinutes: number | null;
  partnerUrl: string;
};

const AIRPORT = /^[A-Z]{3}$/;
const DEPARTURE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function text(value: unknown, max = 80): string | null {
  return typeof value === "string" && value.trim().length <= max && value.trim()
    ? value.trim()
    : null;
}

function iata(value: unknown): string | null {
  const code = text(value, 3)?.toUpperCase();
  return code && AIRPORT.test(code) ? code : null;
}

function nonnegativeInt(value: unknown, max: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max
    ? value
    : null;
}

function flightPartnerUrl(
  link: unknown,
  origin: string,
  destination: string,
  departure: string,
  returnDate: string | null,
): string {
  if (typeof link === "string" && link.length < 1800 && /^\/(?:search\/)?[A-Za-z]{3}[0-9]{4}[A-Za-z]{3}(?:[0-9]{4})?[1-9]/.test(link) &&
      !/[\x00-\x1f\\]/.test(link)) {
    try {
      const url = new URL(link, "https://www.aviasales.com");
      if (url.origin === "https://www.aviasales.com" && /^\/(?:search\/)?[A-Za-z]{3}[0-9]{4}[A-Za-z]{3}(?:[0-9]{4})?[1-9]/.test(url.pathname)) {
        return url.toString();
      }
    } catch {
      // Fall back to an ordinary route search, never an untrusted URL.
    }
  }
  return fullFlightPartnerSearchUrl(origin, destination, departure, returnDate);
}

export function normalizeFares(
  payload: unknown,
  search: { origin: string; destination: string; departDate: string; returnDate: string | null },
): FareOption[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const data = (payload as Record<string, unknown>).data;
  if (!Array.isArray(data)) return [];

  const normalized: FareOption[] = [];
  const seen = new Set<string>();

  for (const item of data.slice(0, 200)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const fare = item as Record<string, unknown>;
    const price = fare.price;
    const depart = text(fare.departure_at, 45);
    const arrival = text(fare.return_at, 45);
    const origin = iata(fare.origin) ?? search.origin;
    const destination = iata(fare.destination) ?? search.destination;

    if (origin !== search.origin || destination !== search.destination ||
        typeof price !== "number" || !Number.isFinite(price) || price <= 0 ||
        price > 100_000_000 || !depart || !DEPARTURE.test(depart) ||
        depart.slice(0, 10) !== search.departDate) continue;
    if (search.returnDate && (!arrival || arrival.slice(0, 10) !== search.returnDate)) continue;
    const code = text(fare.airline, 3)?.toUpperCase() ?? null;
    const airlineCode = code && /^[A-Z0-9]{2,3}$/.test(code) ? code : null;
    const flightNumber = text(fare.flight_number, 12);
    const key = [depart, arrival ?? "", airlineCode ?? "", flightNumber ?? "", price].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      id: key,
      origin,
      destination,
      originAirport: iata(fare.origin_airport),
      destinationAirport: iata(fare.destination_airport),
      departureAt: depart,
      returnAt: search.returnDate ? arrival : null,
      airlineCode,
      flightNumber,
      price,
      currency: "INR",
      transfers: nonnegativeInt(fare.transfers, 8),
      durationMinutes: nonnegativeInt(fare.duration_to, 5000) ??
        nonnegativeInt(fare.duration, 10000),
      partnerUrl: flightPartnerUrl(fare.link, origin, destination, search.departDate, search.returnDate),
    });
  }

  return normalized.sort((a, b) => a.price - b.price);
}
