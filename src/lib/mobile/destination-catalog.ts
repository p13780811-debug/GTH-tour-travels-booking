import "server-only";
import {createClient} from "@supabase/supabase-js";
import {unstable_cache} from "next/cache";
import {destinationGeography} from "@/lib/destinations/geography";
import {destinationCountryCode} from "@/lib/destinations/ecosystem";
import {destinations,destinationImageForSlug} from "@/data/destinations";
import type {MobileDiscoveryItem} from "./discovery";
import type {AppQuery,AppDetail,AppListing} from "./catalog";
const size=24;
const slugOk=(slug:unknown):slug is string=>typeof slug==="string"&&slug.length<=140&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
const nameOk=(value:unknown):value is string=>typeof value==="string"&&value.trim().length>=2&&value.trim().length<=120;
const esc=(value:string)=>value.replace(/[\\%_]/g,c=>"\\"+c);
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw Error("Public catalogue unavailable");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
type Row={slug:string;name:string;country:string|null;country_code:string|null;description?:string|null};
function identity(row:Row){
 const geography=destinationGeography(row.slug,row.country);
 const countryCode=destinationCountryCode(geography.country,row.country_code);
 const editorial=destinations.find(d=>d.slug===row.slug);
 const sameCountry=editorial&&geography.country===destinationGeography(row.slug).country;
 return {country:geography.country,countryCode,image:sameCountry?editorial.image_url:destinationImageForSlug(row.slug)};
}
async function queryPage(page:number,q:string,country:string,destination:string,signal?:AbortSignal){
 let list=db().from("destinations").select("slug,name,country,country_code",{count:"exact"}).is("is_active",true);
 if(q)list=list.ilike("name","%"+esc(q)+"%");
 if(country)list=list.eq("country_code",country);
 if(destination&&slugOk(destination))list=list.eq("slug",destination);
 const {data,error,count}=await list.order("name").order("slug").range((page-1)*size,page*size-1).abortSignal(signal??AbortSignal.timeout(3500));
 if(error||!data)throw Error("Public destination lookup failed");
 return {rows:data as Row[],count:count??data.length};
}
const cachedPage=unstable_cache((page:number,q:string,country:string,destination:string)=>queryPage(page,q,country,destination),["gth-mobile-world-cities-v1"],{revalidate:600,tags:["public-destination-catalog"]});
export async function readMobileDestinations(query:AppQuery,signal?:AbortSignal):Promise<AppListing|null>{
 try{
  const {page,q,country,destination}=query;
  if(signal?.aborted)return null;
  const result=signal?await queryPage(page,q,country,destination,signal):await cachedPage(page,q,country,destination);
  const items=result.rows.flatMap((row):MobileDiscoveryItem[]=>{
   if(!slugOk(row.slug)||!nameOk(row.name))return [];
   const v=identity(row);
   return [{id:row.slug,title:row.name.trim(),subtitle:v.country??"Destination directory",detail:"City guide & stays",href:"/app/destinations/"+row.slug,image:v.image,countryCode:v.countryCode}];
  });
  return {items,total:result.count,page,size,error:null};
 }catch{return null;}
}
const cachedDetail=unstable_cache(async(id:string)=>{
 const {data,error}=await db().from("destinations").select("slug,name,country,country_code").is("is_active",true).eq("slug",id).abortSignal(AbortSignal.timeout(3500)).maybeSingle();
 if(error||!data)throw Error("Destination not found");
 return data as Row;
},["gth-mobile-world-city-v1"],{revalidate:3600,tags:["public-destination-catalog"]});
export async function readMobileDestinationDetail(id:string):Promise<AppDetail|null>{
 if(!slugOk(id))return null;
 try{
  const row=await cachedDetail(id);if(!nameOk(row.name)||row.slug!==id)return null;
  const v=identity(row),city=row.name.trim();
  const hotel="/app/hotels?"+new URLSearchParams({view:"booking",city,...(v.countryCode?{country:v.countryCode}:{})});
  return {title:city,subtitle:v.country??"Destination directory",summary:"Explore local travel options and confirm dates and availability with the selected provider.",kind:"destination",image:v.image,countryCode:v.countryCode,facts:[["Destination",city],["Country",v.country??"Not recorded"]],source:null,website:null,fullSite:"/destinations/"+id+(v.country?"?"+new URLSearchParams({country:v.country}):""),related:hotel};
 }catch{return null;}
}
