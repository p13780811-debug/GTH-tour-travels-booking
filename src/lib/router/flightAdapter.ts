import "server-only";

import { cleanDate, cleanIata } from "../security/validators";
import { airportIndex } from "../travel/nuiteeAirportIndex";
import type { CityContext } from "./cityContext";
import { adapterResult, type AdapterResult } from "./adapterTypes";
import { isSafeInternalEntry } from "./providerRegistry";

/**
 * Flight routes use independently selected IATA codes. A city name is never
 * converted to an IATA code without a reviewed, country-matching reference.
 */
export type FlightRouteIntent = Readonly<{
  originIata: unknown;
  destinationIata: unknown;
  departDate: unknown;
  returnDate?: unknown;
}>;

function validDate(value: unknown, now: Date): value is string {
  const date = cleanDate(value);
  if (!date || !Number.isFinite(now.getTime())) return false;
  const dateNum = Date.parse(date + "T00:00:00Z");
  const todayNum = Date.parse(now.toISOString().slice(0, 10) + "T00:00:00Z");
  return dateNum >= todayNum && dateNum <= todayNum + 730 * 86_400_000;
}

export function resolveFlightAdapter(
  city: CityContext, route: FlightRouteIntent | undefined, now = new Date(),
): AdapterResult {
  // TPWL widget ID 23459 owns /flights. No external Aviasales URL replaces it.
  const entry = new URL("/flights", "https://gthproglobal.com");
  entry.searchParams.set("destinationCity", city.name);
  if (route) {
    const origin = cleanIata(route.originIata);
    const destination = cleanIata(route.destinationIata);
    const hasReturn = route.returnDate !== undefined && route.returnDate !== null &&
      route.returnDate !== "";
    if (!origin || !destination || origin === destination ||
      !validDate(route.departDate, now) ||
      (hasReturn && !validDate(route.returnDate, now))) {
      return adapterResult("unavailable", "invalid_route", "aviasales", null);
    }
    if (hasReturn && Date.parse(route.returnDate as string) <=
      Date.parse(route.departDate as string)) {
      return adapterResult("unavailable", "invalid_route", "aviasales", null);
    }
    const to = airportIndex.find(item => item.code === destination);
    const from = airportIndex.find(item => item.code === origin);
    if (!from || !to || !city.country_code ||
      to.countryCode !== city.country_code ||
      to.city.normalize("NFKC").toLocaleLowerCase("en") !==
        city.name.normalize("NFKC").toLocaleLowerCase("en")) {
      const href = entry.pathname + entry.search;
      return isSafeInternalEntry(href)
        ? adapterResult("internal_discovery", "missing_route", "aviasales", href)
        : adapterResult("unavailable", "unsafe_target", "aviasales", null);
    }
    entry.searchParams.set("origin", origin);
    entry.searchParams.set("destination", destination);
    entry.searchParams.set("departDate", route.departDate as string);
    if (hasReturn) entry.searchParams.set("returnDate", route.returnDate as string);
  }
  const href = entry.pathname + entry.search;
  // The existing WL widget does not promise query-based prefill. Search intent
  // is recorded in the GTH URL, but still must be selected in the supplier UI.
  return isSafeInternalEntry(href)
    ? adapterResult("internal_discovery", "provider_selection_required", "aviasales", href)
    : adapterResult("unavailable", "unsafe_target", "aviasales", null);
}
