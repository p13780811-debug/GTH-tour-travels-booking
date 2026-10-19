/** Validate only approved hotel program links; never infer affiliate tracking or property identity. */
export type HotelBookingPartner="klook"|"trip_com"|"booking_com"|"other_approved";
const HOSTS:Record<HotelBookingPartner,readonly string[]>={
 klook:["klook.com","klook.tpo.lv","klook.tp.st","tp.media"],
 trip_com:["trip.com","trip.tpo.lv","trip.tp.st","tp.media"],
 booking_com:["booking.com","booking.tpo.lv","booking.tp.st","tp.media"],
 other_approved:["tp.media","tpo.lv"],
};
export type HotelBookingMapping={
 provider:string;provider_property_id:string;provider_property_url:string;
 affiliate_url:string;hotel_name_at_provider:string;
};
function urlCheck(input:unknown,hosts:readonly string[]):URL|null{
 if(typeof input!=="string"||input.length>2048)return null;
 try{
  const u=new URL(input);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash)return null;
  const host=u.hostname.toLowerCase();
  if(!hosts.some(h=>host===h ||(h==="klook.com"||h==="trip.com"||h==="booking.com")&&host.endsWith("."+h)))return null;
  if(/hotellook/i.test(u.toString()))return null;
  return u;
 }catch{return null;}
}
/** Identity must first be confirmed out of band by an authenticated reviewer, not inferred from name similarity. */
export function validHotelBookingMapping(value:HotelBookingMapping):boolean{
 if(!["klook","trip_com","booking_com","other_approved"].includes(value.provider))return false;
 const p=value.provider as HotelBookingPartner;
 if(!/^[\w.:-]{2,180}$/.test(value.provider_property_id))return false;
 if(typeof value.hotel_name_at_provider!=="string"||value.hotel_name_at_provider.trim().length<3)return false;
 const property=urlCheck(value.provider_property_url,p==="other_approved"?["klook.com","trip.com","booking.com"]:HOSTS[p].filter(h=>h!=="tp.media"&&!h.endsWith(".tpo.lv")&&!h.endsWith(".tp.st")));
 const affiliate=urlCheck(value.affiliate_url,HOSTS[p]);
 if(!property||!affiliate)return false;
 // Reject travel landing pages that only contain a city search.
 if(/\/(?:searchresults|search|destinations?|flights)(?:[/?#]|$)/i.test(property.pathname))return false;
 if(property.pathname==="/"&&!property.searchParams.has("hotelId"))return false;
 return true;
}
export function safeVerifiedHotelAffiliateUrl(value:HotelBookingMapping):string|null{
 if(!validHotelBookingMapping(value))return null;
 return new URL(value.affiliate_url).toString();
}
export function providerDisplayName(value:string):string{
 return ({klook:"Klook",trip_com:"Trip.com",booking_com:"Booking.com",other_approved:"Approved booking partner"} as Record<string,string>)[value]||"Booking partner";
}
