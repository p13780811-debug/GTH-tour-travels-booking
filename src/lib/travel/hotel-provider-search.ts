/**
 * Fallback for directory hotel records without a verified exact-property mapping.
 * A supplier search with the hotel's name is NOT proof of a matching hotel.
 * Use the existing approved GTH PRO Nuitee white-label search UI instead.
 * Do not forward arbitrary city text or guessed provider property IDs.
 */
export type HotelStaySelection={checkin?:string;checkout?:string;adults?:number};

export function hotelProviderSearchUrl(destination:string,stay:HotelStaySelection={}):string{
 // A Nuitee search can only preselect actual provider placeId/hotelId values.
 // OSM text + approximate coordinates cannot produce such a verified identity.
 void destination;
 void stay;
 return "/hotels?view=booking";
}
