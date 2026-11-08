import "server-only";
import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";
import {isPublicLaunch,siteOrigin} from "./site";
import {OSM_SEO_CACHE_SECONDS,isIndexableOsmPlace,osmPlacePath,type OsmPlace} from "@/lib/travel/osm-place";
import {OSM_PLACE_FIELDS} from "@/lib/travel/osm-place-reader";
export const OSM_SITEMAP_SIZE=1000;
function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw Error("Mapped-place sitemap source unavailable");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
const countries=unstable_cache(async()=>{
 const {data,error}=await db().from("gth_osm_attraction_country_counts")
 .select("country_code,records").order("country_code",{ascending:true}).limit(300).abortSignal(AbortSignal.timeout(12_000));
 if(error)throw Error("Mapped-place sitemap counts unavailable");
 return (data??[]).filter(row=>/^[A-Z]{2}$/.test(row.country_code)&&Number.isSafeInteger(Number(row.records))&&Number(row.records)>0)
 .map(row=>({country:row.country_code as string,count:Number(row.records),pages:Math.ceil(Number(row.records)/OSM_SITEMAP_SIZE)}));
},["gth-osm-seo-countries-v1"],{revalidate:OSM_SEO_CACHE_SECONDS,tags:["gth-osm-place-seo"]});
export async function osmSitemapCountries(){
 return isPublicLaunch()&&process.env.GTH_OSM_PLACE_PAGES_ENABLED!=="false"?countries():[];
}
const shard=unstable_cache(async(country:string,page:number)=>{
 // Country + primary source ID uses the existing country_keyset index. Only
 // one shard is read, never 174k rows or a supplier API call per request.
 const start=page*OSM_SITEMAP_SIZE;
 const {data,error}=await db().from("gth_osm_attractions").select(OSM_PLACE_FIELDS)
 .eq("is_public",true).eq("is_community_directory",true).eq("country_code",country)
 .order("source_id",{ascending:true}).range(start,start+OSM_SITEMAP_SIZE-1).abortSignal(AbortSignal.timeout(5_000));
 if(error)throw Error("Mapped-place sitemap shard unavailable");
 return ((data??[]) as OsmPlace[]).filter(isIndexableOsmPlace).map(row=>({
 url:siteOrigin()+osmPlacePath(row.source_id),
 ...(row.updated_at&&Number.isFinite(Date.parse(row.updated_at))?{lastModified:new Date(row.updated_at).toISOString()}:{}),
 }));
},["gth-osm-seo-shard-v1"],{revalidate:OSM_SEO_CACHE_SECONDS,tags:["gth-osm-place-seo"]});
export async function osmSitemapShard(country:string,page:number){
 if(!/^[A-Z]{2}$/.test(country)||!Number.isSafeInteger(page)||page<0||page>100000)return null;
 const available=(await osmSitemapCountries()).find(row=>row.country===country);
 if(!available||page>=available.pages)return null;
 return shard(country,page);
}
export const escapeXml=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export const OSM_XML_HEADERS={"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, s-maxage=86400, stale-while-revalidate=3600","X-Content-Type-Options":"nosniff"};
