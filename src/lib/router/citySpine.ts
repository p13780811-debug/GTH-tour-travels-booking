import "server-only";

import { isResolvedCityContext, type CityContext } from "./cityContext";
import { isSafeInternalEntry } from "./providerRegistry";
import { stadiums, upcomingStadiumEvents } from "../travel/stadiums";

/** Pure, read-only matching to APPROVED sources. No inferred city events. */
export type VerifiedVenueLink = Readonly<{
  name: string;
  slug: string;
  href: string;
  sport: string;
  event?: string;
}>;

export type CitySpineLinks = Readonly<{
  cityId: string;
  venues: readonly VerifiedVenueLink[];
  realEstate: Readonly<{ href: string; scope: "city_filter" | "global"; registryHref: string | null }>;
  tenders: Readonly<{ href: string; scope: "country" | "global"; countryCode: string | null }>;
}>;

const MAHARERA_CITIES = new Set(["mumbai", "thane", "pune", "navi mumbai"]);

export function buildCitySpineLinks(city: CityContext, now = new Date()): CitySpineLinks | null {
  if (!isResolvedCityContext(city)) return null;

  // A venue's flightCity/alias never qualifies as the venue's HOST city.
  const venues = city.country_code ? stadiums
    .filter(v => v.countryCode === city.country_code &&
      v.city.normalize("NFKC").toLocaleLowerCase("en") ===
        city.name.normalize("NFKC").toLocaleLowerCase("en"))
    .map(v => {
      const events = upcomingStadiumEvents(v, now);
      return {
        name: v.name, slug: v.slug, href: "/stadiums/" + v.slug,
        sport: v.sports.join(" · "),
        ...(events.length ? { event: events[0].label } : {}),
      };
    })
    .filter(v => isSafeInternalEntry(v.href))
    .slice(0, 6) : [];

  const verifiedCountry = city.country_code && city.country ? city.country_code : null;
  const realEstateParams = new URLSearchParams();
  if (verifiedCountry) {
    realEstateParams.set("city", city.name);
    realEstateParams.set("country", city.country!);
  }
  const realEstateHref = "/real-estate" +
    (verifiedCountry ? "?" + realEstateParams.toString() : "");
  const registryHref = verifiedCountry === "IN" &&
    MAHARERA_CITIES.has(city.name.normalize("NFKC").toLowerCase())
      ? "/real-estate/registry?" +
        new URLSearchParams({ q: city.name }).toString()
      : null;

  // Tenders currently index jurisdiction by ISO country, not city ID.
  // Never pass a city name as a verified tender-city filter.
  const tenderParams = new URLSearchParams({ scope: "world" });
  if (city.country_code) tenderParams.set("country", city.country_code);
  const tendersHref = "/tender?" + tenderParams.toString();

  return {
    cityId: city.id,
    venues,
    realEstate: {
      href: isSafeInternalEntry(realEstateHref) ? realEstateHref : "/real-estate",
      scope: verifiedCountry ? "city_filter" : "global",
      registryHref: registryHref && isSafeInternalEntry(registryHref) ? registryHref : null,
    },
    tenders: {
      href: isSafeInternalEntry(tendersHref) ? tendersHref : "/tender",
      scope: city.country_code ? "country" : "global",
      countryCode: city.country_code,
    },
  };
}
