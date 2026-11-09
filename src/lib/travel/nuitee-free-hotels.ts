import "server-only";
import {unstable_cache} from "next/cache";
import {reserveNuiteeRefresh} from "./nuitee-read-budget";
import {cityLabels} from "./hotel-geo-bounds";
export type HotelProfile={id:string;name:string;city:string;country:string;address:string;image:string|null;stars:number|null;latitude:number|null;longitude:number|null};
const URL_BASE="https://api.liteapi.travel/v3.0/data/hotels";
export const HOTEL_PROFILE_PAGE_SIZE=24;
export function parseNuiteeHotels(input:unknown,country:string,city=""):{items:HotelProfile[];hasMore:boolean}{
  if(!input||typeof input!=="object"||!Array.isArray((input as {data?:unknown}).data))throw Error("Invalid hotel content");
  const data=(input as {data:unknown[]}).data;if(data.length>1000)throw Error("Too many hotel profiles");
  const text=(value:unknown,max:number)=>typeof value==="string"?value.replace(/<[^>]*>/g,"").replace(/[\x00-\x1f]/g,"").trim().slice(0,max):"";
  const seen=new Set<string>(),items:HotelProfile[]=[];let validCountryProfiles=0;
  const cityNames=cityLabels(city).map(name=>name.normalize("NFKC").trim().toLocaleLowerCase("en"));
  for(const value of data.slice(0,24)){
    if(!value||typeof value!=="object")continue;
    const row=value as Record<string,unknown>;
    if(typeof row.id!=="string"||!/^[A-Za-z0-9_-]{1,100}$/.test(row.id)||seen.has(row.id)||row.country!==country)continue;
    const name=text(row.name,160);if(name.length<3)continue;
    validCountryProfiles++;
    if(city&&!cityNames.includes(text(row.city,100).normalize("NFKC").trim().toLocaleLowerCase("en")))continue;
    let image:string|null=null;
    try{const photo=new URL(String(row.main_photo));if(photo.protocol==="https:"&&!photo.username&&!photo.password&&!photo.port&&photo.hostname.includes(".")&&!/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(photo.hostname))image=photo.toString();}catch{}
    seen.add(row.id);items.push({id:row.id,name,city:text(row.city,100),country,address:text(row.address,240),image,
      stars:typeof row.stars==="number"&&Number.isInteger(row.stars)&&row.stars>=1&&row.stars<=5?row.stars:null,
      latitude:typeof row.latitude==="number"&&Number.isFinite(row.latitude)&&Math.abs(row.latitude)<=90?row.latitude:null,
      longitude:typeof row.longitude==="number"&&Number.isFinite(row.longitude)&&Math.abs(row.longitude)<=180?row.longitude:null});
  }
  if(data.length&&!validCountryProfiles)throw Error("No valid profiles for the requested country");
  return {items,hasMore:data.length>=24};
}
const fills=new Map<string,Promise<{items:HotelProfile[];hasMore:boolean}>>(),failures=new Map<string,number>();
export async function getFreeHotelProfiles(country:string,city:string,page:number){
  if(!/^[A-Z]{2}$/.test(country)||!Number.isInteger(page)||page<1||page>100||city.length>80)throw Error("Invalid content scope");
  if(!process.env.NUITEE_PRODUCTION_API_KEY)throw Error("Hotel content is not configured");
  const key=JSON.stringify([country,city.normalize("NFKC").trim().toLocaleLowerCase("en"),page]);
  if((failures.get(key)||0)>Date.now())throw Error("Hotel content is temporarily unavailable");
  const existing=fills.get(key);if(existing)return existing;
  const reader=unstable_cache(async()=>{
    await reserveNuiteeRefresh();
    const url=new URL(URL_BASE);url.searchParams.set("countryCode",country);if(city)url.searchParams.set("cityName",city);
    url.searchParams.set("limit","24");url.searchParams.set("offset",String((page-1)*24));
    const response=await fetch(url,{method:"GET",headers:{accept:"application/json","X-API-Key":process.env.NUITEE_PRODUCTION_API_KEY!},redirect:"error",credentials:"omit",signal:AbortSignal.timeout(5000),cache:"no-store"});
    if(!response.ok)throw Error("Hotel content unavailable");
    if(Number(response.headers.get("content-length")||0)>512000)throw Error("Hotel content too large");
    const body=await response.text();if(body.length>512000)throw Error("Hotel content too large");
    return parseNuiteeHotels(JSON.parse(body),country,city);
  },["gth-free-hotel-content-v1",key],{revalidate:86400});
  const pending=reader();fills.set(key,pending);
  try{return await pending;}catch(error){if(failures.size>1000)failures.clear();failures.set(key,Date.now()+120000);throw error;}finally{if(fills.get(key)===pending)fills.delete(key);}
}
