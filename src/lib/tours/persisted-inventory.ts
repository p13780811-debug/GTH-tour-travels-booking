import "server-only";
import {createClient} from "@supabase/supabase-js";
import {supplierImage,uniqueSupplierProducts,type SupplierProduct} from "@/lib/tours/supplier-products";
import type {TourSearch,ExperiencePath} from "@/lib/tours/discovery";
const PRODUCT_PATH=/^\/([a-z0-9-]+)-d([1-9]\d*)\/([a-z0-9-]+)-p([1-9]\d*)\/$/;
type SourceRow={
 provider:string;provider_product_id:string;title:string;country_code:string;country_name:string;
 city_id:number;city_name:string;city_slug:string;product_slug:string;product_type:number;
 source_url:string;image_url:string;currency:string;price_numeric:number|null;
 source_verified:boolean;image_verified:boolean;available:boolean;last_verified_at:string;
};
function toCard(row:SourceRow):SupplierProduct|null{
 if(row.provider!=="wegotrip" || !/^[1-9]\d{0,17}$/.test(row.provider_product_id) ||
 ![1,2,3].includes(row.product_type) || row.source_verified!==true ||
 row.image_verified!==true || row.available!==true || !supplierImage(row.image_url) ||
 !/^[A-Z]{3}$/.test(row.currency) || !/^[A-Z]{2}$/.test(row.country_code) ||
 typeof row.city_id!=="number" || !Number.isSafeInteger(row.city_id) || row.city_id<=0 ||
 !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.city_slug) ||
 !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.product_slug) ||
 !row.city_name || !row.title)return null;
 const age=Date.now()-Date.parse(row.last_verified_at);
 if(!Number.isFinite(age)||age<0||age>14*86400000)return null;
 try{
   const url=new URL(row.source_url);
   const match=PRODUCT_PATH.exec(url.pathname);
   if(url.protocol!=="https:" || !["wegotrip.com","www.wegotrip.com"].includes(url.hostname) ||
      url.search || url.hash || url.username || url.password || url.port ||
      !match || match[1]!==row.city_slug || Number(match[2])!==row.city_id ||
      match[3]!==row.product_slug || match[4]!==row.provider_product_id)return null;
   return {provider:"wegotrip",id:Number(row.provider_product_id),title:row.title,
    city:{id:row.city_id,name:row.city_name,slug:row.city_slug,country:row.country_name},
    image:row.image_url,href:row.source_url,
    price:typeof row.price_numeric==="number"&&Number.isFinite(row.price_numeric)&&row.price_numeric>0?row.price_numeric:null,
    currency:row.currency,kind:row.product_type===1?"audio-tour":"attraction-ticket",
    admissionOnly:row.product_type===2};
 }catch{return null;}
}
/** Optional RLS-scoped public DB supplement. Fail closed if table/migration is absent. */
export async function loadPersistedSupplierProducts(search:TourSearch,mode:ExperiencePath):Promise<SupplierProduct[]>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url || !key)return [];
 const currency=search.currency||"USD";
 if(search.category && !["audio-tour","attraction-ticket"].includes(search.category))return [];
 try{
  const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  let request=client.from("tour_supplier_products")
   .select("provider,provider_product_id,title,country_code,country_name,city_id,city_name,city_slug,product_slug,product_type,source_url,image_url,currency,price_numeric,source_verified,image_verified,available,last_verified_at")
   .eq("provider","wegotrip").eq("available",true).eq("source_verified",true)
   .eq("image_verified",true).eq("currency",currency)
   .gte("last_verified_at",new Date(Date.now()-14*86400000).toISOString());
  request=search.city?request.ilike("city_name",search.city):request.eq("country_code","IN");
  const {data,error}=await request.order("last_verified_at",{ascending:false}).limit(80)
   .abortSignal(AbortSignal.timeout(4_000));
  if(error || !data)return [];
  const results=(data as SourceRow[]).map(toCard).filter((r):r is SupplierProduct=>r!==null);
  // Same-city strings in multiple countries must never be silently conflated.
  if(search.city&&new Set(results.map(r=>r.city.country)).size>1)return [];
  const category=search.category||(mode==="/activities"?"attraction-ticket":"audio-tour");
  return uniqueSupplierProducts(results.filter(r=>r.kind===category &&
    (!search.minPrice || r.price!==null&&r.price>=Number(search.minPrice)) &&
    (!search.maxPrice || r.price!==null&&r.price<=Number(search.maxPrice)))).slice(0,12);
 }catch{return [];}
}
