import "server-only";
import {cache} from "react";
import {getHotelMarket} from "@/lib/travel/nuitee-hotel-markets";
import {hotelSourceImageUrl} from "@/lib/travel/hotel-source-image";

/**
 * Bounded, cached Nuitee metadata discovery. No checkout, rates, secrets in client JS,
 * Supabase reads/writes, import cron or per-page API key usage.
 * 15 allowlisted markets x one supplier catalogue request every 7 days at most
 * while the Next data cache is retained. Actual supplier quotas may differ.
 */
export type NuiteeMarketHotel={
 id:string;name:string;city:string;address:string;photo:string|null;
 stars:number|null;rating:number|null;
};
export type NuiteeMarketFeed={
 status:"ready"|"not-connected"|"temporarily-unavailable";
 sandbox:boolean;hotels:NuiteeMarketHotel[];
};
export const HOTEL_FEED_REVALIDATE_SECONDS=7*24*60*60;
const MAX_HOTELS=12;
const HOTEL_ID=/^[A-Za-z0-9_-]{2,100}$/;

export function validNuiteeHotelId(value:string):boolean { return HOTEL_ID.test(value); }

function credentials():{key:string;sandbox:boolean}|null {
 if(process.env.VERCEL_ENV==="production"){
   const key=process.env.NUITEE_PRODUCTION_API_KEY;
   return process.env.GTH_NUITEE_PRODUCTION_ENABLED==="true"&&key
     ? {key,sandbox:false}:null;
 }
 const key=process.env.NUITEE_SANDBOX_API_KEY;
 return key?{key,sandbox:true}:null;
}
function clean(value:unknown,max:number):string {
 return typeof value==="string" ? value.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):"";
}
function numberInRange(value:unknown,min:number,max:number):number|null{
 return typeof value==="number"&&Number.isFinite(value)&&value>=min&&value<=max?value:null;
}
function normalize(value:unknown,city:string):NuiteeMarketHotel|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 const id=clean(v.id,100),name=clean(v.name,180);
 if(!validNuiteeHotelId(id)||name.length<4)return null;
 const rightsApproved=process.env.GTH_NUITEE_MEDIA_RIGHTS_APPROVED==="true";
 return {
   id,name,city:clean(v.city,100)||city,address:clean(v.address,300),
   photo:rightsApproved?(hotelSourceImageUrl(v.main_photo)||hotelSourceImageUrl(v.thumbnail)):null,
   stars:numberInRange(v.stars,1,5),rating:numberInRange(v.rating,0,10)
 };
}

export const getNuiteeMarketFeed=cache(async(slug:string):Promise<NuiteeMarketFeed>=>{
 const market=getHotelMarket(slug);
 if(!market)return {status:"not-connected",sandbox:false,hotels:[]};
 const auth=credentials();
 if(!auth)return {status:"not-connected",sandbox:false,hotels:[]};
 try{
   const url=new URL("https://api.liteapi.travel/v3.0/data/hotels");
   url.searchParams.set("countryCode",market.countryCode);
   url.searchParams.set("cityName",market.supplierCity);
   url.searchParams.set("language","en");
   url.searchParams.set("limit","24");
   // Server-side key only. Cache reduces both Vercel invocations and supplier traffic.
   const response=await fetch(url,{
     headers:{"X-API-Key":auth.key,"Accept":"application/json"},
     signal:AbortSignal.timeout(8500),
     next:{revalidate:HOTEL_FEED_REVALIDATE_SECONDS}
   });
   if(!response.ok)return {status:"temporarily-unavailable",sandbox:auth.sandbox,hotels:[]};
   const json:unknown=await response.json();
   if(!json||typeof json!=="object"||!Array.isArray((json as {data?:unknown}).data))
     return {status:"temporarily-unavailable",sandbox:auth.sandbox,hotels:[]};
   const hotels:NuiteeMarketHotel[]=[],seen=new Set<string>();
   // Scan at most 24 supplier items, publish at most 12. Never fabricate inventory.
   for(const row of (json as {data:unknown[]}).data.slice(0,24)){
     const hotel=normalize(row,market.supplierCity);
     if(!hotel||seen.has(hotel.id))continue;
     seen.add(hotel.id);hotels.push(hotel);
   }
   hotels.sort((a,b)=>Number(Boolean(b.photo))-Number(Boolean(a.photo)));
   return {status:"ready",sandbox:auth.sandbox,hotels:hotels.slice(0,MAX_HOTELS)};
 }catch{
   return {status:"temporarily-unavailable",sandbox:auth.sandbox,hotels:[]};
 }
});

/** A property is displayed on our GTH detail page ONLY if its supplier id is in
 * the already-bounded market feed; arbitrary URL ids cannot trigger per-id calls.
 */
export async function getNuiteeMarketHotel(marketSlug:string,id:string):Promise<NuiteeMarketHotel|null>{
 if(!getHotelMarket(marketSlug)||!validNuiteeHotelId(id))return null;
 const feed=await getNuiteeMarketFeed(marketSlug);
 return feed.status==="ready"?feed.hotels.find(item=>item.id===id)??null:null;
}
