import "server-only";
import {cache} from "react";
import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";
import {OSM_SEO_CACHE_SECONDS,osmSourceId,validOsmPlace,type OsmPlace} from "./osm-place";
export const OSM_PLACE_FIELDS="source_id,name,category,region_scope,city,country_code,country_name,source_url,source_license,latitude,longitude,updated_at,wikidata_qid";
function client(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw Error("Mapped place source unavailable");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
const readPlace=unstable_cache(async(sourceId:string):Promise<OsmPlace|null>=>{
 const {data,error}=await client().from("gth_osm_attractions").select(OSM_PLACE_FIELDS)
 .eq("source_id",sourceId).eq("is_public",true).eq("is_community_directory",true)
 .abortSignal(AbortSignal.timeout(5_000)).maybeSingle();
 // Do not turn an outage into a cached 404 or an invented empty record.
 if(error)throw Error("Mapped place source temporarily unavailable");
 const row=data as OsmPlace|null;return validOsmPlace(row)?row:null;
},["gth-osm-place-v1"],{revalidate:OSM_SEO_CACHE_SECONDS,tags:["gth-osm-place-seo"]});
/** Metadata + body share one read; invalid IDs never reach the database. */
export const getOsmPlace=cache(async(slug:string)=>{
 if(process.env.GTH_OSM_PLACE_PAGES_ENABLED==="false")return null;
 const id=osmSourceId(slug);return id?readPlace(id):null;
});
/** One six-row read per country/day, shared by every place there. No per-place geospatial scan. */
export const relatedOsmPlaces=unstable_cache(async(country:string):Promise<OsmPlace[]>=>{
 if(!/^[A-Z]{2}$/.test(country))return [];
 const {data,error}=await client().from("gth_osm_attractions").select(OSM_PLACE_FIELDS)
 .eq("is_public",true).eq("is_community_directory",true).eq("country_code",country)
 .order("source_id",{ascending:true}).limit(6).abortSignal(AbortSignal.timeout(5_000));
 if(error)throw Error("Related mapped places unavailable");
 return ((data??[]) as OsmPlace[]).filter(validOsmPlace);
},["gth-osm-related-country-v1"],{revalidate:OSM_SEO_CACHE_SECONDS,tags:["gth-osm-place-seo"]});
