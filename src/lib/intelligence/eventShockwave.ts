import "server-only";
import {unstable_cache} from "next/cache";
import {findStadium} from "@/lib/travel/stadiums";
import {venueLocations,safeHotelHandoff} from "@/lib/travel/stadium-concierge";
import {eventHotelBookingHref} from "@/lib/travel/hotel-routing";
import {getOsmPlace} from "@/lib/travel/osm-place-reader";
import {intelligencePublicDb} from "./infraPulse";
import {validTarget,type IntelligenceTarget} from "./contracts";
export type EventTarget={key:string;name:string;city:string|null;country:string|null;lat:number|null;lng:number|null;bookingUrl:string};
export async function resolveEventTarget(target:IntelligenceTarget):Promise<EventTarget|null>{
 if(!validTarget(target))return null;
 if(target.kind==="stadium"){
  const venue=findStadium(target.id);if(!venue)return null;
  const point=venueLocations[venue.slug];
  return {key:"stadium:"+venue.slug,name:venue.name,city:venue.city,country:venue.countryCode,lat:point?.lat??null,lng:point?.lng??null,bookingUrl:safeHotelHandoff(venue)};
 }
 if(target.kind==="osm"){
  const item=await getOsmPlace(target.id).catch(()=>null);if(!item)return null;
  return {key:"osm:"+target.id,name:item.name,city:item.city,country:item.country_code,lat:item.latitude,lng:item.longitude,bookingUrl:eventHotelBookingHref(item.city,item.country_code)};
 }
 const db=intelligencePublicDb();if(!db)return null;
 const source={table:"gth_open_attractions",key:"wikidata_qid",id:target.id,columns:"name,country_code,latitude,longitude"};
 let query=db.from(source.table).select(source.columns).eq(source.key,source.id);
 if(target.kind==="attraction")query=query.eq("is_public",true);
 const {data,error}=await query.limit(1).abortSignal(AbortSignal.timeout(5000));
 const row=data?.[0] as unknown as Record<string,unknown>|undefined;
 if(error||!row||typeof row.name!=="string")return null;
 const city=typeof row.city==="string"?row.city:null,country=typeof row.country_code==="string"?row.country_code:null;
 // Coordinates identify the source venue, never a supplier hotel ID or a room offer.
 const lat=typeof row.latitude==="number"&&Number.isFinite(row.latitude)&&Math.abs(row.latitude)<=90?row.latitude:null;
 const lng=typeof row.longitude==="number"&&Number.isFinite(row.longitude)&&Math.abs(row.longitude)<=180?row.longitude:null;
 return {key:target.kind+":"+target.id,name:row.name,city,country,lat,lng,bookingUrl:eventHotelBookingHref(city,country)};
}
const stays=unstable_cache(async(city:string,country:string)=>{
 const db=intelligencePublicDb();if(!db)return [];
 // The live hotels schema has no coordinates. Exact city and country only;
 // media_rights_verified is photo reuse permission, not operating-status verification.
 const {data,error}=await db.from("hotels").select("id,name,city,country_code,source_name,source_url")
  .eq("city",city).eq("country_code",country).eq("is_public",true).not("source_name","is",null)
  .order("name").limit(5).abortSignal(AbortSignal.timeout(5000));
 if(error)return [];
 return (data||[]).filter(h=>typeof h.name==="string"&&h.name.trim().length>=3).map(h=>({id:String(h.id),name:String(h.name),city:String(h.city)}));
},["gth-event-city-stays-v1"],{revalidate:3600});
export async function readEventStays(venue:EventTarget){
 if(!venue.city||!venue.country)return [];
 try{return await stays(venue.city,venue.country);}catch{return [];}
}
