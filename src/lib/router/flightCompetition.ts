import "server-only";

import { cleanDate, cleanIata } from "../security/validators";
import { airportIndex } from "../travel/nuiteeAirportIndex";
import type { CityContext, TravelQuery } from "./cityContext";
import { configuredNuiteeFlightStayPortal, isSafeInternalEntry } from "./providerRegistry";
import { adapterResult, type AdapterResult } from "./adapterTypes";
import { resolveFlightAdapter, type FlightRouteIntent } from "./flightAdapter";

/** Reviewed provider handoffs. Nuitee has a shared flight+stay portal, NOT a route-specific deep link. */
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
 * Verified public shared-portal entry only. The owner-confirmed Nuitee WL
 * includes a Flights tab; user selects route, dates and flights there.
 * Never fabricate /flights, placeId, search parameters or live fares.
 */
export function resolveNuiteeFlightStayAdapter(): AdapterResult {
  const href = configuredNuiteeFlightStayPortal();
  return href
    ? adapterResult("supplier_search", "provider_selection_required", "nuitee", href, false)
    : adapterResult("unavailable", "unsafe_target", "nuitee", null, false);
}

/**
 * UI compares handoff CAPABILITIES, not prices, inventory, or bookable routes.
 * All three options remain separately provider-operated.
 */
export function compareFlightHandoffs(
  city: CityContext, route?: FlightRouteIntent,
  travel?: TravelQuery, now = new Date(),
): readonly FlightComparisonOption[] {
  const aviasales = resolveFlightAdapter(city, route, now);
  const twelveGo = resolveTwelveGoFlightAdapter(city, route, travel, now);
  const nuitee = resolveNuiteeFlightStayAdapter();
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
      ...nuitee, label: "Nuitee · Flights & Stays",
      detail: "Shared GTH PRO white-label portal with Flights and Stays tabs. Select Flights and enter route/dates on the provider site; no prefilled flight deep link, fare or availability is claimed.",
    },
  ];
}
