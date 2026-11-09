import "server-only";
import {unstable_cache} from "next/cache";
import {getSupplierCatalog} from "@/lib/tours/supplier-catalog";
import {parseTourFilters} from "@/lib/tours/discovery";
import type {SupplierProduct} from "@/lib/tours/supplier-products";

// Reuse the existing free public catalogue. This gallery adds no database read,
// private Nuitee endpoint, rate/booking API or currency conversion.
const read=unstable_cache(async(city:string)=>{
 const result=await getSupplierCatalog({city,currency:"USD",page:"1"},"/activities");
 if(result.status==="unavailable"||result.status==="invalid")throw Error("Experience catalogue unavailable");
 return {items:result.items.slice(0,6),checkedAt:Date.now()};
},["gth-connected-experiences-v1"],{revalidate:86400});
export type ExperienceSelection={items:SupplierProduct[];available:boolean};
const pending=new Map<string,Promise<ExperienceSelection>>(),retryAfter=new Map<string,number>();
export async function connectedExperiences(city:string):Promise<ExperienceSelection>{
 const unavailable={items:[],available:false};
 const parsed=parseTourFilters({city});if(!parsed.ok)return unavailable;
 const key=parsed.filters.city.toLocaleLowerCase();
 if((retryAfter.get(key)||0)>Date.now())return unavailable;
 const active=pending.get(key);if(active)return active;
 const request=(async()=>{
  try{const result=await read(key);return Date.now()-result.checkedAt<=172800000?{items:result.items,available:true}:unavailable;}
  catch{if(retryAfter.size>=128)retryAfter.delete(retryAfter.keys().next().value!);retryAfter.set(key,Date.now()+120000);return unavailable;}
  finally{pending.delete(key);}
 })();
 pending.set(key,request);return request;
}
