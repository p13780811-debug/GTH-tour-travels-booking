import {trackKlookDestination} from "./partner-search.ts";

/**
 * Reviewed, supplier-hosted destination HOTEL category pages only.
 * Do not turn an OSM hotel identifier into a Klook property ID.
 * These links are alternatives to the existing Nuitee White Label and
 * do not assert availability, rates, or affiliate-program eligibility.
 */
const HOTEL_DESTINATIONS:Readonly<Record<string,string>>={
  goa:"https://www.klook.com/destination/c178-goa/3-hotel/",
  dubai:"https://www.klook.com/en-IN/destination/c78-dubai/3-hotel/",
};

export function trackedHotelCityHref(value:unknown):string|null{
  if(typeof value!=="string")return null;
  const city=value.normalize("NFKC").trim().toLocaleLowerCase("en");
  const href=Object.prototype.hasOwnProperty.call(HOTEL_DESTINATIONS,city) ? HOTEL_DESTINATIONS[city] : undefined;
  if(!href)return null;
  return trackKlookDestination(new URL(href),"gth_hotels_"+city);
}

/**
 * Worldwide Klook accommodation gateway for any city without a verified
 * property-level supplier booking ID. This is the provider's genuine global
 * hotel search, not a fabricated city-specific results or hotel listing URL.
 *
 * A city/source label may be used ONLY for a sanitized tracking sub ID.
 * It is NOT appended to the booking URL as an unverified destination ID.
 */
export function trackedWorldwideHotelHref(source:unknown):string{
  const value=typeof source==="string"?source.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim():"";
  const label=value.replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,54).replace(/_+$/g,"")||"worldwide";
  const globalHotelLanding=new URL("https://www.klook.com/hotels/");
  return trackKlookDestination(globalHotelLanding,"gth_hotel_"+label)
    || "https://hotel.gthproglobal.com/";
}
