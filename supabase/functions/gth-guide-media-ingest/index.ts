/** Rights-limited Commons metadata candidate intake. Never autoapprove or publish.
 * Only the exact GitHub main workflow can write unapproved candidates.
 */
import {createRemoteJWKSet,jwtVerify} from "npm:jose@5.9.6";
const REPO="p13780811-debug/GTH-tour-travels-booking";
const WORKFLOW=REPO+"/.github/workflows/gth-guide-media-review.yml@refs/heads/main";
const AUD="gth-guide-media:dqprqjmhxjnrllczqyhz";
const ORIGIN="https://dqprqjmhxjnrllczqyhz.supabase.co";
const JWKS=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
 {timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000});
const H={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const SLUGS=new Set(["india","france","australia","dubai","paris","mumbai","goa","paris/eiffel-tower-nearby-things-to-do"]);
const LICENSE=new Set(["CC BY 4.0","CC BY-SA 4.0","CC0 1.0","Public domain"]);
const FIELDS=new Set(["guide_slug","image_url","source_page","source_name","license_type","license_url",
 "attribution_text","alt_text","width","height","is_hero","priority","editorial_approved","rights_reviewed_at","review_note"]);
function safeUrl(v:unknown,host:string,path:string){
 if(typeof v!=="string"||v.length>1800)return false;
 try{const u=new URL(v);return u.protocol==="https:"&&u.hostname===host&&
  u.pathname.startsWith(path)&&!u.username&&!u.password&&!u.port;}
 catch{return false;}
}
function item(v:unknown){
 if(!v||typeof v!=="object"||Array.isArray(v))throw Error("Invalid media candidate");
 const r=v as Record<string,unknown>;
 if(Object.keys(r).some(k=>!FIELDS.has(k))||!SLUGS.has(String(r.guide_slug))||
  !safeUrl(r.image_url,"upload.wikimedia.org","/wikipedia/commons/")||
  !safeUrl(r.source_page,"commons.wikimedia.org","/wiki/File:")||
  r.source_name!=="Wikimedia Commons"||!LICENSE.has(String(r.license_type))||
  !["creativecommons.org","www.creativecommons.org","commons.wikimedia.org"].some(h=>safeUrl(r.license_url,h,"/"))||
  typeof r.attribution_text!=="string"||r.attribution_text.length<3||r.attribution_text.length>400||
  typeof r.alt_text!=="string"||r.alt_text.length<8||r.alt_text.length>180||
  /[<>\u0000-\u001f]/.test(r.attribution_text)||/[<>\u0000-\u001f]/.test(r.alt_text)||
  !Number.isInteger(r.width)||Number(r.width)<800||Number(r.width)>30000||
  !Number.isInteger(r.height)||Number(r.height)<500||Number(r.height)>30000||
  r.is_hero!==false||r.priority!==0||r.editorial_approved!==false||r.rights_reviewed_at!==null||
  typeof r.review_note!=="string"||r.review_note.length>300)
  throw Error("Unsafe, undocumented or autoapproved media candidate");
 const {guide_slug,image_url,source_page,source_name,license_type,license_url,attribution_text,alt_text,width,height}=r;
 return {guide_slug,image_url,source_page,source_name,license_type,license_url,
  attribution_text,alt_text,width,height,is_hero:false,priority:0,editorial_approved:false,rights_reviewed_at:null};
}
async function authorized(request:Request){
 const header=request.headers.get("authorization")||"";
 if(!header.startsWith("Bearer ")||header.length>6000)throw Error("Missing GitHub bearer");
 const {payload,protectedHeader}=await jwtVerify(header.slice(7),JWKS,{
  issuer:"https://token.actions.githubusercontent.com",audience:AUD,algorithms:["RS256"],clockTolerance:"5s"});
 if(protectedHeader.alg!=="RS256"||payload.repository!==REPO||
  String(payload.repository_id)!=="1169920747"||payload.ref!=="refs/heads/main"||
  payload.workflow_ref!==WORKFLOW||payload.sub!=="repo:"+REPO+":ref:refs/heads/main"||
  !["push","schedule","workflow_dispatch"].includes(String(payload.event_name)))
  throw Error("Unexpected OIDC identity");
}
Deno.serve(async request=>{
 if(request.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:H});
 try{await authorized(request);}catch{return Response.json({error:"Unauthorized"},{status:401,headers:H});}
 try{
  const raw=await request.text();if(raw.length>90000)throw Error("Batch too big");
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Invalid batch");
  const body=parsed as Record<string,unknown>;
  if(Object.keys(body).length!==1||!Array.isArray(body.rows)||body.rows.length<1||body.rows.length>24)throw Error("Invalid batch");
  const rows=body.rows.map(item);
  if(new Set(rows.map(r=>r.guide_slug+"|"+r.image_url)).size!==rows.length)throw Error("Duplicate candidate");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!key||Deno.env.get("SUPABASE_URL")!==ORIGIN)return Response.json({error:"Backend unavailable"},{status:503,headers:H});
  const stored=await fetch(ORIGIN+"/rest/v1/gth_travel_guide_media?on_conflict=guide_slug,image_url",{
   method:"POST",headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"resolution=ignore-duplicates,return=minimal"},
   body:JSON.stringify(rows),signal:AbortSignal.timeout(20000)});
  if(!stored.ok)return Response.json({error:"Media intake unavailable"},{status:502,headers:H});
  return Response.json({queued:rows.length,auto_published:0,rights_review_required:true},{headers:H});
 }catch{return Response.json({error:"Unsafe media candidate rejected"},{status:400,headers:H});}
});
