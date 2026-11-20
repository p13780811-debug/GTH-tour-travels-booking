import "server-only";

import { cleanDate, cleanPositiveInteger } from "../security/validators";
import { findBookawayRoute } from "../travel/bookaway-routes";
import { findFlightPartner } from "../flights/partners";
import { isResolvedCityContext, type CityContext } from "./cityContext";
import { adapterResult, type AdapterResult } from "./adapterTypes";
import {
  configuredProviderUrl, isSafeInternalEntry, isSafeProviderOutboundUrl,
  type ProviderId, type ProviderService,
} from "./providerRegistry";

export type GroundRouteIntent = Readonly<{
  /** Must be produced by resolveCityContext, not a caller-created city string. */
  originCity: CityContext;
  date: unknown;
  passengers: unknown;
}>;

function validDate(value: unknown, now: Date): value is string {
  const date = cleanDate(value);
  if (!date || !Number.isFinite(now.getTime())) return false;
  const start = Date.parse(date + "T00:00:00Z");
  const today = Date.parse(now.toISOString().slice(0, 10) + "T00:00:00Z");
  return start >= today && start <= today + 399 * 86_400_000;
}

/**
 * Only existing 12Go/Bookaway route handlers form supplier routes.
 * We never synthesize a third-party path or claim seats/availability.
 */
export function resolveGroundAdapter(
  city: CityContext, service: ProviderService, provider: ProviderId,
  route: GroundRouteIntent | undefined, now = new Date(),
): AdapterResult {
  const page = service === "transfers" ? "/transfers" :
    service === "bus" || service === "train" || service === "ferry"
      ? "/" + service : "/travel";

  if (service === "transfers") {
    if (provider === "kiwitaxi" || provider === "intui" || provider === "12go") {
      return adapterResult("internal_discovery", "provider_selection_required", provider, "/transfers");
    }
    if (provider === "welcome_pickups" || provider === "gettransfer") {
      const program = findFlightPartner(provider === "welcome_pickups" ? "welcome" : "gettransfer");
      const approved = configuredProviderUrl(provider) ?? program?.destination ?? null;
      return approved && isSafeProviderOutboundUrl(provider, approved)
        ? adapterResult("supplier_search", "provider_selection_required", provider, approved)
        : adapterResult("internal_discovery", "missing_approved_partner", provider, "/transfers");
    }
    return adapterResult("unavailable", "unsupported_service", provider, null);
  }

  if (service !== "bus" && service !== "train" && service !== "ferry") {
    return adapterResult("unavailable", "unsupported_service", provider, null);
  }
  if (provider !== "12go" && provider !== "bookaway") {
    return adapterResult("unavailable", "unsupported_service", provider, null);
  }
  if (!route) {
    return adapterResult("internal_discovery", "missing_route", provider, page);
  }
  if (!isResolvedCityContext(route.originCity) || !route.originCity.country_code ||
      !city.country_code || route.originCity.id === city.id ||
      route.originCity.name.toLocaleLowerCase("en") === city.name.toLocaleLowerCase("en") ||
      !/^[\p{L}\p{M}\p{N} .,'()-]{2,80}$/u.test(route.originCity.name) ||
      !/^[\p{L}\p{M}\p{N} .,'()-]{2,80}$/u.test(city.name)) {
    return adapterResult("unavailable", "invalid_route", provider, null);
  }
  const date = validDate(route.date, now) ? route.date : null;
  const passengers = cleanPositiveInteger(route.passengers, { min: 1, max: 8 });
  if (!date || !passengers) {
    return adapterResult("unavailable", "invalid_route", provider, null);
  }
  if (provider === "bookaway" &&
      !findBookawayRoute(service, route.originCity.name, city.name)) {
    return adapterResult("internal_discovery", "missing_route", provider, page);
  }
  const path = provider === "bookaway" ? "/go/transport/bookaway" : "/go/transport/search";
  const params = new URLSearchParams({
    mode: service, from: route.originCity.name, to: city.name,
    date, people: String(passengers),
  });
  const href = path + "?" + params.toString();
  return isSafeInternalEntry(href)
    ? adapterResult("supplier_search", "validated_route_search", provider, href,
        provider === "12go")
    : adapterResult("unavailable", "unsafe_target", provider, null);
}
