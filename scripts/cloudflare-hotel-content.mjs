import {DurableObject} from "cloudflare:workers";
import {hotelContentScope,readHotelContent} from "../src/lib/travel/nuitee-hotel-content-core.ts";

// One named object for the whole deployment. Persistent atomic reservations
// enforce tighter limits than the old shared Redis policy: 10/min and 200/day.
// Only GET /data/hotels is possible; no rates, places, payments or booking.
const FRESH=86400000,STALE=7*FRESH,MAX_MINUTE=10,MAX_DAY=200;
const ok=(page,stale=false)=>Response.json({...page,stale},{headers:{"Cache-Control":"private, no-store"}});
const unavailable=()=>Response.json({error:"Hotel content temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store","Retry-After":"120"}});
export class HotelContentCache extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.store=ctx.storage;this.runtime=env;this.fills=new Map();this.failures=new Map();}
  async reserve(){
    return this.store.transaction(async tx=>{
      const now=Date.now(),old=await tx.get("budget")||{};
      const minute=Number.isFinite(old.minuteUntil)&&old.minuteUntil>now?old.minute:0;
      const day=Number.isFinite(old.dayUntil)&&old.dayUntil>now?old.day:0;
      if(!Number.isSafeInteger(minute)||!Number.isSafeInteger(day)||minute<0||day<0||minute>=MAX_MINUTE||day>=MAX_DAY)return false;
      await tx.put("budget",{minute:minute+1,day:day+1,minuteUntil:minute?old.minuteUntil:now+60000,dayUntil:day?old.dayUntil:now+FRESH});
      return true;
    });
  }
  async fetch(request){
    const u=new URL(request.url);
    if(request.method!=="GET"||u.hostname!=="hotel-content.internal"||u.pathname!=="/profiles"||u.search.length>500||
      [...u.searchParams.keys()].some(k=>!["country","city","page"].includes(k)||u.searchParams.getAll(k).length!==1)||
      !/^[1-9][0-9]{0,2}$/.test(u.searchParams.get("page")||""))return new Response(null,{status:400});
    let scope;try{scope=hotelContentScope(u.searchParams.get("country"),u.searchParams.get("city")??"",Number(u.searchParams.get("page")));}catch{return new Response(null,{status:400});}
    const cacheKey="profile:"+scope.key;
    let cached;try{cached=await this.store.get(cacheKey);}catch{return unavailable();}
    const age=cached?Date.now()-cached.checkedAt:Infinity;
    if(age>=0&&age<FRESH)return ok(cached.page);
    const stale=()=>age>=0&&age<STALE?ok(cached.page,true):unavailable();
    if((this.failures.get(cacheKey)||0)>Date.now())return stale();
    let work=this.fills.get(cacheKey);
    if(!work){
      work=(async()=>{
        try{
          // A protected preview must never become a second production supplier
          // quota pool. Only the actual production hostname's Worker is allowed
          // to refresh; the runtime label is controlled by deployment config.
          if(this.runtime.VERCEL_ENV!=="production"||!this.runtime.NUITEE_PRODUCTION_API_KEY)return null;
          if(!await this.reserve())return null;
          const page=await readHotelContent(scope.country,scope.city,scope.page,this.runtime.NUITEE_PRODUCTION_API_KEY);
          await this.store.put(cacheKey,{checkedAt:Date.now(),page});
          try{if(await this.store.getAlarm()===null)await this.store.setAlarm(Date.now()+FRESH);}catch{/* The request cap still holds. */}
          return page;
        }catch{return null;}
      })();
      this.fills.set(cacheKey,work);
    }
    try{
      const page=await work;
      if(page)return ok(page);
      if(this.failures.size>1000)this.failures.clear();
      this.failures.set(cacheKey,Date.now()+120000);
      return stale();
    }finally{if(this.fills.get(cacheKey)===work)this.fills.delete(cacheKey);}
  }
  async alarm(){
    // Expire old metadata. Budget counters are separate and are never reset here.
    const now=Date.now();let startAfter,remaining=false;
    do{
      const batch=await this.store.list({prefix:"profile:",limit:500,...(startAfter?{startAfter}:{})});
      if(!batch.size)break;
      const remove=[];for(const [k,v] of batch){startAfter=k;if(!Number.isFinite(v?.checkedAt)||now-v.checkedAt>=STALE)remove.push(k);else remaining=true;}
      if(remove.length)for(let n=0;n<remove.length;n+=100)await this.store.delete(remove.slice(n,n+100));
      if(batch.size<500)break;
    }while(startAfter);
    if(remaining)await this.store.setAlarm(now+FRESH);
  }
}
