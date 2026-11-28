import {NextResponse} from "next/server";
import {storePublicEdgeCache} from "@/lib/security/public-edge-cache";
import {unstable_cache} from "next/cache";
import {supabase} from "@/lib/supabase";
import {countryCodeForDestinationName} from "@/lib/travel/osmCountryCodes";
import {MOBILITY_CITIES,mobilityCity,mobilityCityKey,mobilityText,type MobilityCity} from "@/lib/mobility/city";

const searchCatalog=unstable_cache(async (prefix:string)=>{
  const pattern=prefix.replace(/[\\%_]/g,"\\$&")+"%";
  const {data,error}=await supabase.from("destinations")
    .select("name,slug,country,country_code").is("is_active",true)
    .ilike("name",pattern).order("name").order("slug").limit(15)
    .abortSignal(AbortSignal.timeout(3000));
  if(error||!data)throw new Error("City search unavailable");
  return data.flatMap(row=>{
    const city=mobilityCity({name:row.name,slug:row.slug,country:row.country,
      countryCode:row.country_code??countryCodeForDestinationName(row.country)});
    return city?[city]:[];
  });
},["gth-mobility-city-prefix-v2"],{revalidate:900,tags:["public-destination-catalog"]});

export async function GET(request:Request){
  const query=new URL(request.url).searchParams.get("q");
  const prefix=mobilityText(query,70).toLocaleLowerCase("en");
  if(prefix.length<2)return NextResponse.json({cities:[],degraded:false},{status:400});
  const matches=new Map<string,MobilityCity>();
  for(const city of MOBILITY_CITIES){
    if(city.name.toLocaleLowerCase("en").startsWith(prefix))matches.set(mobilityCityKey(city),city);
  }
  let degraded=false;
  try{for(const city of await searchCatalog(prefix))matches.set(mobilityCityKey(city),city);}
  catch{degraded=true;}
  const response=NextResponse.json({cities:[...matches.values()].slice(0,12),degraded},{
    headers:{"Cache-Control":degraded?"no-store":"public, s-maxage=300, stale-while-revalidate=60"},
  });
  return degraded?response:storePublicEdgeCache(request,response);
}
