import "server-only";

import { cleanDate, cleanIata } from "../security/validators";
import { airportIndex } from "../travel/nuiteeAirportIndex";
import type { CityContext, TravelQuery } from "./cityContext";
import { isSafeInternalEntry } from "./providerRegistry";
import { adapterResult, type AdapterResult } from "./adapterTypes";
import { resolveFlightAdapter, type FlightRouteIntent } from "./flightAdapter";

/** Fixed, reviewed flight suppliers. Nuitee has NO reviewed flight endpoint. */
export type FlightComparisonOption = Readonly<AdapterResult & {
  label: string;
  detail: string;
}>;

const AIRPORT_LOCATION = /^[\p{L}\p{M}\p{N} .,'()-]{2,80}$/u;
const DAY = 86_400_000;

export function resolveTwelveGoFlightAdapter(
  city: CityContext, route?: FlightRouteIntent,
  travel?: TravelQuery, now = new Date(),
): AdapterResult {
  // The supplier's verified combined transport form remains the default.
  if (!route) return adapterResult(
    "internal_discovery", "provider_selection_required", "12go", "/go/transport",
  );
  const origin = cleanIata(route.originIata);
  const destination = cleanIata(route.destinationIata);
  const date = cleanDate(route.departDate);
  const today = Date.parse(now.toISOString().slice(0, 10) + "T00:00:00Z");
  const departure = date ? Date.parse(date + "T00:00:00Z") : NaN;
  if (!origin || !destination || origin === destination || !date ||
      !Number.isFinite(today) || departure < today || departure > today + 399 * DAY) {
    return adapterResult("unavailable", "invalid_route", "12go", null);
  }

  const fromAirport = airportIndex.find(item => item.code === origin);
  const toAirport = airportIndex.find(item => item.code === destination);
  if (!fromAirport || !toAirport || !city.country_code ||
      toAirport.countryCode !== city.country_code ||
      toAirport.city.normalize("NFKC").toLocaleLowerCase("en") !==
        city.name.normalize("NFKC").toLocaleLowerCase("en") ||
      !AIRPORT_LOCATION.test(fromAirport.city) || !AIRPORT_LOCATION.test(toAirport.city) ||
      fromAirport.city.toLowerCase() === toAirport.city.toLowerCase()) {
    return adapterResult("internal_discovery", "missing_route", "12go", "/go/transport");
  }

  const adults = travel?.adults ?? 2;
  if (!Number.isInteger(adults) || adults < 1 || adults > 8 ||
      (travel?.children.length ?? 0) > 0) {
    // Supplier's route interface does not carry child ages. Preserve the
    // traveller's search intent by leaving them on its own form.
    return adapterResult("internal_discovery", "provider_selection_required", "12go", "/go/transport");
  }
  const url = "/go/transport/search?" + new URLSearchParams({
    mode: "flight", from: fromAirport.city, to: toAirport.city,
    date, people: String(adults),
  }).toString();
  return isSafeInternalEntry(url)
    ? adapterResult("supplier_search", "validated_route_search", "12go", url,
        !route.returnDate)
    : adapterResult("unavailable", "unsafe_target", "12go", null);
}

/**
 * UI compares handoff CAPABILITIES, not flight fares or live stock.
 * A Nuitee "Flight" item explicitly remains unavailable; Nuitee hotels
 * have a separate, existing booking handoff elsewhere in the hub.
 */
export function compareFlightHandoffs(
  city: CityContext, route?: FlightRouteIntent,
  travel?: TravelQuery, now = new Date(),
): readonly FlightComparisonOption[] {
  const aviasales = resolveFlightAdapter(city, route, now);
  const twelveGo = resolveTwelveGoFlightAdapter(city, route, travel, now);
  return [
    {
      ...aviasales, label: "Aviasales · Worldwide Flights",
      detail: "Existing GTH flight white-label (WL 23459). Confirm airport, dates and fare in the supplier form.",
    },
    {
      ...twelveGo, label: "12Go · Flights & Connections",
      detail: "Provider-operated flight and onward-transport search. Only validated routes are forwarded.",
    },
    {
      ...adapterResult("unavailable", "missing_approved_partner", "nuitee", null),
      label: "Nuitee · Stay Companion",
      detail: "Nuitee hotel booking is available separately. No verified Nuitee flight-booking endpoint is configured.",
    },
  ];
}
