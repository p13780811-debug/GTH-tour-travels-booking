import {trackKlookDestination} from "./partner-search";

/**
 * Use verified Klook HOTEL category URLs where available. For other editorial
 * cities, use Klook's destination-specific hotel search results rather than
 * inventing supplier destination IDs or falling back to another search form.
 * Existing Travelpayouts affiliate identifiers remain unchanged.
 */
const HOTEL_DESTINATIONS:Readonly<Record<string,string>>={
  goa:"https://www.klook.com/destination/c178-goa/3-hotel/",
  dubai:"https://www.klook.com/en-IN/destination/c78-dubai/3-hotel/",
};
const SEARCHABLE_CITIES=new Set(["mumbai","london","singapore","tokyo","kolkata","calcutta"]);

export function trackedHotelCityHref(value:unknown):string|null{
  if(typeof value!=="string")return null;
  const city=value.normalize("NFKC").trim().toLocaleLowerCase("en");
  if(!/^[a-z][a-z ]{1,79}$/.test(city))return null;
  const verified=Object.prototype.hasOwnProperty.call(HOTEL_DESTINATIONS,city)
    ? HOTEL_DESTINATIONS[city] : undefined;
  if(!verified&&!SEARCHABLE_CITIES.has(city))return null;
  const destination=new URL(verified??"https://www.klook.com/en-IN/search/result/");
  if(!verified)destination.searchParams.set("query",city+" hotels");
  return trackKlookDestination(destination,"gth_hotels_"+city.replace(/ /g,"_"));
}
