import "server-only";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {RequestError} from "@/lib/security/request";

let minute=-1,day=-1,minuteCount=0,dayCount=0;
/** Only cache fills consume the refresh budget, never ordinary warm views.
 * Existing Upstash gives one shared, environment-separated global bucket.
 * Without Redis, this fallback is per worker, NOT a fleet-wide quota guarantee.
 */
export async function reserveTenderRefresh():Promise<void>{
 const url=process.env.UPSTASH_REDIS_REST_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(url||token){
  await enforceRateLimit(new Request("https://www.gthproglobal.com/api/tender"),"tender_reads","shared-public-catalogue");
  return;
 }
 const now=Date.now(),currentMinute=Math.floor(now/60000),currentDay=Math.floor(now/86400000);
 if(minute!==currentMinute){minute=currentMinute;minuteCount=0;}
 if(day!==currentDay){day=currentDay;dayCount=0;}
 if(minuteCount>=30||dayCount>=1000)throw new RequestError("Catalogue refresh is busy. Please try again shortly.",429,{"Retry-After":"60"});
 minuteCount++;dayCount++;
}
export function tenderReadProtection(){return process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN?"shared":"per-worker";}
