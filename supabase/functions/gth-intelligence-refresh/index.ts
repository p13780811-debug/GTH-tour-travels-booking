import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createRemoteJWKSet,jwtVerify} from "npm:jose@5.9.6";
import {createClient} from "npm:@supabase/supabase-js@2.49.10";
import {REFRESH_AUDIENCE,trustedRefreshWorkflow} from "./workflow-policy.ts";
// This dedicated endpoint verifies GitHub signatures itself. The existing
// semantic inference endpoint keeps its Supabase JWT gateway enabled.
const keys=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),{timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000});
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
Deno.serve(async req=>{
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const header=req.headers.get("authorization")??"";
 try{
  if(!header.startsWith("Bearer ")||header.length>6000)throw Error();
  const {payload}=await jwtVerify(header.slice(7),keys,{issuer:"https://token.actions.githubusercontent.com",audience:REFRESH_AUDIENCE,algorithms:["RS256"],requiredClaims:["sub","exp","iat"],clockTolerance:5});
  if(!trustedRefreshWorkflow(payload))throw Error();
 }catch{return reply({error:"Unauthorised workflow"},401);}
 const endpoint=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!endpoint||!service||new URL(endpoint).origin!=="https://dqprqjmhxjnrllczqyhz.supabase.co")return reply({error:"Refresh unavailable"},503);
 const db=createClient(endpoint,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const reports:Record<string,unknown>[]=[];
 for(const sector of ["tender","attraction"]){
  // No payload-controlled table, sector, target URL, batch size or cursor.
  const {data:claim,error}=await db.rpc("gth_claim_semantic_refresh",{p_sector:sector});
  if(error)return reply({error:"Refresh queue unavailable"},503);
  if(!Array.isArray(claim)||!claim.length){reports.push({sector,status:"skipped_cooldown_or_capacity"});continue;}
  const offset=Number(claim[0].next_offset);
  try{
   if(!Number.isSafeInteger(offset)||offset<0||offset>996||offset%12!==0)throw Error();
   const result=await fetch(new URL("/functions/v1/gth-semantic-intelligence",endpoint),{method:"POST",redirect:"error",headers:{"Content-Type":"application/json",Authorization:"Bearer "+service,apikey:service},body:JSON.stringify({operation:"index",sector,offset}),signal:AbortSignal.timeout(65000)});
   const body=await result.json();
   if(!result.ok||body.model!=="gte-small"||!Number.isInteger(body.scanned)||body.scanned<0||body.scanned>12||!Number.isInteger(body.saved)||body.saved<0||body.saved>3)throw Error();
   const next_offset=body.scanned<12||offset+12>996?0:offset+12;
   const {error:saveError}=await db.from("gth_semantic_refresh_jobs").update({next_offset,last_success_at:new Date().toISOString(),lease_until:null,scanned:body.scanned,saved:body.saved,last_status:"ok"}).eq("sector",sector);
   if(saveError)throw Error();
   reports.push({sector,status:"ok",scanned:body.scanned,saved:body.saved});
  }catch{
   await db.from("gth_semantic_refresh_jobs").update({last_status:"failed",lease_until:null}).eq("sector",sector);
   reports.push({sector,status:"failed"});
  }
 }
 return reply({reports,batch_limit_per_sector:3},reports.some(r=>r.status==="failed")?503:200);
});

