import "server-only";
import {unstable_cache} from "next/cache";
import {reserveNuiteeRefresh} from "./nuitee-read-budget";
import {hotelContentScope,readHotelContent,type HotelContentPage} from "./nuitee-hotel-content-core";
export {parseNuiteeHotels,HOTEL_PROFILE_PAGE_SIZE} from "./nuitee-hotel-content-core";
export type {HotelProfile} from "./nuitee-hotel-content-core";

// OpenNext Cloudflare 1.20.17's request-local context (same symbol used by its
// getCloudflareContext helper). Adapter is optional in ordinary Next builds.
// No binding or secret is sent to a browser.
type HotelContentBinding={idFromName(name:string):unknown;get(id:unknown):{fetch(request:Request):Promise<Response>}};
type CloudflareContext={env?:{GTH_CLOUDFLARE_INGRESS?:string;GTH_HOTEL_CONTENT?:HotelContentBinding}};
function cloudflareContext():CloudflareContext|undefined{
  return Reflect.get(globalThis,Symbol.for("__cloudflare-context__")) as CloudflareContext|undefined;
}
const fills=new Map<string,Promise<HotelContentPage>>(),failures=new Map<string,number>();
export async function getFreeHotelProfiles(country:string,city:string,page:number):Promise<HotelContentPage>{
  const scope=hotelContentScope(country,city,page);
  const context=cloudflareContext();
  if(process.env.GTH_CLOUDFLARE_INGRESS==="1"||context?.env?.GTH_CLOUDFLARE_INGRESS==="1"){
    const binding=context?.env?.GTH_HOTEL_CONTENT;
    // No unguarded fallback, including if the binding is absent or exhausted.
    if(!binding)throw Error("Hotel content cache unavailable");
    const endpoint=new URL("https://hotel-content.internal/profiles");
    endpoint.searchParams.set("country",scope.country);endpoint.searchParams.set("city",scope.city);endpoint.searchParams.set("page",String(scope.page));
    const response=await binding.get(binding.idFromName("global-hotel-content-v1")).fetch(new Request(endpoint));
    if(!response.ok)throw Error("Hotel content unavailable");
    const result=await response.json() as HotelContentPage;
    if(!Array.isArray(result.items)||result.items.length>24||typeof result.hasMore!=="boolean")throw Error("Invalid hotel cache response");
    return result;
  }
  if(!process.env.NUITEE_PRODUCTION_API_KEY)throw Error("Hotel content is not configured");
  const key=scope.key;
  if((failures.get(key)||0)>Date.now())throw Error("Hotel content is temporarily unavailable");
  const existing=fills.get(key);if(existing)return existing;
  const reader=unstable_cache(async()=>{
    await reserveNuiteeRefresh();
    return readHotelContent(scope.country,scope.city,scope.page,process.env.NUITEE_PRODUCTION_API_KEY!);
  },["gth-free-hotel-content-v1",key],{revalidate:86400});
  const pending=reader();fills.set(key,pending);
  try{return await pending;}catch(error){if(failures.size>1000)failures.clear();failures.set(key,Date.now()+120000);throw error;}finally{if(fills.get(key)===pending)fills.delete(key);}
}
