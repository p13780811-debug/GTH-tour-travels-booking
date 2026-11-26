import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";
import {getMobilityCity} from "@/lib/mobility/catalog";
import type {MobilityCity} from "@/lib/mobility/city";
import {mobilityOverpassQuery,parseMobilityMap} from "@/lib/mobility/osm";

const OVERPASS=["https://overpass.private.coffee/api/interpreter","https://overpass-api.de/api/interpreter"] as const;
const cacheHeaders={"Cache-Control":"public, max-age=0, s-maxage=21600, stale-while-revalidate=3600"};
const mapData=unstable_cache(async(city:MobilityCity)=>{
  const query=mobilityOverpassQuery(city);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!query||!url||!key)throw new Error("Mobility map unavailable");
  const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  for(const endpoint of OVERPASS){
    const {data:allowed,error}=await db.rpc("mobility_reserve_map_read").abortSignal(AbortSignal.timeout(2300));
    if(error||allowed!==true)break;
    try{
      const response=await fetch(endpoint,{method:"POST",body:new URLSearchParams({data:query}),
        headers:{"User-Agent":"GTH PRO Global Mobility (https://www.gthproglobal.com/about)"},
        signal:AbortSignal.timeout(7200),cache:"no-store"});
      if(!response.ok){
        console.warn("Mobility map provider status",new URL(endpoint).hostname,response.status);
        continue;
      }
      const body=await response.json();
      const parsed=parseMobilityMap(body);
      if(parsed)return {state:"available",...parsed} as const;
      // A valid empty/ambiguous result means trying an equivalent mirror would not help.
      if(!body.remark)break;
      console.warn("Mobility map provider returned a partial snapshot",new URL(endpoint).hostname);
    }catch{
      console.warn("Mobility map provider timed out or was unreachable",new URL(endpoint).hostname);
    }
  }
  // Never store provider errors as successful six-hour map snapshots.
  throw new Error("Mobility map unavailable");
},["mobility-osm-city-v3"],{revalidate:21600});

export async function GET(request:Request){
  try{
    const slug=new URL(request.url).searchParams.get("city")??"";
    const city=await getMobilityCity(slug);
    if(!city||city.slug!==slug)return Response.json({state:"unknown"},{status:404,headers:{"Cache-Control":"no-store"}});
    const result=await mapData(city);
    return Response.json(result,{headers:cacheHeaders});
  }catch{return Response.json({state:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}
}
