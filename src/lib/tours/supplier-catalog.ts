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
export async function getSupplierCatalog(raw:TourFilters,mode:ExperiencePath,expectedCountry?:string):Promise<SupplierCatalog>{
 const parsed=parseTourFilters(raw);if(!parsed.ok)return {items:[],status:"invalid"};
 const filters=parsed.filters,currency=filters.currency||"USD";
 // This supplier offers audio tours and ticket products, not guided day trips or city passes.
 if(filters.category&&!["audio-tour","attraction-ticket"].includes(filters.category))return {items:[],status:"empty"};
 try{
  let cities:SupplierCity[]=[];
  if(filters.city){
   const data=await readSupplier("/search/",{query:filters.city,currency},86400);
   const needle=filters.city.normalize("NFKC").toLocaleLowerCase().replaceAll("-"," ");
   cities=list(data.results).filter(value=>object(value).type==="city"&&object(value).available===true).map(supplierCity).filter((city):city is SupplierCity=>Boolean(city)).filter(city=>(city.name.normalize("NFKC").toLocaleLowerCase()===needle||city.slug.replaceAll("-"," ")===needle)&&(!expectedCountry||city.country.normalize("NFKC").toLocaleLowerCase()===expectedCountry.normalize("NFKC").toLocaleLowerCase()));
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

/**
 * Popular attractions directly returned by the public supplier city endpoint.
 * This does NOT query Supabase/OSM, infer a place from a product title, or
 * synthesize an attraction-specific booking URL. Each link is the supplier's
 * verified city collection (the attraction page URL is not documented).
 */
export type SupplierAttraction=Readonly<{
 id:number;name:string;image:string|null;city:SupplierCity;href:string;
}>;
export async function getSupplierAttractions(cityName:string,countryName:string):Promise<SupplierAttraction[]>{
 const parsed=parseTourFilters({city:cityName});
 if(!parsed.ok||!parsed.filters.city||!countryName||countryName.length>100)return [];
 try{
  const data=await readSupplier("/search/",{query:parsed.filters.city,currency:"USD"},86400);
  const normalized=(value:string)=>value.normalize("NFKC").trim().toLocaleLowerCase("en");
  const candidates=list(data.results).filter(value=>object(value).type==="city"&&object(value).available===true)
   .map(supplierCity).filter((city):city is SupplierCity=>Boolean(city))
   .filter(city=>normalized(city.name)===normalized(parsed.filters.city)&&normalized(city.country)===normalized(countryName));
  if(candidates.length!==1)return [];
  const city=candidates[0];
  const results=await readSupplier("/attractions/",{city:String(city.id),lang:"en",popular:"true",page:"1"},86400);
  const seen=new Set<number>(),items:SupplierAttraction[]=[];
  const href="https://wegotrip.com/"+city.slug+"-d"+city.id+"/";
  for(const value of list(results.results)){
   const row=object(value),id=row.id;
   const name=typeof row.name==="string"?row.name.trim().slice(0,160):"";
   if(!supplierId(id)||seen.has(id)||!name||/[^\p{L}\p{M}\p{N} .,()&'’:-]/u.test(name))continue;
   if(typeof row.itemsCount==="number"&&row.itemsCount<=0)continue;
   const statedCity=object(row.city);
   if(statedCity.id!==undefined&&statedCity.id!==city.id)continue;
   seen.add(id);
   items.push({id,name,image:supplierImage(row.preview)||supplierImage(row.cover),city,href});
   if(items.length===3)break;
  }
  return items;
 }catch{return [];}
}
