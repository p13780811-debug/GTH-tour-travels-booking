/**
 * Direct booking destination for source-backed directory records with no verified Nuitee hotelId/placeId.
 * Open the EXISTING Nuitee White Label itself, never loop back through /hotels.
 * A city or OSM hotel name is not a provider ID: do not forge exact-hotel links.
 */
export type HotelStaySelection={checkin?:string;checkout?:string;adults?:number};

export function hotelProviderSearchUrl(destination:string,stay:HotelStaySelection={}):string{
 // A Nuitee search can only preselect actual provider placeId/hotelId values.
 // OSM text + approximate coordinates cannot produce such a verified identity.
 void destination;
 void stay;
 return "https://gthproglobal.nuitee.link/?language=en&currency=INR";
}
