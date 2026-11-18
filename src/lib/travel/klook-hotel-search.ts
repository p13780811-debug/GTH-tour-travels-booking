import {trackKlookDestination} from "./partner-search";

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
  const href=HOTEL_DESTINATIONS[city];
  if(!href)return null;
  return trackKlookDestination(new URL(href),"gth_hotels_"+city);
}
