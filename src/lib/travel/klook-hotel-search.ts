import {trackKlookDestination} from "./partner-search";
import {resolveHotelRoute,cleanHotelDestination} from "./hotel-routing";

/** Destination-specific hotel pages observed on the real Klook website.
 * A Klook general search query is NOT proof of a matched city/hotel listing.
 * Add a destination only after verifying its exact Hotels-category URL.
 */
const VERIFIED_HOTEL_DESTINATIONS:Readonly<Record<string,{country:string;href:string}>>={
  goa:{country:"IN",href:"https://www.klook.com/destination/c178-goa/3-hotel/"},
  dubai:{country:"AE",href:"https://www.klook.com/en-IN/destination/c78-dubai/3-hotel/"},
  tokyo:{country:"JP",href:"https://www.klook.com/destination/c28-tokyo/3-hotel/"},
  singapore:{country:"SG",href:"https://www.klook.com/destination/c6-singapore/3-hotel/"},
};

export function trackedHotelCityHref(value:unknown,countryCode?:string):string|null{
  const destination=cleanHotelDestination(value);
  if(!destination)return null;
  const key=destination.toLocaleLowerCase("en");
  const target=Object.prototype.hasOwnProperty.call(VERIFIED_HOTEL_DESTINATIONS,key)
    ?VERIFIED_HOTEL_DESTINATIONS[key]:undefined;
  if(!target || (countryCode !== undefined && countryCode !== target.country))return null;
  return trackKlookDestination(new URL(target.href),"gth_hotels_"+key.replace(/ /g,"_"));
}

/** Single zero-API city handoff used by vetted destination cards.
 * 1. Actual reviewed Nuitee Place ID -> supplier results.
 * 2. Reviewed Klook Hotels-category destination -> tracked Hotels page.
 * 3. Unknown city -> genuine Nuitee SearchBar with validated city hint.
 * No guessed provider placeId, propertyId, category URL or fake availability.
 */
export function destinationHotelHref(value:unknown,countryCode?:string):string|null{
  const city=cleanHotelDestination(value);
  if(!city)return null;
  const route=resolveHotelRoute({destination:city,countryCode});
  if(route.status==="ready")return route.url;
  // Unknown destinations must use genuine supplier selection; never guess Place IDs.
  const reviewedAlternative=trackedHotelCityHref(city,countryCode);
  if(reviewedAlternative)return reviewedAlternative;
  const params=new URLSearchParams({view:"booking",city,...(countryCode&&/^[A-Z]{2}$/.test(countryCode)?{country:countryCode}:{})});
  return "/hotels?"+params.toString()+"#hotel-booking-experience";
}

/** A separately verified local listing alternative, not a hotel profile feed.
 * Keep original booking handoffs unchanged; local discovery can offer this
 * explicit secondary action without inventing property IDs or prices. */
export function localHotelAlternativeHref(value:unknown,countryCode:string):string|null{
  const city=cleanHotelDestination(value);
  if(!city||! /^[A-Z]{2}$/.test(countryCode))return null;
  if(countryCode==="IN"&&city.toLocaleLowerCase("en")==="kolkata")
    return trackKlookDestination(new URL("https://www.klook.com/destination/c271-kolkata/3-hotel/"),"gth_hotels_kolkata");
  return trackedHotelCityHref(city,countryCode);
}
