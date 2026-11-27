// Narrow anonymous world/explicit-country first-page fast path.
// Other filters and local searches retain the original Next API.
import {enforceRateLimit} from "../src/lib/security/rate-limit.ts";
import {validCountry,validLanguage,preferLanguage} from "../src/lib/tender/native-audience.ts";
const COLUMNS="id,title,buyer,country_code,region,sector,summary,deadline_at,published_at,estimated_value,currency,source_name,source_reference,source_url,eligibility_requirements,requirements_verified,notice_channel";
const PAGE_SIZE=12;
const BLOCKED=["authorization","cookie","range","rsc","next-router-state-tree","next-router-prefetch","next-router-segment-prefetch","next-action","x-middleware-prefetch"];
const ALLOWED=new Set(["scope","country","lang","page","sort"]);
let redisRetryAt=0;
let redisNamespace="";
const unavailable=()=>Response.json({error:"Tender catalog temporarily unavailable"},{status:503,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const denied=()=>Response.json({error:"Catalogue refresh is busy. Your saved references are safe; retry shortly."},{status:429,headers:{"Cache-Control":"no-store","Retry-After":"60","X-Content-Type-Options":"nosniff"}});
// Preview Access adds its own cookie even to public GETs. This exception
// grants no application authorization: only the same anonymous RLS read is
// allowed, never a cache lookup/write. The deployment gate independently
// verifies the existing Access policy and anonymous challenge.
function accessOnlyPreview(request,env){
 if(env?.VERCEL_ENV!=="preview"||env.GTH_CLOUDFLARE_INGRESS!=="1"||new URL(request.url).origin!=="https://gth-pro-preview-20261126.p13780811.workers.dev")return false;
 const assertion=request.headers.get("cf-access-jwt-assertion"),cookie=request.headers.get("cookie");
 if(!assertion||!cookie||assertion.length>8192||cookie.length>8192)return false;
 const parts=cookie.split(";").map(v=>v.trim()).filter(Boolean);
 return parts.length===1&&parts[0]==="CF_Authorization="+assertion;
}
export function nativeTenderInput(request,env){
 const previewNoCache=accessOnlyPreview(request,env);
 if(request.method!=="GET"||BLOCKED.some(h=>request.headers.has(h)&&!(h==="cookie"&&previewNoCache)))return null;
 if(request.headers.has("cf-access-jwt-assertion")&&!previewNoCache)return null;
 const url=new URL(request.url),p=url.searchParams;
 if(url.pathname!=="/api/tender"||url.hostname==="gthproglobal.com"||url.search.length>160||p.get("scope")!=="world")return null;
 for(const key of p.keys())if(!ALLOWED.has(key)||p.getAll(key).length!==1)return null;
 const raw=p.get("country")||"";
 if(!/^[A-Za-z]{2}$/.test(raw)||!validCountry(raw)||p.has("page")&&p.get("page")!=="1"||p.has("sort")&&p.get("sort")!=="deadline")return null;
 const country=validCountry(raw),explicit=p.get("lang");
 if(explicit!==null&&(!/^[a-z]{2}$/.test(explicit)||!validLanguage(explicit)))return null;
 const accept=request.headers.get("accept-language");
 if(accept&&accept.length>256)return null;
 const language=preferLanguage(accept,country,explicit);
 const key=new URL(url.origin);
 key.pathname="/__gth_native_tender_v1";
 key.searchParams.set("scope","world");key.searchParams.set("country",country);key.searchParams.set("lang",language);
 return {country,language,key:new Request(key),explicitLanguage:explicit!==null,previewNoCache};
}
// Same Redis scope, identity, limits and database fallback RPC as Next.
// Only this fixed quota RPC may use the private server-side role binding.
async function reserve(env){
 const namespace=(env.GTH_RATE_LIMIT_NAMESPACE||"gth-pro")+":"+(env.VERCEL_ENV||"production");
 if(namespace!==redisNamespace){redisNamespace=namespace;redisRetryAt=0;}
 if(Date.now()>=redisRetryAt){
  try{
   await enforceRateLimit(new Request("https://www.gthproglobal.com/api/tender"),"tender_reads","shared-public-catalogue",env);
   return 200;
  }catch(e){if(e?.status===429)return 429;if(e?.status!==503)return 503;redisRetryAt=Date.now()+60000;}
 }
 try{
  const base=new URL(env.NEXT_PUBLIC_SUPABASE_URL||""),key=env.SUPABASE_SERVICE_ROLE_KEY;
  const environment=env.VERCEL_ENV;
  if(base.protocol!=="https:"||!base.hostname.endsWith(".supabase.co")||base.username||base.password||base.port||base.search||base.hash||base.pathname!=="/"||typeof key!=="string"||!key||!["preview","production"].includes(environment))return 503;
  const headers={apikey:key,"Content-Type":"application/json",Accept:"application/json"};
  if(!key.startsWith("sb_secret_")){
   const parts=key.split(".");
   if(parts.length!==3||JSON.parse(atob(parts[1].replace(/-/g,"+").replace(/_/g,"/"))).role!=="service_role")return 503;
   headers.Authorization="Bearer "+key;
  }
  const response=await fetch(new URL("/rest/v1/rpc/tender_reserve_fallback_read",base),{method:"POST",headers,body:JSON.stringify({p_environment:environment}),redirect:"error",signal:AbortSignal.timeout(2500)});
  if(!response.ok)return 503;
  const allowed=await response.json();return allowed===true?200:allowed===false?429:503;
 }catch{return 503;}
}
function responseHeaders(input,ttl,hit){
 const headers={"Cache-Control":!input.previewNoCache&&input.explicitLanguage&&ttl>0?"public, max-age=0, s-maxage="+ttl+", must-revalidate":"private, no-store","X-GTH-Edge-Read":"native-tender","X-Content-Type-Options":"nosniff"};
 if(hit)headers["X-GTH-Read-Cache"]="HIT";
 if(!input.explicitLanguage)headers.Vary="Accept-Language";
 return headers;
}
export async function nativeTenderRead(request,env,db,{reserveRead=reserve,cache=globalThis.caches?.default}={}){
 const input=nativeTenderInput(request,env);
 if(!input||env.GTH_CLOUDFLARE_INGRESS!=="1")return null;
 if(input.previewNoCache)cache=null;
 try{
  const hit=await cache?.match(input.key);
  const ttl=hit?Math.floor((Number(hit.headers.get("X-GTH-Tender-Until"))-Date.now())/1000):0;
  if(hit&&hit.status===200&&ttl>0&&!hit.headers.has("set-cookie"))return new Response(hit.body,{status:200,headers:{"Content-Type":"application/json",...responseHeaders(input,ttl,true)}});
 }catch{/* Protected preview and cache failures use the real bounded read. */}
 try{
  const permit=await reserveRead(env);
  if(permit===429)return denied();if(permit!==200)return unavailable();
  const now=Date.now();
  const raw=await db("tenders",{select:COLUMNS,status:"eq.published",source_verified:"eq.true",is_public:"eq.true",deadline_at:"gt."+new Date(now).toISOString(),country_code:"eq."+input.country,order:"deadline_at.asc,id.asc",limit:String(PAGE_SIZE)},undefined,{exactCount:true});
  if(!raw.ok||Number(raw.headers.get("content-length"))>512000)return unavailable();
  const match=(raw.headers.get("content-range")||"").match(/^(?:[0-9]+-[0-9]+|\*)\/([0-9]+)$/);
  const total=match?Number(match[1]):NaN;
  const body=await raw.text();if(body.length>512000)return unavailable();
  const rows=JSON.parse(body);
  if(!Number.isSafeInteger(total)||total<0||!Array.isArray(rows)||rows.length>PAGE_SIZE||rows.length!==Math.min(total,PAGE_SIZE))return unavailable();
  if(rows.some(row=>!row||typeof row.id!=="string"||row.country_code!==input.country||!Number.isFinite(Date.parse(row.deadline_at))))return unavailable();
  const items=rows.filter(row=>Date.parse(row.deadline_at)>Date.now()).map(row=>Object.fromEntries(COLUMNS.split(",").filter(k=>Object.prototype.hasOwnProperty.call(row,k)).map(k=>[k,row[k]])));
  const data={items,total,page:1,pageSize:PAGE_SIZE,country:input.country,language:input.language,scope:"world",primaryCount:null,nearbyCount:null,countryRequired:false};
  const ttl=Math.max(0,Math.min(60,...rows.map(row=>Math.floor((Date.parse(row.deadline_at)-Date.now())/1000)-1)));
  const response=Response.json(data,{headers:responseHeaders(input,ttl,false)});
  if(cache&&ttl>0)try{
   const text=await response.clone().text();
   if(text.length<=128000)await cache.put(input.key,new Response(text,{headers:{"Content-Type":"application/json","Cache-Control":"public, max-age="+ttl,"X-GTH-Tender-Until":String(Date.now()+ttl*1000)}}));
  }catch{/* Do not turn a valid source response into a cache error. */}
  return response;
 }catch{return unavailable();}
}
