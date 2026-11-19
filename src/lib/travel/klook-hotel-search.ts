import {trackKlookDestination} from "./partner-search";
import {resolveHotelRoute,cleanHotelDestination} from "./hotel-routing";

/** Destination-specific hotel pages observed on the real Klook website.
 * A Klook general search query is NOT proof of a matched city/hotel listing.
 * Add a destination only after verifying its exact Hotels-category URL.
 */
const VERIFIED_HOTEL_DESTINATIONS:Readonly<Record<string,string>>={
  goa:"https://www.klook.com/destination/c178-goa/3-hotel/",
  dubai:"https://www.klook.com/en-IN/destination/c78-dubai/3-hotel/",
};

export function trackedHotelCityHref(value:unknown):string|null{
  const destination=cleanHotelDestination(value);
  if(!destination)return null;
  const key=destination.toLocaleLowerCase("en");
  const href=Object.prototype.hasOwnProperty.call(VERIFIED_HOTEL_DESTINATIONS,key)
    ?VERIFIED_HOTEL_DESTINATIONS[key]:undefined;
  if(!href)return null;
  return trackKlookDestination(new URL(href),"gth_hotels_"+key.replace(/ /g,"_"));
}

/** Single zero-API city handoff used by vetted destination cards.
 * 1. Actual reviewed Nuitee Place ID -> supplier results.
 * 2. Reviewed Klook Hotels-category destination -> tracked Hotels page.
 * 3. Unknown city -> genuine Nuitee SearchBar with validated city hint.
 * No guessed provider placeId, propertyId, category URL or fake availability.
 */
export function destinationHotelHref(value:unknown):string|null{
  const city=cleanHotelDestination(value);
  if(!city)return null;
  const route=resolveHotelRoute({destination:city});
  if(route.status==="ready"&&!route.datesDefaulted)return route.url;
  // Date-free editorial entries must not quietly book for tomorrow.
  const reviewedAlternative=trackedHotelCityHref(city);
  if(reviewedAlternative)return reviewedAlternative;
  const params=new URLSearchParams({view:"booking",city});
  return "/hotels?"+params.toString()+"#hotel-booking-experience";
}
