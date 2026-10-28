/** ODbL bulk source ingestion: GitHub Actions OIDC RS256 / exact main workflow only. */
import {createRemoteJWKSet,jwtVerify} from "npm:jose@5.9.6";
const REPO="p13780811-debug/GTH-tour-travels-booking";
const WORKFLOW=REPO+"/.github/workflows/gth-osm-attractions-sync.yml@refs/heads/main";
const AUD="gth-osm-attractions:dqprqjmhxjnrllczqyhz";
const PROJECT_URL="https://dqprqjmhxjnrllczqyhz.supabase.co";
const JWKS=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
 {timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000});
const H={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const CATEGORIES=new Set(["attraction","museum","viewpoint","zoo","theme-park","fort","castle","ruins","monument","archaeological-site","beach","national-park","park","nature-reserve"]);
const REGION=/^[a-z0-9-]+(?:\/[a-z0-9-]+){0,5}$/;
const CODE=/^[A-Z]{2}$/;
const KEYS=new Set(["source_id","name","category","region_scope","city","latitude","longitude","source_url","source_region","source_license","wikidata_qid","country_code","country_name"]);
function record(raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("Invalid OSM item");
 const r=raw as Record<string,unknown>;
 if(Object.keys(r).some(k=>!KEYS.has(k)))throw Error("Extra fields rejected");
 const id=r.source_id;
 if(typeof id!=="string"||!/^(node|way|relation)\/[1-9][0-9]{0,18}$/.test(id)||
  r.source_url!=="https://www.openstreetmap.org/"+id||
  typeof r.name!=="string"||r.name.length<3||r.name.length>180||
  /[\u0000-\u001f<>]/.test(r.name)||!CATEGORIES.has(String(r.category))||
  !["goa","india","world"].includes(String(r.region_scope))||typeof r.source_region!=="string"||!REGION.test(r.source_region)||
  r.source_license!=="ODbL-1.0"||
  typeof r.latitude!=="number"||typeof r.longitude!=="number"||
  !Number.isFinite(r.latitude)||!Number.isFinite(r.longitude)||
  r.latitude< -90||r.latitude>90||r.longitude< -180||r.longitude>180||
  !CODE.test(String(r.country_code))||typeof r.country_name!=="string"||r.country_name.length<2||r.country_name.length>100||/[\u0000-\u001f<>]/.test(r.country_name)||
  (r.country_code==="IN"&&!(r.latitude>=6&&r.latitude<=37.5&&r.longitude>=68&&r.longitude<=98))||
  (r.region_scope==="world"&&r.country_code==="IN")||
  (r.region_scope!=="world"&&r.country_code!=="IN")||
  (r.region_scope==="goa"&&!(r.latitude>=14.8&&r.latitude<=15.9&&r.longitude>=73.6&&r.longitude<=74.5))||
  (r.city!==null&&(typeof r.city!=="string"||r.city.length<3||r.city.length>100||/[\u0000-\u001f<>]/.test(r.city)))||
  (r.wikidata_qid!==null&&(typeof r.wikidata_qid!=="string"||!/^Q[1-9][0-9]{0,14}$/.test(r.wikidata_qid))))
  throw Error("Untrusted OSM source facts");
 return r;
}
async function authorised(req:Request){
 const auth=req.headers.get("authorization")||"";
 if(!auth.startsWith("Bearer ")||auth.length>6000)throw Error("Missing signed identity");
 const {payload,protectedHeader}=await jwtVerify(auth.slice(7),JWKS,{issuer:"https://token.actions.githubusercontent.com",audience:AUD,algorithms:["RS256"],clockTolerance:"5s"});
 if(protectedHeader.alg!=="RS256"||payload.repository!==REPO||
  String(payload.repository_id)!=="1169920747"||payload.ref!=="refs/heads/main"||
  payload.workflow_ref!==WORKFLOW||payload.sub!=="repo:"+REPO+":ref:refs/heads/main"||
  !["push","schedule","workflow_dispatch"].includes(String(payload.event_name)))
  throw Error("Untrusted GitHub workflow");
 return String(payload.run_id);
}
Deno.serve(async req=>{
 if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:H});
 if(Deno.env.get("GTH_OSM_ATTRACTIONS_WRITES_ENABLED")!=="true")
  return Response.json({error:"Attraction ingestion paused for database stabilization",writes_disabled:true},{status:503,headers:H});
 let workflowRun="";
 try{workflowRun=await authorised(req);}catch{return Response.json({error:"Unauthorized workflow"},{status:401,headers:H});}
 try{
  const raw=await req.text();
  if(raw.length>72000)throw Error("Batch too large");
  const body:unknown=JSON.parse(raw);
  if(!body||typeof body!=="object"||Array.isArray(body))throw Error("Invalid payload");
  const payload=body as Record<string,unknown>;
  if(Object.keys(payload).length===1&&payload.summary){
   const summary=payload.summary;
   if(!summary||typeof summary!=="object"||Array.isArray(summary))throw Error("Invalid sync summary");
   const s=summary as Record<string,unknown>;
   if(Object.keys(s).some(k=>!["run_id","source_region","country_code","country_name","accepted"].includes(k))||
    s.run_id!==workflowRun||typeof s.source_region!=="string"||!REGION.test(s.source_region)||
    !CODE.test(String(s.country_code))||typeof s.country_name!=="string"||s.country_name.length<2||s.country_name.length>100||
    /[\u0000-\u001f<>]/.test(s.country_name)||!Number.isInteger(s.accepted)||Number(s.accepted)<0||Number(s.accepted)>250000)
    throw Error("Invalid source audit");
   const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
   if(!key||Deno.env.get("SUPABASE_URL")!==PROJECT_URL)return Response.json({error:"DB service unavailable"},{status:503,headers:H});
   const response=await fetch(PROJECT_URL+"/rest/v1/gth_osm_attraction_sync_runs?on_conflict=run_id",{method:"POST",
    headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
    body:JSON.stringify({...s,source_license:"ODbL-1.0"}),signal:AbortSignal.timeout(20000)});
   if(!response.ok)return Response.json({error:"Sync audit DB write failed"},{status:502,headers:H});
   const refresh=await fetch(PROJECT_URL+"/rest/v1/rpc/gth_refresh_osm_attraction_summary",{method:"POST",
    headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({p_country_code:s.country_code}),signal:AbortSignal.timeout(20000)});
   if(!refresh.ok)return Response.json({error:"Source summary refresh failed"},{status:502,headers:H});
   return Response.json({recorded:true,summary_refreshed:true},{headers:H});
  }
  if(Object.keys(payload).some(k=>k!=="rows"))throw Error("Invalid payload");
  const rows=payload.rows;
  if(!Array.isArray(rows)||rows.length<1||rows.length>100)throw Error("Invalid bounded rows");
  const entries=rows.map(record);
  if(new Set(entries.map(r=>r.source_id)).size!==entries.length)throw Error("Duplicate element");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!key||Deno.env.get("SUPABASE_URL")!==PROJECT_URL)return Response.json({error:"DB service unavailable"},{status:503,headers:H});
  const result=await fetch(PROJECT_URL+"/rest/v1/rpc/gth_upsert_osm_attractions",{method:"POST",
   headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},
   body:JSON.stringify({p_rows:entries}),signal:AbortSignal.timeout(20000)});
  if(!result.ok)return Response.json({error:"Source DB write unavailable"},{status:502,headers:H});
  return Response.json({accepted:entries.length,source:"OpenStreetMap ODbL-1.0",
   verified_tickets:0,community_directory_only:true},{headers:H});
 }catch{return Response.json({error:"Rejected untrusted OSM batch"},{status:400,headers:H});}
});
