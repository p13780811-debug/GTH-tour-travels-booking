import "server-only";

import { resolveHotelAdapter } from "./hotelAdapter";
import { resolveFlightAdapter, type FlightRouteIntent } from "./flightAdapter";
import { resolveGroundAdapter, type GroundRouteIntent } from "./groundAdapter";
import { resolveExperienceAdapter } from "./experienceAdapter";
import { adapterResult, type AdapterCapability, type AdapterReason, type AdapterResult } from "./adapterTypes";
import { isResolvedCityContext, parseTravelQuery, type CityContext } from "./cityContext";
import {
  PROVIDER_REGISTRY, configuredProviderUrl, isHopeGooCountry,
  isSafeInternalEntry, isSafeProviderOutboundUrl, providerSupports,
  type ProviderId, type ProviderService,
} from "./providerRegistry";

export type AffiliateCapability = AdapterCapability;
export type AffiliateReason = AdapterReason;

export type AffiliateRequest = Readonly<{
  city: CityContext;
  service: ProviderService;
  /** Optional preference; never accepts an arbitrary redirect or supplier URL. */
  provider?: ProviderId;
  /** Untrusted user parameters are parsed and validated again at this boundary. */
  travelParams?: URLSearchParams | Readonly<Record<string, unknown>>;
  flightRoute?: FlightRouteIntent;
  groundRoute?: GroundRouteIntent;
}>;
export type AffiliateResolution = Readonly<{
  capability: AffiliateCapability;
  reason: AffiliateReason;
  provider: ProviderId | null;
  href: string | null;
  cityId: string | null;
  searchIntentForwarded: boolean;
}>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CITY_NAME = /^[\p{L}\p{M}\p{N} .,'’‘()&\/–—`-]{1,160}$/u;
const CITY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SERVICE_IDS = new Set<ProviderService>([
  "hotels", "flights", "bus", "train", "ferry", "transfers",
  "tours", "activities", "tickets", "cars", "cruises",
]);

export function unifiedCityRouterEnabled(): boolean {
  return process.env.ENABLE_UNIFIED_CITY_ROUTER === "true";
}

function result(
  capability: AffiliateCapability,
  reason: AffiliateReason,
  provider: ProviderId | null,
  href: string | null,
  cityId: string | null,
  searchIntentForwarded = false,
): AffiliateResolution {
  return { capability, reason, provider, href, cityId, searchIntentForwarded };
}

function safeCity(city: unknown): city is CityContext {
  if (!city || typeof city !== "object") return false;
  const d = city as Partial<CityContext>;
  return typeof d.id === "string" && UUID.test(d.id) &&
    typeof d.slug === "string" && d.slug.length <= 140 && CITY_SLUG.test(d.slug) &&
    typeof d.name === "string" && CITY_NAME.test(d.name) &&
    (d.country === null || (
      typeof d.country === "string" && CITY_NAME.test(d.country)
    )) &&
    (d.country_code === null || (
      typeof d.country_code === "string" && /^[A-Z]{2}$/.test(d.country_code)
    )) &&
    (d.verifiedNuiteePlaceId === null ||
      (typeof d.verifiedNuiteePlaceId === "string" &&
       /^[A-Za-z0-9_-]{5,255}$/.test(d.verifiedNuiteePlaceId)));
}

function preferredProvider(service: ProviderService): ProviderId {
  switch (service) {
    case "hotels": return "nuitee";
    case "flights": return "aviasales";
    case "bus": case "train": case "ferry": return "12go";
    case "transfers": return "kiwitaxi";
    case "cars": return "qeeq";
    case "tours": case "activities": case "cruises": return "klook";
    case "tickets": return "getyourguide";
  }
}

function discoveryHref(city: CityContext, service: ProviderService): string {
  const params = new URLSearchParams();
  if (service === "hotels") {
    params.set("view", "booking");
    params.set("city", city.name);
    if (city.country_code) params.set("country", city.country_code);
    return "/hotels?" + params.toString();
  }
  if (service === "flights") {
    params.set("destinationCity", city.name);
    return "/flights?" + params.toString();
  }
  if (service === "tours" || service === "activities") {
    params.set("city", city.name);
    return "/" + service + "?" + params.toString();
  }
  if (service === "tickets") {
    params.set("q", city.name);
    return "/tickets?" + params.toString();
  }
  const simple: Record<"bus" | "train" | "ferry" | "transfers" | "cars" | "cruises", string> = {
    bus: "/bus", train: "/train", ferry: "/ferry",
    transfers: "/transfers", cars: "/cars", cruises: "/cruises",
  };
  return simple[service];
}

/**
 * Foundation-only resolver. No existing UI calls this function. The flag is
 * disabled by default and there are NO network writes, paid API requests or
 * direct connections to widget internals. A supplier search is NOT inventory.
 */
export function resolveAffiliateRoute(
  input: AffiliateRequest,
  now: Date = new Date(),
): AffiliateResolution {
  if (!unifiedCityRouterEnabled()) {
    return result("unavailable", "disabled", null, null, null);
  }
  if (!input || !isResolvedCityContext(input.city) || !safeCity(input.city) || typeof input.service !== "string" ||
      !SERVICE_IDS.has(input.service)) {
    return result("unavailable", "invalid_context", null, null, null);
  }
  const city = input.city;
  const cityId = city.id;
  const parsed = parseTravelQuery(input.travelParams ?? {}, now);
  if (!parsed.ok) {
    return result("unavailable", "invalid_query", null, null, cityId);
  }
  const travel = parsed.value;
  const provider = input.provider ?? (
    input.service === "hotels" &&
    isHopeGooCountry(city.country_code) && configuredProviderUrl("hopegoo")
      ? "hopegoo" : preferredProvider(input.service)
  );
  if (typeof provider !== "string" ||
      !Object.prototype.hasOwnProperty.call(PROVIDER_REGISTRY, provider) ||
      !providerSupports(provider, input.service)) {
    return result("unavailable", "unsupported_service", null, null, cityId);
  }

  const fallback = discoveryHref(city, input.service);
  if (!isSafeInternalEntry(fallback)) {
    return result("unavailable", "unsafe_target", provider, null, cityId);
  }

  let adapter: AdapterResult;
  switch (input.service) {
    case "hotels":
      adapter = resolveHotelAdapter(city, travel, provider);
      break;
    case "flights":
      adapter = provider === "aviasales"
        ? resolveFlightAdapter(city, input.flightRoute, now)
        : adapterResult("internal_discovery", "provider_selection_required",
            provider, "/go/transport");
      break;
    case "bus": case "train": case "ferry": case "transfers":
      adapter = resolveGroundAdapter(city, input.service, provider, input.groundRoute, now);
      break;
    case "tours": case "activities": case "cruises":
      adapter = resolveExperienceAdapter(city, input.service, provider);
      break;
    case "cars":
      adapter = provider === "qeeq" || provider === "localrent"
        ? adapterResult("internal_discovery", "provider_selection_required", provider, "/cars")
        : adapterResult("unavailable", "unsupported_service", provider, null);
      break;
    case "tickets":
      // Stadium/events ticket intelligence is restricted to Step 3.
      adapter = adapterResult("internal_discovery", "provider_selection_required", provider, fallback);
      break;
  }
  let href = adapter.href;
  if (href && !(href.startsWith("/")
    ? isSafeInternalEntry(href)
    : isSafeProviderOutboundUrl(provider, href))) {
    return result("unavailable", "unsafe_target", provider, null, cityId);
  }
  if (!href && adapter.capability === "internal_discovery") href = fallback;
  return result(
    adapter.capability, adapter.reason, provider, href, cityId,
    adapter.searchIntentForwarded,
  );
}
