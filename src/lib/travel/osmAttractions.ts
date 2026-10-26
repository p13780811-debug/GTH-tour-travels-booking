import { createClient } from "@supabase/supabase-js";

export const ATTRACTION_TYPES = [
  "attraction", "museum", "viewpoint", "zoo", "theme-park", "fort", "castle",
  "ruins", "monument", "archaeological-site", "beach", "national-park", "park", "nature-reserve",
] as const;
const CATEGORY = new Set<string>(ATTRACTION_TYPES);
const ID = /^(node|way|relation)\/[1-9][0-9]{0,18}$/;
const SAFE_SEARCH = /^[\p{L}\p{N} .'-]{0,70}$/u;
export type DirectoryFilters = {country?:string; region?:string; category?:string; city?:string; q?:string; after?:string; limit?:number; page?:number};
export type Place = {source_id:string;name:string;category:string;region_scope:string;city:string|null;country_code:string|null;country_name:string|null;source_url:string;source_license:string;latitude:number;longitude:number};
export type CountryCount = {country_code:string;country_name:string;records:number;last_source_write:string};
export type SyncRun = {run_id:string;source_region:string;country_code:string;country_name:string;accepted:number;completed_at:string};
export function validFilters(f:DirectoryFilters){
  return (!f.country || /^[A-Z]{2}$/.test(f.country)) &&
    (!f.region || ["all","goa","india","world"].includes(f.region)) &&
    (!f.category || CATEGORY.has(f.category)) &&
    (!f.city || (f.city.length<=100 && SAFE_SEARCH.test(f.city))) &&
    (!f.q || SAFE_SEARCH.test(f.q)) &&
    (!f.after || ID.test(f.after)) &&
    (f.limit===undefined || (Number.isInteger(f.limit)&&f.limit>=1&&f.limit<=48)) &&
    (f.page===undefined || (Number.isInteger(f.page)&&f.page>=1&&f.page<=1000000)) &&
    !(f.page!==undefined&&f.after!==undefined);
}
function client(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url&&key ? createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
export async function listPlaces(filters:DirectoryFilters){
  if(!validFilters(filters))throw new Error("Invalid source filters");
  const db=client();if(!db)throw new Error("Public source unavailable");
  const limit=filters.limit??24;
  let query=db.from("gth_osm_attractions")
    .select("source_id,name,category,region_scope,city,country_code,country_name,source_url,source_license,latitude,longitude")
    .eq("is_public",true).eq("is_community_directory",true)
    .order("source_id",{ascending:true}).limit(limit+1);
  if(filters.country)query=query.eq("country_code",filters.country);
  if(filters.region&&filters.region!=="all")query=query.eq("region_scope",filters.region);
  if(filters.category)query=query.eq("category",filters.category);
  if(filters.city)query=query.ilike("city",filters.city.trim());
  if(filters.q)query=query.ilike("name","%"+filters.q.trim()+"%");
  if(filters.after)query=query.gt("source_id",filters.after);
  if(filters.page&&filters.page>1)query=query.range((filters.page-1)*limit,filters.page*limit);
  const {data,error}=await query.abortSignal(AbortSignal.timeout(5_000));
  if(error)throw new Error("Public source query unavailable");
  const rows=(data??[]) as Place[];
  const items=rows.slice(0,limit);
  return {items,nextCursor:rows.length>limit?items.at(-1)?.source_id??null:null};
}
export async function sourceProgress(){
  const db=client();if(!db)throw new Error("Public source unavailable");
  const [countries,runs]=await Promise.all([
    db.from("gth_osm_attraction_country_counts")
      .select("country_code,country_name,records,last_source_write")
      .order("country_name",{ascending:true}).limit(300),
    db.from("gth_osm_attraction_sync_runs")
      .select("run_id,source_region,country_code,country_name,accepted,completed_at")
      .order("completed_at",{ascending:false}).limit(8),
  ]);
  if(countries.error||runs.error)throw new Error("Source progress unavailable");
  const items=(countries.data??[]) as CountryCount[];
  return {countries:items,runs:(runs.data??[]) as SyncRun[],
    total:items.reduce((n,row)=>n+Number(row.records||0),0),
    countriesWithRecords:items.filter(row=>Number(row.records)>0).length};
}
export function directoryHref(f:DirectoryFilters){
  const p=new URLSearchParams();
  for(const k of ["country","region","category","city","q","after"] as const)
    if(f[k]&&!(k==="region"&&f[k]==="all"))p.set(k,f[k]!);
  return "/attractions"+(p.toString()?"?"+p.toString():"");
}
