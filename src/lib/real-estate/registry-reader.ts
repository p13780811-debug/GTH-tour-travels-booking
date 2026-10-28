import {createClient} from "@supabase/supabase-js";
import {unstable_cache} from "next/cache";
import {validPropertySlug} from "./property-seo";
import {parseRegistryFilters,registryCompareSlugs,REGISTRY_PAGE_SIZE,type RegistryFilters} from "./registry-search";
export type RegistryRecord={slug:string;title:string;rera_id:string;developer:string|null;builder_name:string|null;city:string|null;district:string|null;completion_date:string|null;registration_date:string|null;official_source_url:string|null;ingestion_source:string|null;last_verified_at:string|null;status:string|null};
function registryQuery(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error("registry_public_config_missing");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).from("properties")
  .select("slug,title,rera_id,developer,builder_name,city,district,completion_date,registration_date,official_source_url,status,source_type,ingestion_source,last_verified_at")
  .in("source_type",["registry","rera"]).ilike("ingestion_source","%maharera%").not("rera_id","is",null);
}
const valid=(row:RegistryRecord)=>validPropertySlug(row.slug)&&typeof row.title==="string"&&row.title.trim().length>=3&&/^P[0-9]{11}$/.test(row.rera_id||"")&&row.status!=="archived";
/** Preserve the deployed bounded retry, anonymous RLS and success-only cache. */
async function publicRead(build:()=>ReturnType<typeof registryQuery>){
 for(let attempt=0;attempt<2;attempt++){
  try{
   const {data,error}=await build().abortSignal(AbortSignal.timeout(7_000));
   if(error||!Array.isArray(data)){
    const temporary=error&&(["57014","PGRST000","PGRST001","PGRST002","PGRST003"].includes(error.code||"")||/timeout|aborted|fetch failed/i.test(error.message||""));
    if(attempt===0&&temporary)continue;
    throw new Error("registry_public_query_failed");
   }
   return data as RegistryRecord[];
  }catch(cause){if(attempt===0&&cause instanceof Error&&/abort|timeout|network/i.test(cause.message))continue;throw new Error("registry_public_backend_unavailable");}
 }
 throw new Error("registry_public_backend_unavailable");
}
async function readRegistryUncached(f:RegistryFilters){
 const data=await publicRead(()=>{
  let request=registryQuery();
  const project=f.q?`title.ilike.%${f.q}%,rera_id.ilike.%${f.q}%,city.ilike.%${f.q}%,district.ilike.%${f.q}%`:"";
  const developer=f.developer?`developer.ilike.%${f.developer}%,builder_name.ilike.%${f.developer}%`:"";
  // Combine groups once: a second .or() would create ambiguous repeated query keys.
  if(project&&developer)request=request.or(`and(or(${project}),or(${developer}))`);else if(project||developer)request=request.or(project||developer);
  if(f.district)request=request.ilike("district",`%${f.district}%`);
  if(f.year)request=request.gte("completion_date",`${f.year}-01-01`).lt("completion_date",`${Number(f.year)+1}-01-01`);
  if(f.sort!=="name")request=request.order(f.sort==="registered_newest"?"registration_date":"completion_date",{ascending:f.sort==="completion_earliest",nullsFirst:false});
  // Keep the original slug order for the default directory and a stable tiebreaker.
  return request.order("slug",{ascending:true}).range((f.page-1)*REGISTRY_PAGE_SIZE,f.page*REGISTRY_PAGE_SIZE-1);
 });
 return {rows:data.filter(valid),hasNext:data.length===REGISTRY_PAGE_SIZE};
}
const cachedRegistry=unstable_cache(readRegistryUncached,["gth-public-maharera-registry-v3"],{revalidate:300,tags:["gth-public-maharera-registry"]});
export async function readRegistryRecords(f:RegistryFilters):Promise<{rows:RegistryRecord[];hasNext:boolean;error:boolean}>{
 const parsed=parseRegistryFilters({...f,page:String(f.page)});
 if(!parsed.ok)return {rows:[],error:true,hasNext:false};
 try{return {...await cachedRegistry(parsed.filters),error:false};}catch{return {rows:[],error:true,hasNext:false};}
}
const cachedComparison=unstable_cache(async(slugs:string[])=>{
 const rows=(await publicRead(()=>registryQuery().in("slug",slugs).limit(3))).filter(valid);
 return slugs.flatMap(slug=>rows.find(row=>row.slug===slug)||[]);
},["gth-public-registry-comparison-v1"],{revalidate:300,tags:["gth-public-maharera-registry"]});
export async function readRegistryComparison(slugs:readonly string[]):Promise<{rows:RegistryRecord[];error:boolean}>{
 if(!registryCompareSlugs(slugs.join(",")))return {rows:[],error:true};
 try{return {rows:await cachedComparison([...slugs]),error:false};}catch{return {rows:[],error:true};}
}
