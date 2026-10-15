/**
 * GTH PRO licensed OSM accommodation source -> Supabase.
 * Trust boundary: GitHub default-branch OIDC token signed by GitHub RS256.
 * Anonymous requests are never authorized despite verify_jwt=false.
 * Service key stays exclusively inside the Supabase Edge Function.
 */
import {createRemoteJWKSet,jwtVerify} from "npm:jose@5.9.6";
const REPO="p13780811-debug/GTH-tour-travels-booking";
const REPO_ID="1169920747";
const WORKFLOW=REPO+"/.github/workflows/gth-osm-bulk-hotels.yml@refs/heads/main";
const AUDIENCE="gth-pro-hotel-ingest:dqprqjmhxjnrllczqyhz";
const ORIGIN="https://dqprqjmhxjnrllczqyhz.supabase.co";
const JWKS=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
 {timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000});
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const TYPES=new Set(["hotel","motel","hostel","guest_house","apartment","resort"]);
const KEYS=new Set(["source","source_id","name","city","country_code","address","latitude","longitude",
 "website","phone","category","source_license","source_url","image_url","image_source"]);
function isObject(v:unknown):v is Record<string,unknown>{
 return typeof v==="object"&&v!==null&&!Array.isArray(v);
}
function string(v:unknown,max:number):string|null{
 if(v===undefined||v===null||v==="")return null;
 if(typeof v!=="string"||!v.trim()||v.length>max||/[\u0000-\u001f]/.test(v))throw Error("Invalid text");
 return v.trim();
}
function safeHttps(v:unknown,max:number):string|null{
 const value=string(v,max);if(!value)return null;
 const url=new URL(value);
 if(url.protocol!=="https:"||url.username||url.password||url.port||!url.hostname.includes(".")||
  /^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname)||url.hostname==="localhost")throw Error("Unsafe URL");
 return url.toString();
}
function validHotel(raw:unknown){
 if(!isObject(raw)||Object.keys(raw).some(k=>!KEYS.has(k)))throw Error("Extra fields");
 const source=string(raw.source,20), id=string(raw.source_id,100);
 const name=string(raw.name,240),category=string(raw.category,30);
 const url=string(raw.source_url,200);
 const lat=raw.latitude, lon=raw.longitude;
 if(source!=="osm"||!id||!/^(?:node|way|relation)\/[0-9]{1,19}$/.test(id)||!name||
  !category||!TYPES.has(category)||raw.source_license!=="ODbL-1.0"||
  typeof lat!=="number"||typeof lon!=="number"||!Number.isFinite(lat)||!Number.isFinite(lon)||
  Math.abs(lat)>90||Math.abs(lon)>180||
  url!=="https://www.openstreetmap.org/"+id)throw Error("Untrusted OSM feature");
 const country=string(raw.country_code,2);
 if(country&&!/^[A-Z]{2}$/.test(country))throw Error("Invalid country");
 return {
   source:"osm",source_id:id,name,category,latitude:lat,longitude:lon,
   source_license:"ODbL-1.0",source_url:url,
   city:string(raw.city,100),country_code:country,address:string(raw.address,200),
   phone:string(raw.phone,100),website:safeHttps(raw.website,500),
   image_url:safeHttps(raw.image_url,500),
   image_source:raw.image_url?"osm_tag":null,
   updated_at:new Date().toISOString()
 };
}
async function authenticate(req:Request){
 const bearer=req.headers.get("Authorization")??"";
 if(!bearer.startsWith("Bearer ")||bearer.length>5500)throw Error("Missing identity");
 const {payload,protectedHeader}=await jwtVerify(bearer.slice(7),JWKS,{
   issuer:"https://token.actions.githubusercontent.com",audience:AUDIENCE,
   algorithms:["RS256"],clockTolerance:"5s"
 });
 if(protectedHeader.alg!=="RS256"||
  payload.sub!=="repo:"+REPO+":ref:refs/heads/main"||
  payload.repository!==REPO||String(payload.repository_id)!==REPO_ID||
  payload.ref!=="refs/heads/main"||payload.workflow_ref!==WORKFLOW||
  !["schedule","workflow_dispatch","push"].includes(String(payload.event_name)))
  throw Error("Unauthorized GitHub workflow");
}
Deno.serve(async req=>{
 if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:HEADERS});
 try{await authenticate(req);}catch{return Response.json({error:"Unauthorized workflow"},{status:401,headers:HEADERS});}
 try{
  const body=await req.text();
  if(body.length>125000)throw Error("Batch too large");
  const payload:unknown=JSON.parse(body);
  if(!isObject(payload)||Object.keys(payload).some(k=>k!=="records")||
   !Array.isArray(payload.records)||payload.records.length>100)throw Error("Invalid batch");
  const seen=new Set<string>();
  const records:ReturnType<typeof validHotel>[]=[];
  let rejected=0;
  for(const raw of payload.records){
   try{
    const item=validHotel(raw);
    if(!seen.has(item.source_id)){seen.add(item.source_id);records.push(item);}
   }catch{rejected++;}
  }
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!key||Deno.env.get("SUPABASE_URL")!==ORIGIN)
   return Response.json({error:"Importer temporarily unavailable"},{status:503,headers:HEADERS});
  if(records.length){
   const response=await fetch(ORIGIN+"/rest/v1/hotel_catalog?on_conflict=source,source_id",{
    method:"POST",headers:{
      apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",
      Prefer:"resolution=merge-duplicates,return=minimal"
    },body:JSON.stringify(records),signal:AbortSignal.timeout(15000)
   });
   if(!response.ok)return Response.json({error:"Catalog write failed"},{status:502,headers:HEADERS});
  }
  return Response.json({accepted:records.length,rejected,source:"OpenStreetMap",verified_room_inventory:false},
    {headers:HEADERS});
 }catch{
  return Response.json({error:"Invalid or unavailable source batch"},{status:400,headers:HEADERS});
 }
});
