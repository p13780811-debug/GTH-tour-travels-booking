import "server-only";

import { hotelWhiteLabelUrl, normalizeHotelOccupancies } from "../travel/hotel-whitelabel";
import { hotelWhiteLabelSearchUrl } from "../travel/hotel-routing";
import { partnerSearchHref } from "../travel/partner-search";
import { buildCruiseProviderSearch } from "../travel/cruise-provider-search";
import { parseTravelQuery, type CityContext } from "./cityContext";
import {
  PROVIDER_REGISTRY, configuredProviderUrl, isHopeGooCountry,
  isSafeInternalEntry, isSafeProviderOutboundUrl, providerSupports,
  type ProviderId, type ProviderService,
} from "./providerRegistry";

export type AffiliateCapability =
  | "verified_deep_link" | "supplier_search" | "internal_discovery" | "unavailable";
export type AffiliateReason =
  | "disabled" | "invalid_context" | "invalid_query" | "unsupported_service"
  | "missing_verified_identifier" | "provider_selection_required"
  | "verified_supplier_identity" | "validated_partner_search" | "unsafe_target";

export type AffiliateRequest = Readonly<{
  city: CityContext;
  service: ProviderService;
  /** Optional preference; never accepts an arbitrary redirect or supplier URL. */
  provider?: ProviderId;
  /** Untrusted user parameters are parsed and validated again at this boundary. */
  travelParams?: URLSearchParams | Readonly<Record<string, unknown>>;
}>;
export type AffiliateResolution = Readonly<{
  capability: AffiliateCapability;
  reason: AffiliateReason;
  provider: ProviderId | null;
  href: string | null;
  cityId: string | null;
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
): AffiliateResolution {
  return { capability, reason, provider, href, cityId };
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
  if (!input || !safeCity(input.city) || typeof input.service !== "string" ||
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
  const internal = () => result(
    "internal_discovery", "provider_selection_required", provider, fallback, cityId,
  );
  const external = (href: string | null, reason: AffiliateReason) =>
    href && isSafeProviderOutboundUrl(provider, href)
      ? result("supplier_search", reason, provider, href, cityId)
      : internal();

  if (input.service === "hotels") {
    if (provider === "hopegoo") {
      // Generic affiliate landing, not an invented city-specific booking URL.
      return isHopeGooCountry(city.country_code)
        ? external(configuredProviderUrl("hopegoo"), "provider_selection_required")
        : internal();
    }
    if (provider === "nuitee") {
      const placeId = city.verifiedNuiteePlaceId;
      // No check-in/check-out means no claimed direct bookable result.
      if (placeId && travel.checkin && travel.checkout) {
        const occupancies = normalizeHotelOccupancies([{
          adults: travel.adults, children: [...travel.children],
        }]);
        if (occupancies) {
          const href = hotelWhiteLabelUrl({
            placeId,
            checkin: travel.checkin,
            checkout: travel.checkout,
            occupancies,
            currency: travel.currency,
          });
          if (isSafeProviderOutboundUrl("nuitee", href)) {
            return result(
              "verified_deep_link", "verified_supplier_identity",
              "nuitee", href, cityId,
            );
          }
        }
      }
      const picker = hotelWhiteLabelSearchUrl(
        travel.currency,
        travel.checkin && travel.checkout
          ? { checkin: travel.checkin, checkout: travel.checkout,
              occupancies: [{ adults: travel.adults, children: [...travel.children] }] }
          : undefined,
      );
      return isSafeProviderOutboundUrl("nuitee", picker)
        ? result("supplier_search", "missing_verified_identifier", "nuitee", picker, cityId)
        : internal();
    }
    // No unreviewed provider-specific hotel routes are invented.
    return internal();
  }

  if (provider === "klook" &&
      (input.service === "tours" || input.service === "activities")) {
    const href = partnerSearchHref(input.service, city.name);
    return href && isSafeInternalEntry(href)
      ? result("supplier_search", "validated_partner_search", "klook", href, cityId)
      : internal();
  }
  if (provider === "getyourguide" && input.service === "cruises") {
    return external(buildCruiseProviderSearch(city.name, "gyg"), "validated_partner_search");
  }
  // Flights retain the Aviasales WL; 12Go retains its existing trip form;
  // reviewed ticket products and remaining partner widgets are NOT modified.
  return internal();
}
