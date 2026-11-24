import "server-only";
import {createClient} from "@supabase/supabase-js";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {RequestError} from "@/lib/security/request";

let minute=-1,day=-1,minuteCount=0,dayCount=0;
let redisRetryAt=0;
/** Only cache fills consume the refresh budget, never ordinary warm views.
 * Existing Upstash gives one shared, environment-separated global bucket.
 * An unavailable configured limiter falls back to one database-backed bucket.
 * The original per-worker budget remains available for local unconfigured builds.
 */
export async function reserveTenderRefresh():Promise<void>{
 const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(url||token){
  if(Date.now()>=redisRetryAt){
   try{
    await enforceRateLimit(new Request("https://www.gthproglobal.com/api/tender"),"tender_reads","shared-public-catalogue");
    return;
   }catch(error){
    if(!(error instanceof RequestError)||error.status!==503)throw error;
    redisRetryAt=Date.now()+60000;
    console.warn("Tender read budget using database fallback");
   }
  }
  await reserveDatabaseBudget();
  return;
 }
 const now=Date.now(),currentMinute=Math.floor(now/60000),currentDay=Math.floor(now/86400000);
 if(minute!==currentMinute){minute=currentMinute;minuteCount=0;}
 if(day!==currentDay){day=currentDay;dayCount=0;}
 if(minuteCount>=30||dayCount>=1000)throw new RequestError("Catalogue refresh is busy. Please try again shortly.",429,{"Retry-After":"60"});
 minuteCount++;dayCount++;
}
export function tenderReadProtection(){return process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN?"shared":"per-worker";}

async function reserveDatabaseBudget(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new RequestError("Request protection unavailable",503);
 const environment=process.env.VERCEL_ENV??(process.env.NODE_ENV==="production"?"production":"development");
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.rpc("tender_reserve_fallback_read",{p_environment:environment})
  .abortSignal(AbortSignal.timeout(2500));
 if(error||typeof data!=="boolean")throw new RequestError("Request protection unavailable",503);
 if(!data)throw new RequestError("Catalogue refresh is busy. Please try again shortly.",429,{"Retry-After":"60"});
}
