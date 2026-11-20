import "server-only";

import {
  hotelWhiteLabelUrl, normalizeHotelOccupancies,
} from "../travel/hotel-whitelabel";
import { hotelWhiteLabelSearchUrl } from "../travel/hotel-routing";
import type { CityContext, TravelQuery } from "./cityContext";
import { adapterResult, type AdapterResult } from "./adapterTypes";
import {
  configuredProviderUrl, isHopeGooCountry, isSafeProviderOutboundUrl,
  type ProviderId,
} from "./providerRegistry";

/**
 * The source of a Nuitee Place ID must be the DB-backed CityContext resolver.
 * HopeGoo's generic approved affiliate landing must not be advertised as
 * city-specific, nor receive invented dates/occupancy query fields.
 */
export function resolveHotelAdapter(
  city: CityContext, travel: TravelQuery, selectedProvider: ProviderId,
): AdapterResult {
  if (selectedProvider === "hopegoo") {
    if (!isHopeGooCountry(city.country_code)) {
      return adapterResult("internal_discovery", "provider_selection_required", "hopegoo", null);
    }
    const url = configuredProviderUrl("hopegoo");
    return url && isSafeProviderOutboundUrl("hopegoo", url)
      ? adapterResult("supplier_search", "provider_selection_required", "hopegoo", url)
      : adapterResult("internal_discovery", "missing_approved_partner", "hopegoo", null);
  }
  if (selectedProvider !== "nuitee") {
    return adapterResult("unavailable", "unsupported_service", selectedProvider, null);
  }

  const stay = travel.checkin && travel.checkout ? {
    checkin: travel.checkin,
    checkout: travel.checkout,
    occupancies: normalizeHotelOccupancies([{
      adults: travel.adults, children: [...travel.children],
    }]),
  } : null;
  if (stay && !stay.occupancies) {
    return adapterResult("unavailable", "invalid_route", "nuitee", null);
  }

  if (city.verifiedNuiteePlaceId && stay?.occupancies) {
    const href = hotelWhiteLabelUrl({
      placeId: city.verifiedNuiteePlaceId,
      checkin: stay.checkin, checkout: stay.checkout,
      occupancies: stay.occupancies, currency: travel.currency,
    });
    if (isSafeProviderOutboundUrl("nuitee", href)) {
      return adapterResult("verified_deep_link", "verified_supplier_identity", "nuitee", href, true);
    }
  }

  const picker = hotelWhiteLabelSearchUrl(
    travel.currency, stay && stay.occupancies
      ? { checkin: stay.checkin, checkout: stay.checkout, occupancies: stay.occupancies }
      : undefined,
  );
  return isSafeProviderOutboundUrl("nuitee", picker)
    ? adapterResult("supplier_search", "missing_verified_identifier", "nuitee", picker, Boolean(stay))
    : adapterResult("internal_discovery", "unsafe_target", "nuitee", null);
}
