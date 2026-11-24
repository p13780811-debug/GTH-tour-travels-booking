import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";
import {getMobilityCity} from "@/lib/mobility/catalog";
import type {MobilityCity} from "@/lib/mobility/city";
import {mobilityOverpassQuery,parseMobilityMap} from "@/lib/mobility/osm";

const OVERPASS="https://overpass-api.de/api/interpreter";
const cacheHeaders={"Cache-Control":"public, max-age=0, s-maxage=21600, stale-while-revalidate=3600"};
const mapData=unstable_cache(async(city:MobilityCity)=>{
  const query=mobilityOverpassQuery(city);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!query||!url||!key)return {state:"unavailable"} as const;
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:allowed,error}=await db.rpc("mobility_reserve_map_read").abortSignal(AbortSignal.timeout(2500));
  if(error||allowed!==true)return {state:"unavailable"} as const;
  try{
    const response=await fetch(OVERPASS,{method:"POST",body:new URLSearchParams({data:query}),
      headers:{"User-Agent":"GTH PRO Global Mobility (https://www.gthproglobal.com/about)"},
      signal:AbortSignal.timeout(12000),cache:"no-store"});
    if(!response.ok)return {state:"unavailable"} as const;
    const parsed=parseMobilityMap(await response.json());
    return parsed?{state:"available",...parsed} as const:{state:"unavailable"} as const;
  }catch{return {state:"unavailable"} as const;}
},["mobility-osm-city-v1"],{revalidate:21600});

export async function GET(request:Request){
  try{
    const slug=new URL(request.url).searchParams.get("city")??"";
    const city=await getMobilityCity(slug);
    if(!city||city.slug!==slug)return Response.json({state:"unknown"},{status:404,headers:{"Cache-Control":"no-store"}});
    const result=await mapData(city);
    return Response.json(result,{headers:result.state==="available"?cacheHeaders:{"Cache-Control":"public, max-age=0, s-maxage=300"}});
  }catch{return Response.json({state:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
