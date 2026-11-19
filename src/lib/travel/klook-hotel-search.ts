import {trackKlookDestination} from "./partner-search";
import {resolveHotelRoute,cleanHotelDestination} from "./hotel-routing";

/**
 * Verified Klook HOTEL-category destination identifiers, not attraction pages
 * or guessed search IDs. Every recorded path is an existing Klook hotel list.
 * Maintain this one catalog for all hotel CTAs (guides, quick-search and cards).
 *
 * The resolver itself is dynamic for any user supplied destination. Add newly
 * verified supplier IDs here, never fork city-specific routing into components.
 */
const VERIFIED_HOTEL_DESTINATIONS:Readonly<Record<string,string>>={
  "goa":"c178-goa",
  "dubai":"c78-dubai",
  "tokyo":"c28-tokyo",
  "singapore":"c6-singapore",
  "paris":"c107-paris",
  "london":"c106-london",
  "bangkok":"c4-bangkok",
  "rome":"c92-rome",
  "new york":"c93-new-york",
  "mumbai":"c132-mumbai",
  "kolkata":"c271-kolkata",
  "chennai":"c274-chennai",
  "hyderabad":"c252-hyderabad",
  "ahmedabad":"c303-ahmedabad",
  "jaipur":"c149-jaipur",
  "new delhi":"c145-delhi",
  "bali":"c8-bali",
};
const DESTINATION_ALIASES:Readonly<Record<string,string>>={
  "delhi":"new delhi",
};
function cityKey(value:unknown):string|null{
  // Normalize human names/slugs to one canonical key, with NO arbitrary URLs.
  if(typeof value!=="string")return null;
  const city=cleanHotelDestination(value.replace(/-/g," "));
  if(!city)return null;
  const key=city.toLocaleLowerCase("en");
  return Object.prototype.hasOwnProperty.call(DESTINATION_ALIASES,key)
    ?DESTINATION_ALIASES[key]:key;
}
export function trackedHotelCityHref(value:unknown):string|null{
  const key=cityKey(value);
  if(!key||!Object.prototype.hasOwnProperty.call(VERIFIED_HOTEL_DESTINATIONS,key))return null;
  const canonical=VERIFIED_HOTEL_DESTINATIONS[key];
  const url=new URL("https://www.klook.com/destination/"+canonical+"/3-hotel/");
  const subId="gth_hotels_"+key.replace(/[^a-z0-9]+/g,"_");
  return trackKlookDestination(url,subId);
}

/**
 * Canonical destination routing for every GTH hotel card/search CTA:
 * 1) Supplier-reviewed Nuitee Place ID -> exact supplier city results;
 * 2) Independently reviewed Klook Hotels-category URL -> city hotel listing;
 * 3) All other cities -> original Nuitee SearchBar, with typed city intent.
 *
 * A paid places-lookup API is intentionally NOT used. The search fallback is
 * not misrepresented as an exact listing, and never invents a supplier ID.
 */
export function destinationHotelHref(value:unknown):string|null{
  const key=cityKey(value);
  if(!key)return null;
  const route=resolveHotelRoute({destination:key});
  if(route.status==="ready")return route.url;
  const exact=trackedHotelCityHref(key);
  if(exact)return exact;
  const original=typeof value==="string"?value.replace(/-/g," "):key;
  const params=new URLSearchParams({view:"booking",city:cleanHotelDestination(original)||key});
  return "/hotels?"+params.toString()+"#hotel-booking-experience";
}
