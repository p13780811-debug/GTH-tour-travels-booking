import {HOTEL_BOOKING_ORIGIN} from "@/lib/travel/hotel-whitelabel";

/** Free, supplier-hosted hotel discovery fallback for a GTH directory hotel
 * lacking a verified Nuitee hotelId. Never invent a property match, dates or
 * provider placeId. Opens the actual Nuitee White Label — not our GTH search.
 */
export type HotelStaySelection={checkin?:string;checkout?:string;adults?:number};

export function hotelProviderSearchUrl(destination:string,stay:HotelStaySelection={}):string{
 void destination;
 void stay;
 return HOTEL_BOOKING_ORIGIN+"/hotels?language=en&currency=INR";
}
