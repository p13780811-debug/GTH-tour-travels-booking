import {normalizeHotelOccupancies} from "./hotel-whitelabel";
import {hotelWhiteLabelSearchUrl,resolveHotelRoute} from "./hotel-routing";
import {trackedHotelCityHref} from "./klook-hotel-search";
import type {ConnectedTrip} from "./connected-trip";

/**
 * Travel's Find stays must hand off to a supplier, never back to Travel,
 * the local OSM directory, or a second GTH booking landing.
 * Existing reviewed White Label place IDs take priority with real dates.
 * A destination without one may use the approved tracked HOTEL category,
 * otherwise the genuine White Label destination picker.
 * No supplier API or new data writes.
 */
export function connectedHotelBookingHref(trip:ConnectedTrip):string|null{
  const occupancy=normalizeHotelOccupancies([{
    adults:trip.adults,rooms:trip.rooms,children:trip.children,
  }]);
  if(!occupancy)return null;
  if(Boolean(trip.start)!==Boolean(trip.end))return null;
  const city=trip.city.normalize("NFKC").trim();
  if(city.length>80||city&&!/^[\p{L}\p{M}\s.'-]+$/u.test(city))return null;

  if(trip.start&&trip.end){
    const route=city?resolveHotelRoute({
      destination:city,checkIn:trip.start,checkOut:trip.end,
      occupancies:occupancy,currency:trip.currency,
    }):null;
    if(route?.status==="invalid")return null;
    if(route?.status==="ready")return route.url;
    const alternative=trackedHotelCityHref(city);
    if(alternative)return alternative;
    const dates=resolveHotelRoute({
      destination:"Mumbai",checkIn:trip.start,checkOut:trip.end,
      occupancies:occupancy,currency:trip.currency,
    });
    // Only use the dates/occupancy validation; never reuse Mumbai placeId.
    if(dates.status!=="ready")return null;
    return hotelWhiteLabelSearchUrl(trip.currency,{
      checkin:trip.start,checkout:trip.end,occupancies:occupancy,
    });
  }
  return trackedHotelCityHref(city)||hotelWhiteLabelSearchUrl(trip.currency);
}
