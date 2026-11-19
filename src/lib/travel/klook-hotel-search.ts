import {trackKlookDestination} from "./partner-search";
import {resolveHotelRoute,cleanHotelDestination} from "./hotel-routing";

/**
 * Provider-reviewed canonical destination IDs, NEVER OSM hotel IDs or guessed
 * Place IDs. A single adapter generates Klook's actual Hotels category URL.
 * Add destinations here only after independently verifying the supplier
 * category page is for the expected city. No paid API or runtime scraping.
 */
export const VERIFIED_HOTEL_DESTINATIONS: Readonly<Record<string,{id:number;slug:string;locale?:"en-IN"|"none";country:string}>>={
  goa:{id:178,slug:"goa",locale:"none",country:"IN"},
  dubai:{id:78,slug:"dubai",locale:"en-IN",country:"AE"},
  singapore:{id:6,slug:"singapore",country:"SG"},
  tokyo:{id:28,slug:"tokyo",country:"JP"},
  bangkok:{id:4,slug:"bangkok",country:"TH"},
  bali:{id:8,slug:"bali",country:"ID"},
  paris:{id:107,slug:"paris",country:"FR"},
  "new york":{id:93,slug:"new-york",country:"US"},
  seoul:{id:13,slug:"seoul",country:"KR"},
  "kuala lumpur":{id:49,slug:"kuala-lumpur",country:"MY"},
  "hong kong":{id:2,slug:"hong-kong",country:"HK"},
  phuket:{id:7,slug:"phuket",country:"TH"},
};
const cityAlias:Readonly<Record<string,string>>={"new york city":"new york"};
export function trackedHotelCityHref(value:unknown,country?:string|null):string|null{
  const city=cleanHotelDestination(value);
  if(!city)return null;
  const requested=city.toLocaleLowerCase("en");
  const canonical=Object.prototype.hasOwnProperty.call(cityAlias,requested)?cityAlias[requested]:requested;
  if(!Object.prototype.hasOwnProperty.call(VERIFIED_HOTEL_DESTINATIONS,canonical))return null;
  const item=VERIFIED_HOTEL_DESTINATIONS[canonical];
  if(country && /^[A-Z]{2}$/.test(country) && country!==item.country)return null;
  const locale=item.locale==="none"?"":"/"+(item.locale??"en-US");
  const dest=new URL(`https://www.klook.com${locale}/destination/c${item.id}-${item.slug}/3-hotel/`);
  return trackKlookDestination(dest,`gth_hotels_${canonical.replace(/ /g,"_")}`);
}

/** Single data-driven zero-cost hotel destination router, shared site-wide.
 * A direct result is possible only with a reviewed Nuitee Place ID or the
 * actual Klook destination's Hotels listing. Otherwise preserve the requested
 * city on the GTH booking page for explicit supplier selection.
 * Do not auto-select an unrelated airport/place from the supplier's defaults.
 */
export function destinationHotelHref(value:unknown,country?:string|null):string|null{
  const city=cleanHotelDestination(value);
  if(!city)return null;
  const route=resolveHotelRoute({destination:city});
  const reviewedNuiteeCountry:Readonly<Record<string,string>>={mumbai:"IN",london:"GB"};
  const knownCountry=reviewedNuiteeCountry[city.toLocaleLowerCase("en")];
  const countryConflict=Boolean(country&&/^[A-Z]{2}$/.test(country)&&knownCountry&&country!==knownCountry);
  if(route.status==="ready"&&!countryConflict)return route.url;
  const klook=trackedHotelCityHref(city,country);
  if(klook)return klook;
  const params=new URLSearchParams({view:"booking",city});
  if(typeof country==="string"&&/^[A-Z]{2}$/.test(country))params.set("country",country);
  return "/hotels?"+params.toString()+"#hotel-booking-experience";
}
