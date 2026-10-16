import {createHash} from "node:crypto";
import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {isExactHotelPlace, type PlacesMatch} from "@/lib/travel/google-hotel-match";

export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store, max-age=0","X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff"};
const denied=(code=503)=>NextResponse.json({error:"Google Maps photos not available for this hotel"},{status:code,headers:HEADERS});
type Photo={name?:string;googleMapsUri?:string;authorAttributions?:{displayName?:string;uri?:string;photoUri?:string}[]};
type Place=Omit<PlacesMatch,"photos"> & {googleMapsUri?:string;photos?:Photo[]};
const googleMapLink=(value:unknown):string|null=>{
 if(typeof value!=="string"||value.length>2048)return null;
 try{const u=new URL(value);return u.protocol==="https:"&&
  ["google.com","www.google.com","maps.google.com"].includes(u.hostname)?u.toString():null;}catch{return null;}
};
const authorUrl=(value:unknown):string|null=>{
 if(typeof value!=="string"||value.length>2048)return null;
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname.endsWith(".google.com")?u.toString():null;}catch{return null;}
};
const googleMediaUrl=(value:unknown):string|null=>{
 if(typeof value!=="string"||value.length>2200)return null;
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname==="lh3.googleusercontent.com"?u.toString():null;}catch{return null;}
};
async function chargeBudget(req:Request):Promise<boolean>{
 const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!url||!token||!/^https:\/\//.test(url))return false;
 const day=new Date().toISOString().slice(0,10);
 const ip=(req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip")||"unknown").split(",")[0].slice(0,80);
 const hash=createHash("sha256").update(ip+"|"+day).digest("hex").slice(0,32);
 const daily="gth:google-places:daily:"+day;
 const hourly="gth:google-places:hour:"+day+":"+new Date().getUTCHours()+":"+hash;
 const maxDay=Math.min(100,Math.max(1,Number(process.env.GTH_GOOGLE_PLACES_DAILY_BUDGET)||25));
 try{
  const response=await fetch(url.replace(/\/$/,"")+"/pipeline",{
   method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
   body:JSON.stringify([["INCR",daily],["EXPIRE",daily,172800],["INCR",hourly],["EXPIRE",hourly,3600]]),
   cache:"no-store",signal:AbortSignal.timeout(3000)
  });
  if(!response.ok)return false;
  const values=await response.json() as {result?:number;error?:string}[];
  const total=Number(values[0]?.result), perUser=Number(values[2]?.result);
  return values.every(row=>!row.error)&&Number.isSafeInteger(total)&&Number.isSafeInteger(perUser)&&total<=maxDay&&perUser<=3;
 }catch{return false;}
}
export async function GET(request:Request){
 if(process.env.GTH_GOOGLE_PLACES_ON_DEMAND_ENABLED!=="true"||!process.env.GOOGLE_PLACES_API_KEY)return denied();
 const id=new URL(request.url).searchParams.get("id")||"";
 if(!/^osm:(?:node|way|relation)-[0-9]{1,19}$/.test(id))return denied(400);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return denied();
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const sourceId=id.slice(4).replace("-","/");
 try{
  const {data,error}=await db.from("hotel_catalog")
   .select("name,latitude,longitude")
   .eq("source","osm").eq("source_id",sourceId).maybeSingle();
  if(error||!data||typeof data.name!=="string"||data.name.length<5||
     typeof data.latitude!=="number"||typeof data.longitude!=="number"||
     !Number.isFinite(data.latitude)||!Number.isFinite(data.longitude))return denied(404);
  if(!await chargeBudget(request))return denied(429);
  const googleKey=process.env.GOOGLE_PLACES_API_KEY!;
  // On-demand Places queries; never scrape Google Maps or persist Google's result/photos.
  const search=await fetch("https://places.googleapis.com/v1/places:searchText",{
   method:"POST",cache:"no-store",signal:AbortSignal.timeout(7500),
   headers:{"Content-Type":"application/json","X-Goog-Api-Key":googleKey,
    "X-Goog-FieldMask":"places.displayName,places.location,places.types,places.photos,places.googleMapsUri"},
   body:JSON.stringify({
     textQuery:data.name,languageCode:"en",pageSize:5,
     locationBias:{circle:{center:{latitude:data.latitude,longitude:data.longitude},radius:850}}
   })
  });
  if(!search.ok)return denied(502);
  const result=await search.json() as {places?:Place[]};
  const place=(Array.isArray(result.places)?result.places:[])
    .find(item=>isExactHotelPlace({name:data.name,lat:data.latitude,lon:data.longitude},item)
      &&Array.isArray(item.photos)&&item.photos.length>0);
  const photo=place?.photos?.find(item=>typeof item.name==="string"&&
    /^places\/[^/]+\/photos\/[^/]+$/.test(item.name));
  if(!place||!photo?.name)return denied(404);
  const photoRequest=await fetch("https://places.googleapis.com/v1/"+photo.name+"/media?maxWidthPx=960&skipHttpRedirect=true",{
   method:"GET",headers:{"X-Goog-Api-Key":googleKey},cache:"no-store",signal:AbortSignal.timeout(7500)
  });
  if(!photoRequest.ok)return denied(502);
  const photoResponse=await photoRequest.json() as {photoUri?:string};
  const photoUrl=googleMediaUrl(photoResponse.photoUri);
  const placeUrl=googleMapLink(photo.googleMapsUri)||googleMapLink(place.googleMapsUri);
  if(!photoUrl||!placeUrl)return denied(404);
  const authors=(photo.authorAttributions||[]).slice(0,5)
   .map(author=>({
      name:typeof author.displayName==="string"?author.displayName.slice(0,100):"Photo contributor",
      url:authorUrl(author.uri)
   }));
  return NextResponse.json({photoUrl,placeUrl,authors,provider:"Google Maps"}, {headers:HEADERS});
 }catch{return denied(502);}
}
