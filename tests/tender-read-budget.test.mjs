import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

function budget(configured,{redisStatus,databaseAllowed=true}={}){
 let tick=0,redisCalls=0,databaseCalls=0;
 const env=configured?{UPSTASH_REDIS_REST_URL:"https://fixture.upstash.io",UPSTASH_REDIS_REST_TOKEN:"fixture",
  NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"private-fixture",VERCEL_ENV:"preview"}:{};
 class RequestError extends Error{constructor(message,status){super(message);this.status=status;}}
 const api=loadTenderTs("src/lib/tender/read-budget.ts",{
  "server-only":{},
  "@/lib/security/request":{RequestError},
  "@/lib/security/rate-limit":{enforceRateLimit:async(req,scope,id)=>{
   redisCalls++;
   assert.equal(scope,"tender_reads");
   assert.equal(id,"shared-public-catalogue");
   assert.equal(new URL(req.url).hostname,"www.gthproglobal.com");
   if(redisStatus)throw new RequestError("Limiter test",redisStatus);
  }},
  "@supabase/supabase-js":{createClient:()=>({rpc:(name,params)=>{
   assert.equal(name,"tender_reserve_fallback_read");
   assert.equal(params.p_environment,"preview");
   databaseCalls++;
   return {abortSignal:async()=>({data:databaseAllowed,error:null})};
  }})}
 },{process:{env},Date:class extends Date{static now(){return tick;}}});
 return {api,redisCalls:()=>redisCalls,databaseCalls:()=>databaseCalls,advance:ms=>tick+=ms};
}
test("configured limiter keeps an environment-separated shared budget without visitor identifiers",async()=>{
 const h=budget(true);
 await h.api.reserveTenderRefresh();
 assert.equal(h.redisCalls(),1);
 assert.equal(h.databaseCalls(),0);
 assert.equal(h.api.tenderReadProtection(),"shared");
});
test("only unavailable Redis switches to the limited shared database budget for a minute",async()=>{
 const unavailable=budget(true,{redisStatus:503});
 await unavailable.api.reserveTenderRefresh();
 await unavailable.api.reserveTenderRefresh();
 assert.equal(unavailable.redisCalls(),1);
 assert.equal(unavailable.databaseCalls(),2);
 unavailable.advance(60000);
 await unavailable.api.reserveTenderRefresh();
 assert.equal(unavailable.redisCalls(),2);
 const exhausted=budget(true,{redisStatus:429});
 await assert.rejects(exhausted.api.reserveTenderRefresh(),error=>error.status===429);
 assert.equal(exhausted.databaseCalls(),0);
 const rejected=budget(true,{redisStatus:503,databaseAllowed:false});
 await assert.rejects(rejected.api.reserveTenderRefresh(),error=>error.status===429);
});
test("no-Redis fallback rejects excess refreshes and resets by minute while remaining per worker",async()=>{
 const h=budget(false);
 for(let i=0;i<30;i++)await h.api.reserveTenderRefresh();
 await assert.rejects(h.api.reserveTenderRefresh(),error=>error.status===429);
 h.advance(60000);
 await h.api.reserveTenderRefresh();
 assert.equal(h.api.tenderReadProtection(),"per-worker");
 assert.equal(h.redisCalls(),0);
 assert.equal(h.databaseCalls(),0);
});
