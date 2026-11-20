import "server-only";

import { hotelWhiteLabelUrl, normalizeHotelOccupancies } from "@/lib/travel/hotel-whitelabel";
import { resolveHotelDates } from "@/lib/travel/hotel-routing";
import { parseTravelQuery, type CityContext } from "@/lib/router/cityContext";
import { isSafeProviderOutboundUrl } from "@/lib/router/providerRegistry";

export type DestinationStayHandoff =
  | { status: "direct"; href: string }
  | { status: "select_destination"; href: string }
  | { status: "invalid" };

/**
 * Shared destination-page stays only. White Label /hotels requires an actual
 * supplier Place ID; arbitrary city-name query keys are NOT supported there.
 * No paid Places lookup, guessed IDs, supplier widget changes or DB writes.
 */
export function resolveDestinationStayHandoff(
  city: CityContext,
  query: URLSearchParams,
  now = new Date(),
): DestinationStayHandoff {
  if (!city || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(city.slug) ||
      typeof city.name !== "string" || !city.name.trim() || city.name.length > 160 ||
      city.name.includes("<") || city.name.includes(">")) {
    return { status: "invalid" };
  }
  const parsed = parseTravelQuery(query, now);
  if (!parsed.ok) return { status: "invalid" };

  const travel = parsed.value;
  const dates = resolveHotelDates(travel.checkin, travel.checkout, now);
  // Never change invalid or expired user-selected dates into defaults.
  if ((travel.checkin || travel.checkout) && dates.defaulted) return { status: "invalid" };
  const occupancies = normalizeHotelOccupancies([{
    adults: travel.adults, children: [...travel.children],
  }]);
  if (!occupancies) return { status: "invalid" };

  if (city.verifiedNuiteePlaceId &&
      /^[A-Za-z0-9_-]{5,255}$/.test(city.verifiedNuiteePlaceId)) {
    const href = hotelWhiteLabelUrl({
      placeId: city.verifiedNuiteePlaceId,
      checkin: dates.checkin,
      checkout: dates.checkout,
      occupancies,
      currency: travel.currency,
    });
    return isSafeProviderOutboundUrl("nuitee", href)
      ? { status: "direct", href } : { status: "invalid" };
  }

  // A Nuitee listing WITHOUT placeId would silently open the generic area,
  // which may show nearby Mumbai hotels. Use the existing real supplier
  // destination picker, preserving location and stay intent on the GTH URL.
  const fallback = new URLSearchParams({
    view: "booking",
    city: [city.name, city.country].filter(Boolean).join(" "),
    checkin: dates.checkin,
    checkout: dates.checkout,
    adults: String(travel.adults),
    children: travel.children.join(","),
    currency: travel.currency,
  });
  return { status: "select_destination", href: "/hotels?" + fallback.toString() };
}
