import "server-only";
import {enforceRateLimit} from "@/lib/security/rate-limit";
let minute=-1,day=-1,minutes=0,days=0;
/** Shared existing Redis if configured; otherwise a per-worker fallback only.
 * Called on metadata cache fills, never on warm visits or supplier checkout. */
export async function reserveNuiteeRefresh(){
  if(process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_TOKEN){
    await enforceRateLimit(new Request("https://www.gthproglobal.com/api/hotels/discovery"),"hotel_content","shared-free-hotel-content");return;
  }
  const now=Date.now(),m=Math.floor(now/60000),d=Math.floor(now/86400000);
  if(m!==minute){minute=m;minutes=0;}if(d!==day){day=d;days=0;}
  if(minutes>=10||days>=200)throw Error("Hotel reference refresh budget exhausted");
  minutes++;days++;
}
