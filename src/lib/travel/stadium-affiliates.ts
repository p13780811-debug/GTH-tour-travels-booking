import { GETYOURGUIDE_PARTNER_ID } from "./cruise-provider-search";
import { trackKlookDestination } from "./partner-search";
import type { StadiumProduct } from "./stadiums";

export function stadiumAffiliateHref(product: StadiumProduct, venueSlug: string): string | null {
  const destination = URL.parse(product.url);
  if (!destination || destination.search || destination.hash || destination.username || destination.password) return null;
  if (!/^[a-z0-9-]{1,55}$/.test(venueSlug)) return null;

  const subId = `gth_stadium_${venueSlug}`;
  if (product.provider === "klook") {
    if (!/^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?activity\/[1-9]\d*-[a-z0-9-]+\/$/.test(destination.pathname)) return null;
    return trackKlookDestination(destination, subId);
  }

  if (product.provider !== "getyourguide" || destination.origin !== "https://www.getyourguide.com" ||
      !/^\/[a-z0-9-]+-l[1-9]\d*\/[a-z0-9-]+-t[1-9]\d*\/$/.test(destination.pathname)) return null;

  destination.searchParams.set("partner_id", GETYOURGUIDE_PARTNER_ID);
  destination.searchParams.set("utm_medium", "online_publisher");
  destination.searchParams.set("cmp", subId);
  return destination.href;
}
