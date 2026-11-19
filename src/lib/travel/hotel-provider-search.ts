import {trackedWorldwideHotelHref} from "./klook-hotel-search.ts";

/**
 * An unverified OSM/registry hotel name is NOT a live bookable hotel ID.
 * The user can browse real hotels on the supplier's worldwide hotel search.
 * Never synthesize a city-specific listing, supplier hotel ID or live room rate.
 * Existing owner-reviewed Nuitee hotel cards keep their direct booking URLs.
 */
export type HotelStaySelection={checkin?:string;checkout?:string;adults?:number};

export function hotelProviderSearchUrl(destination:string,stay:HotelStaySelection={}):string{
  // No unsupported dates or guests are passed to the Klook home/category URL.
  void stay;
  return trackedWorldwideHotelHref(destination);
}
