import "server-only";
import {unstable_cache} from "next/cache";
import {parseTourFilters,type ExperiencePath,type TourFilters} from "./discovery";
import {WEGOTRIP_API,normalizeSupplierProduct,object,supplierCity,uniqueSupplierProducts,type SupplierCity,type SupplierProduct} from "./supplier-products";
const MAX_BYTES=1_500_000;
async function fetchSupplier(path:string,params:Record<string,string>):Promise<Record<string,unknown>>{
 const url=new URL(WEGOTRIP_API+path);for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
 const response=await fetch(url,{headers:{Accept:"application/json","Accept-Language":"en"},redirect:"error",signal:AbortSignal.timeout(8000),cache:"no-store"});
 if(!response.ok||!response.headers.get("content-type")?.includes("application/json")||Number(response.headers.get("content-length"))>MAX_BYTES||!response.body)throw Error("Supplier unavailable");
 const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>MAX_BYTES)throw Error("Supplier response too large");chunks.push(part.value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return object(object(JSON.parse(new TextDecoder().decode(bytes))).data);
}
async function readSupplier(path:string,params:Record<string,string>,ttl:number):Promise<Record<string,unknown>>{
 const read=unstable_cache(async()=>({data:await fetchSupplier(path,params),fetchedAt:Date.now()}),["wegotrip-public-v1",path,JSON.stringify(params)],{revalidate:ttl});
 const cached=await read();
 // Keep an outage from turning an old supplier selection into permanent inventory.
 if(Date.now()-cached.fetchedAt>Math.max(ttl*2000,86400000))throw Error("Supplier snapshot expired");
 return cached.data;
}
function list(value:unknown){return Array.isArray(value)?value.slice(0,100):[];}
export type SupplierCatalog={items:SupplierProduct[];status:"ready"|"empty"|"unavailable"|"invalid"};
/** Public supplier catalogue only: no seed records, privileged DB key or customer data. */
export async function getSupplierCatalog(raw:TourFilters,mode:ExperiencePath):Promise<SupplierCatalog>{
 const parsed=parseTourFilters(raw);if(!parsed.ok)return {items:[],status:"invalid"};
 const filters=parsed.filters,currency=filters.currency||"USD";
 // This supplier offers audio tours and ticket products, not guided day trips or city passes.
 if(filters.category&&!["audio-tour","attraction-ticket"].includes(filters.category))return {items:[],status:"empty"};
 try{
  let cities:SupplierCity[]=[];
  if(filters.city){
   const data=await readSupplier("/search/",{query:filters.city,currency},86400);
   const needle=filters.city.normalize("NFKC").toLocaleLowerCase().replaceAll("-"," ");
   cities=list(data.results).filter(value=>object(value).type==="city"&&object(value).available===true).map(supplierCity).filter((city):city is SupplierCity=>Boolean(city)).filter(city=>city.name.normalize("NFKC").toLocaleLowerCase()===needle||city.slug.replaceAll("-"," ")===needle);
   if(cities.length!==1)return {items:[],status:"empty"}; // Never guess among different cities.
  }else{
   // Public /tours must not depend on the supplier's globally ordered first city page:
   // that page may contain only non-Indian cities and hides verified Mumbai/Agra/Jaipur
   // products whenever the optional Supabase inventory is slow or inaccessible.
   // Query genuine supplier city IDs, never invent products, photos or booking URLs.
   const indiaDestinations=["Mumbai","Agra","Jaipur"] as const;
   const sources=await Promise.allSettled([
    ...indiaDestinations.map(name=>readSupplier("/search/",{query:name,currency},86400)),
    readSupplier("/cities/",{lang:"en",page:"1"},86400),
   ]);
   const indiaCities=sources.slice(0,indiaDestinations.length).flatMap((result,index)=>{
    if(result.status!=="fulfilled")return [];
    const name=indiaDestinations[index].toLocaleLowerCase();
    const matches=list(result.value.results)
     .filter(value=>object(value).type==="city"&&object(value).available===true)
     .map(supplierCity).filter((city):city is SupplierCity=>Boolean(city))
     .filter(city=>city.name.toLocaleLowerCase()===name&&city.country.toLocaleLowerCase()==="india");
    // A provider result with ambiguous city identity is not publishable.
    return matches.length===1?matches:[];
   });
   const worldwide=sources[indiaDestinations.length];
   const globalCities=worldwide.status==="fulfilled"?
    list(worldwide.value.results).filter(value=>Number(object(value).itemsCount)>0)
     .map(supplierCity).filter((city):city is SupplierCity=>Boolean(city)).slice(0,3):[];
   const seenCityIds=new Set<number>();
   cities=[...indiaCities,...globalCities].filter(city=>{
    if(seenCityIds.has(city.id))return false;
    seenCityIds.add(city.id);return true;
   }).slice(0,6);
   if(!cities.length)return {items:[],status:sources.some(source=>source.status==="rejected")?"unavailable":"empty"};
  }
  const batches=await Promise.allSettled(cities.map(async city=>{
   const data=await readSupplier("/products/popular/",{city:String(city.id),lang:"en",currency,page:"1"},3600);
   return list(data.results).map(row=>normalizeSupplierProduct(row,city)).filter((row):row is SupplierProduct=>Boolean(row));
  }));
  const products=uniqueSupplierProducts(batches.flatMap(batch=>batch.status==="fulfilled"?batch.value:[])).filter(row=>{
   const category=filters.category||(mode==="/activities"?"attraction-ticket":"audio-tour");
   return row.kind===category&&row.currency===currency&&(!filters.minPrice||row.price!==null&&row.price>=Number(filters.minPrice))&&(!filters.maxPrice||row.price!==null&&row.price<=Number(filters.maxPrice));
  });
  if(filters.sort==="price")products.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  return {items:products.slice(0,12),status:products.length?"ready":batches.some(batch=>batch.status==="rejected")?"unavailable":"empty"};
 }catch{return {items:[],status:"unavailable"};}
}
