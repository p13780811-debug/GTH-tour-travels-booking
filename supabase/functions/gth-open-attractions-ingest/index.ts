/** GitHub Actions RS256 OIDC only, main-branch workflow bound. No public DB write. */
import {createRemoteJWKSet,jwtVerify} from "npm:jose@5.9.6";
const REPO="p13780811-debug/GTH-tour-travels-booking";
const WORKFLOW=REPO+"/.github/workflows/gth-open-attractions-sync.yml@refs/heads/main";
const AUD="gth-open-attractions:dqprqjmhxjnrllczqyhz";
const ORIGIN="https://dqprqjmhxjnrllczqyhz.supabase.co";
const JWKS=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),{timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000});
const H={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const LICENSES=new Map([
 ["CC BY 4.0","https://creativecommons.org/licenses/by/4.0/"],
 ["CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/"],
 ["CC BY 3.0","https://creativecommons.org/licenses/by/3.0/"],
 ["CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/"],
 ["CC0","https://creativecommons.org/publicdomain/zero/1.0/"],
 ["Public domain","https://creativecommons.org/publicdomain/mark/1.0/"]
]);
function url(value:unknown,host:string,prefix:string):boolean{
 if(typeof value!=="string"||value.length>1600)return false;
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname===host&&u.pathname.startsWith(prefix)&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash;}catch{return false;}
}
function row(x:unknown){
 if(!x||typeof x!=="object"||Array.isArray(x))throw Error("Invalid record");
 const v=x as Record<string,unknown>;
 const fields=["wikidata_qid","name","description","region_slug","country_code","category","latitude","longitude","wikidata_url","source_license","image_url","commons_page","image_author","image_license","image_license_url","media_checked_at"];
 if(Object.keys(v).some(k=>!fields.includes(k)))throw Error("Unapproved field");
 const q=v.wikidata_qid,n=v.name,region=v.region_slug,cat=v.category,lat=v.latitude,lon=v.longitude;
 if(typeof q!=="string"||!/^Q[1-9][0-9]{0,14}$/.test(q)||typeof n!=="string"||n.length<2||n.length>180||
  /[\u0000-\u001f<>]/.test(n)||!["goa","maharashtra"].includes(String(region))||
  !["attraction","fort","beach","national-park","castle"].includes(String(cat))||v.country_code!=="IN"||
  v.source_license!=="CC0-1.0"||typeof lat!=="number"||typeof lon!=="number"||!Number.isFinite(lat)||!Number.isFinite(lon)||
  lat< -90||lat>90||lon< -180||lon>180||lat===0&&lon===0||
  (region==="goa"&&!(lat>=14.8&&lat<=15.9&&lon>=73.6&&lon<=74.5))||
  (region==="maharashtra"&&!(lat>=15&&lat<=23&&lon>=72&&lon<=81))||
  v.wikidata_url!=="https://www.wikidata.org/wiki/"+q)throw Error("Untrusted Wikidata identity/location");
 if(v.description!==null&&(typeof v.description!=="string"||v.description.length>500||/[\u0000-\u001f<>]/.test(v.description)))throw Error("Invalid description");
 if(v.image_url!==null){
  if(!url(v.image_url,"upload.wikimedia.org","/wikipedia/commons/")||
     !url(v.commons_page,"commons.wikimedia.org","/wiki/File:")||
     typeof v.image_author!=="string"||!v.image_author||v.image_author.length>300||
     LICENSES.get(String(v.image_license))!==v.image_license_url||
     typeof v.media_checked_at!=="string"||!Number.isFinite(Date.parse(v.media_checked_at)))throw Error("Unlicensed photo");
 }else if(["commons_page","image_author","image_license","image_license_url","media_checked_at"].some(k=>v[k]!==null))throw Error("Partial media");
 return v;
}
async function authorised(request:Request){
 const h=request.headers.get("authorization")||"";
 if(!h.startsWith("Bearer ")||h.length>6000)throw Error("Missing token");
 const {payload,protectedHeader}=await jwtVerify(h.slice(7),JWKS,{issuer:"https://token.actions.githubusercontent.com",audience:AUD,algorithms:["RS256"],clockTolerance:"5s"});
 if(protectedHeader.alg!=="RS256"||payload.repository!==REPO||
   String(payload.repository_id)!=="1169920747"||payload.ref!=="refs/heads/main"||
   payload.workflow_ref!==WORKFLOW||payload.sub!=="repo:"+REPO+":ref:refs/heads/main"||
   !["push","schedule","workflow_dispatch"].includes(String(payload.event_name)))throw Error("Untrusted workflow");
}
Deno.serve(async request=>{
 if(request.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:H});
 try{await authorised(request);}catch{return Response.json({error:"Unauthorized"},{status:401,headers:H});}
 try{
  const body=await request.text();if(body.length>85000)throw Error("Too large");
  const raw:unknown=JSON.parse(body);
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).some(k=>k!=="rows"))throw Error("Invalid request");
  const batch=(raw as {rows?:unknown}).rows;
  if(!Array.isArray(batch)||batch.length<1||batch.length>40)throw Error("Bounded batch required");
  const items=batch.map(row);
  if(new Set(items.map(x=>x.wikidata_qid)).size!==items.length)throw Error("Duplicate source");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!key||Deno.env.get("SUPABASE_URL")!==ORIGIN)return Response.json({error:"Writer unavailable"},{status:503,headers:H});
  const response=await fetch(ORIGIN+"/rest/v1/rpc/gth_upsert_open_attractions",{method:"POST",headers:{
   apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},
   body:JSON.stringify({p_rows:items}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)return Response.json({error:"Source DB write failed"},{status:502,headers:H});
  return Response.json({accepted:items.length,published:false,verified_tickets:0},{headers:H});
 }catch{return Response.json({error:"Rejected untrusted source batch"},{status:400,headers:H});}
});