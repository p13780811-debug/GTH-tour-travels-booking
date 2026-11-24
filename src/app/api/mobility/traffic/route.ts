import {unstable_cache,revalidateTag} from "next/cache";
import {supabase} from "@/lib/supabase";
import {authenticatedStorage} from "@/lib/security/auth";
import {readJson,requestError,RequestError} from "@/lib/security/request";
import {isTrafficCity,validTrafficZone,isReportKind,validReportId,reportsForZone,type TrafficFeed,type TrafficCity} from "@/lib/mobility/traffic";

const feedTag=(city:TrafficCity)=>"mobility-traffic:"+city;
const loadFeed=(city:TrafficCity)=>unstable_cache(async()=>{
  const {data,error}=await supabase.rpc("mobility_traffic_feed",{p_city:city}).abortSignal(AbortSignal.timeout(4500));
  if(!error&&data===null)return null;
  if(error||!data||!Array.isArray(data.zones)||!Array.isArray(data.reports))throw new RequestError("Traffic feed unavailable",503);
  return data as TrafficFeed;
},["gth-public-traffic-v1",city],{revalidate:45,tags:[feedTag(city)]})();

export async function GET(request:Request){
  try{
    const city=new URL(request.url).searchParams.get("city");
    if(!isTrafficCity(city))throw new RequestError("Traffic reporting unavailable for this city",400);
    const feed=await loadFeed(city);
    if(!feed)throw new RequestError("Traffic city unavailable",404);
    return Response.json({zones:feed.zones,reports:reportsForZone(feed.reports,"")},{
      headers:{"Cache-Control":"public, max-age=0, s-maxage=25"},
    });
  }catch(error){return requestError(error);}
}

export async function POST(request:Request){
  try{
    const {city,zone,kind,id}=await readJson(request,512);
    if(!isTrafficCity(city)||(id!==undefined? !validReportId(id):!validTrafficZone(zone)||!isReportKind(kind))){
      throw new RequestError("Invalid traffic report",400);
    }
    const {client}=await authenticatedStorage(request);
    if(id!==undefined){
      const {data,error}=await client.rpc("mobility_withdraw_traffic_report",{p_id:id,p_city:city}).abortSignal(AbortSignal.timeout(4500));
      if(error)throw new RequestError("Traffic service unavailable",503);
      if(data!==true)throw new RequestError("Report unavailable",404);
      revalidateTag(feedTag(city));
      return Response.json({ok:true},{headers:{"Cache-Control":"no-store"}});
    }
    const {data,error}=await client.rpc("mobility_submit_traffic_report",{p_city:city,p_zone:zone,p_kind:kind}).abortSignal(AbortSignal.timeout(4500));
    if(error?.code==="PT429")throw new RequestError("Traffic report limit reached",429,{"Retry-After":"120"});
    if(error?.code==="42501")throw new RequestError("Confirmed account required",403);
    if(error?.code==="22023")throw new RequestError("Invalid traffic report",400);
    if(error||!validReportId(data))throw new RequestError("Traffic service unavailable",503);
    revalidateTag(feedTag(city));
    return Response.json({id:data},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){return requestError(error);}
}
