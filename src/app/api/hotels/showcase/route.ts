import "server-only";
import {NextResponse} from "next/server";
import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";
import {HOTEL_SHOWCASE_INDIA,HOTEL_SHOWCASE_WORLD,getHotelMarket} from "@/lib/travel/nuitee-hotel-markets";
import {isDescriptiveHotelName,NON_PROPERTY_NAME_PATTERN} from "@/lib/travel/hotel-name-quality";
import {hotelSourceImageUrl} from "@/lib/travel/hotel-source-image";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type SampleHotel={
  id:string;name:string;city:string;country:string;image:string;source:"OpenStreetMap";
  category:"hotel";
};
type SampleResponse=Record<string,SampleHotel|null>;
const SHOWCASE_SLUGS=[...HOTEL_SHOWCASE_INDIA,...HOTEL_SHOWCASE_WORLD];
const CACHE_SECONDS=12*60*60;
const HEADERS={"X-Content-Type-Options":"nosniff","Cache-Control":"public, s-maxage=3600, stale-while-revalidate=3600"};

function safeSourceId(value:unknown):string|null{
  if(typeof value!=="string"||!/^(node|way|relation)\/[0-9]{1,19}$/.test(value))return null;
  return "osm:"+value.replace("/","-");
}

/** Bounded first-party OpenStreetMap directory lookup: never requests Nuitee hotel-data/rate APIs.
 * One cached batch serves the entire featured-city gallery (not 14 browser requests).
 * No Supabase service role, writes, cron, paid APIs or guesswork about supplier hotel IDs.
 */
const cachedShowcase=unstable_cache(async():Promise<SampleResponse>=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)throw new Error("Hotel directory configuration unavailable");
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const output:SampleResponse={};
  const signal=AbortSignal.timeout(8500);
  // Limit fan-out to three concurrent small reads; cache result across visitors.
  for(let offset=0;offset<SHOWCASE_SLUGS.length;offset+=3){
    const batch=SHOWCASE_SLUGS.slice(offset,offset+3);
    const entries=await Promise.all(batch.map(async slug=>{
      const market=getHotelMarket(slug);
      if(!market)return [slug,null] as const;
      try{
        const {data,error}=await db.from("hotel_catalog")
          .select("source_id,name,city,image_url")
          .eq("source","osm").eq("category","hotel")
          .ilike("city",market.supplierCity)
          .or("country_code.eq."+market.countryCode+",extract_country_hint.eq."+market.countryCode)
          .not("name","imatch",NON_PROPERTY_NAME_PATTERN)
          .order("name",{ascending:true}).limit(8).abortSignal(signal);
        if(error)return [slug,null] as const;
        for(const row of data||[]){
          const id=safeSourceId(row.source_id);
          if(!id||typeof row.name!=="string"||!isDescriptiveHotelName(row.name)||
             typeof row.city!=="string")continue;
          const hotel:SampleHotel={
            id,name:row.name,city:row.city,country:market.countryCode,
            image:hotelSourceImageUrl(row.image_url)||"/placeholder.jpg",
            source:"OpenStreetMap",category:"hotel"
          };
          return [slug,hotel] as const;
        }
        return [slug,null] as const;
      }catch{return [slug,null] as const;}
    }));
    for(const [slug,hotel] of entries)output[slug]=hotel;
  }
  return output;
},["gth-pro-osm-hotel-city-showcase-v1"],{revalidate:CACHE_SECONDS});

export async function GET(){
  try{
    const samples=await cachedShowcase();
    return NextResponse.json({samples,source:"OpenStreetMap",liveRates:false}, {headers:HEADERS});
  }catch{
    return NextResponse.json({error:"Hotel directory samples unavailable"},{status:503,
      headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }
}
