import "server-only";
import {createClient} from "@supabase/supabase-js";

export type MappedCity={
 country_code:string;country_name:string;city:string;records:number;last_source_write:string|null
};
export type MappedCityFilters={country?:string;search?:string;page?:number;pageSize?:number};
const SAFE_CITY_SEARCH=/^[\p{L}\p{N} .'-]{0,60}$/u;
const MAX_PAGE=100;
export function validCityFilters(filters:MappedCityFilters){
 return (!filters.country||/^[A-Z]{2}$/.test(filters.country))&&
  (!filters.search||(filters.search.length<=60&&SAFE_CITY_SEARCH.test(filters.search)))&&
  (!filters.page||(Number.isInteger(filters.page)&&filters.page>=1&&filters.page<=MAX_PAGE))&&
  (!filters.pageSize||(Number.isInteger(filters.pageSize)&&filters.pageSize>=1&&filters.pageSize<=48));
}
/** Presentation only: preserve actual source city key for case-insensitive source queries. */
export function mappedCityLabel(city:string){
 return city.replace(/(^|[\s-])(\p{L})/gu,(_match,separator:string,letter:string)=>separator+letter.toLocaleUpperCase("en"));
}
export function mappedCityLink(country:string,city:string){
 const params=new URLSearchParams({country,city});
 return "/attractions?"+params.toString();
}
export function cityExplorerHref(filters:MappedCityFilters){
 const params=new URLSearchParams();
 if(filters.country)params.set("country",filters.country);
 if(filters.search)params.set("search",filters.search);
 if(filters.page&&filters.page>1)params.set("page",String(filters.page));
 return "/attractions/cities"+(params.toString()?"?"+params.toString():"");
}
/** Public anon/RLS reads only. Real city tags are sparse and NOT a global gazetteer. */
export async function listMappedCities(filters:MappedCityFilters={}):Promise<{items:MappedCity[];total:number;page:number;pageSize:number}>{
 if(!validCityFilters(filters))throw new Error("Invalid mapped-city filters");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!anon)throw new Error("Public mapped-city data unavailable");
 const page=filters.page||1,pageSize=filters.pageSize||36;
 const db=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 let query=db.from("gth_osm_attraction_city_counts")
  .select("city,country_code,country_name,records,last_source_write",{count:"exact"})
  .order("records",{ascending:false}).order("city",{ascending:true})
  .range((page-1)*pageSize,page*pageSize-1);
 if(filters.country)query=query.eq("country_code",filters.country);
 if(filters.search)query=query.ilike("city","%"+filters.search.trim()+"%");
 const {data,error,count}=await query.abortSignal(AbortSignal.timeout(5_000));
 if(error)throw new Error("Mapped-city index temporarily unavailable");
 return {items:(data??[]).map(x=>({...x,records:Number(x.records)||0})) as MappedCity[],
  total:count||0,page,pageSize};
}
