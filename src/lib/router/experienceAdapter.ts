import "server-only";

import { findFlightPartner } from "../flights/partners";
import {
  partnerSearchHref, parsePartnerSearch, buildPartnerSearch,
} from "../travel/partner-search";
import {
  buildCruiseProviderSearch, GETYOURGUIDE_PARTNER_ID,
} from "../travel/cruise-provider-search";
import type { CityContext } from "./cityContext";
import { adapterResult, type AdapterResult } from "./adapterTypes";
import {
  configuredProviderUrl, isSafeInternalEntry,
  isSafeProviderOutboundUrl, type ProviderId, type ProviderService,
} from "./providerRegistry";

function internalEntry(service: ProviderService): string {
  return service === "cruises" ? "/cruises" :
    service === "activities" ? "/activities" : "/tours";
}

/**
 * Existing approved referral generators have priority. Other programs are
 * provider-operated landings, not synthetic city/product result URLs.
 */
export function resolveExperienceAdapter(
  city: CityContext, service: ProviderService, provider: ProviderId,
): AdapterResult {
  const page = internalEntry(service);
  if (service !== "tours" && service !== "activities" && service !== "cruises") {
    return adapterResult("unavailable", "unsupported_service", provider, null);
  }

  if (provider === "klook") {
    if (service === "tours" || service === "activities") {
      const href = partnerSearchHref(service, city.name);
      return href && isSafeInternalEntry(href)
        ? adapterResult("supplier_search", "validated_partner_search", "klook", href, true)
        : adapterResult("internal_discovery", "provider_selection_required", "klook", page);
    }
    const href = buildCruiseProviderSearch(city.name, "klook");
    return href && isSafeProviderOutboundUrl("klook", href)
      ? adapterResult("supplier_search", "validated_partner_search", "klook", href, true)
      : adapterResult("internal_discovery", "provider_selection_required", "klook", page);
  }

  if (provider === "getyourguide") {
    if (service === "cruises") {
      const href = buildCruiseProviderSearch(city.name, "gyg");
      return href && isSafeProviderOutboundUrl("getyourguide", href)
        ? adapterResult("supplier_search", "validated_partner_search", provider, href, true)
        : adapterResult("internal_discovery", "provider_selection_required", provider, page);
    }
    const parsed = parsePartnerSearch({ kind: service, destination: city.name });
    if (!parsed.ok) {
      return adapterResult("internal_discovery", "provider_selection_required", provider, page);
    }
    const url = new URL("https://www.getyourguide.com/s/");
    url.searchParams.set("q", parsed.destination + " " + service);
    url.searchParams.set("partner_id", GETYOURGUIDE_PARTNER_ID);
    url.searchParams.set("utm_medium", "online_publisher");
    url.searchParams.set("cmp", "gthpro_city_search");
    return isSafeProviderOutboundUrl("getyourguide", url.href)
      ? adapterResult("supplier_search", "validated_partner_search", provider, url.href, true)
      : adapterResult("internal_discovery", "unsafe_target", provider, page);
  }

  if (provider === "wegotrip" || provider === "kkday" || provider === "gocity") {
    const existing = findFlightPartner(provider);
    // Only existing source-backed affiliate landings. Do not append city,
    // dates or invented product codes to these short links.
    const url = configuredProviderUrl(provider) ?? existing?.destination ?? null;
    return url && isSafeProviderOutboundUrl(provider, url)
      ? adapterResult("supplier_search", "provider_selection_required", provider, url)
      : adapterResult("internal_discovery", "missing_approved_partner", provider, page);
  }
  if (provider === "tiqets") {
    return adapterResult("internal_discovery", "provider_selection_required", provider, page);
  }
  return adapterResult("unavailable", "unsupported_service", provider, null);
}
