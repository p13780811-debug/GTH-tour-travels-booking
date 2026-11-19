import {trackKlookDestination} from "./partner-search";
import {resolveHotelRoute,cleanHotelDestination} from "./hotel-routing";

/**
 * Provider-reviewed canonical destination IDs, NEVER OSM hotel IDs or guessed
 * Place IDs. A single adapter generates Klook's actual Hotels category URL.
 * Add destinations here only after independently verifying the supplier
 * category page is for the expected city. No paid API or runtime scraping.
 */
export const VERIFIED_HOTEL_DESTINATIONS: Readonly<Record<string,{id:number;slug:string;locale?:"en-IN"}>>={
  goa:{id:178,slug:"goa"},
  dubai:{id:78,slug:"dubai",locale:"en-IN"},
  singapore:{id:6,slug:"singapore"},
  tokyo:{id:28,slug:"tokyo"},
  bangkok:{id:4,slug:"bangkok"},
  bali:{id:8,slug:"bali"},
  paris:{id:107,slug:"paris"},
  "new york":{id:93,slug:"new-york"},
  london:{id:106,slug:"london"},
  mumbai:{id:132,slug:"mumbai"},
  seoul:{id:13,slug:"seoul"},
  "kuala lumpur":{id:49,slug:"kuala-lumpur"},
  "hong kong":{id:2,slug:"hong-kong"},
  phuket:{id:7,slug:"phuket"},
};
const cityAlias:Readonly<Record<string,string>>={"new york city":"new york"};
export function trackedHotelCityHref(value:unknown):string|null{
  const city=cleanHotelDestination(value);
  if(!city)return null;
  const requested=city.toLocaleLowerCase("en");
  const canonical=Object.prototype.hasOwnProperty.call(cityAlias,requested)?cityAlias[requested]:requested;
  if(!Object.prototype.hasOwnProperty.call(VERIFIED_HOTEL_DESTINATIONS,canonical))return null;
  const item=VERIFIED_HOTEL_DESTINATIONS[canonical];
  const locale=item.locale??"en-US";
  const dest=new URL(`https://www.klook.com/${locale}/destination/c${item.id}-${item.slug}/3-hotel/`);
  return trackKlookDestination(dest,`gth_hotels_${canonical.replace(/ /g,"_")}`);
}

/** Single data-driven zero-cost hotel destination router, shared site-wide.
 * A direct result is possible only with a reviewed Nuitee Place ID or the
 * actual Klook destination's Hotels listing. Otherwise preserve the requested
 * city on the GTH booking page for explicit supplier selection.
 * Do not auto-select an unrelated airport/place from the supplier's defaults.
 */
export function destinationHotelHref(value:unknown):string|null{
  const city=cleanHotelDestination(value);
  if(!city)return null;
  const route=resolveHotelRoute({destination:city});
  if(route.status==="ready")return route.url;
  const klook=trackedHotelCityHref(city);
  if(klook)return klook;
  const params=new URLSearchParams({view:"booking",city});
  return "/hotels?"+params.toString()+"#hotel-booking-experience";
}
