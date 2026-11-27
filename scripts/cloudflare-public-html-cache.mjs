// Reviewed anonymous HTML only. Regional Cache API, no paid resources.
// Never enable blanket HTML caching or override personalized Next responses.
const STATIC=new Set(["/","/hotels","/real-estate"]);
const TOURS=new Set(["/tours","/activities"]);
const BLOCKED=["authorization","cookie","range","rsc","next-router-state-tree","next-router-prefetch","next-router-segment-prefetch","next-action","x-middleware-prefetch","cf-access-jwt-assertion","if-none-match","if-modified-since","if-match","if-unmodified-since","if-range"];
const VARY=new Set(["accept-encoding","rsc","next-router-state-tree","next-router-prefetch","next-router-segment-prefetch"]);
const LIMIT=1_500_000;

export function htmlCacheEntry(request,env,version){
 if(env.GTH_CLOUDFLARE_INGRESS!=="1"||env.VERCEL_ENV!=="production"||env.GTH_PUBLIC_LAUNCH_ENABLED!=="true"||! /^[a-zA-Z0-9_-]{1,100}$/.test(version||"")||request.method!=="GET")return null;
 const url=new URL(request.url),path=url.pathname;
 if(url.origin!=="https://www.gthproglobal.com"||url.search||BLOCKED.some(h=>request.headers.has(h)))return null;
 const accept=request.headers.get("accept")||"*/*";
 if(!accept.includes("text/html")&&!accept.includes("*/*"))return null;
 if(/(?:no-cache|no-store|max-age=0)/i.test(request.headers.get("cache-control")||"")||/no-cache/i.test(request.headers.get("pragma")||""))return null;
 if(!STATIC.has(path)&&!TOURS.has(path)&&path!=="/tender")return null;
 const key=new URL(url.origin);
 key.pathname="/__gth_public_html_v2/"+version+path;
 if(path==="/tender"){
  // Server-side tender localization uses country and Accept-Language.
  // Use trusted Cloudflare country, never an arbitrary visitor geo header.
  const country=typeof request.cf?.country==="string"&&/^[A-Z]{2}$/.test(request.cf.country)?request.cf.country:"";
  const lang=request.headers.get("accept-language")||"";
  if(lang.length>128||!/^[a-zA-Z0-9,;= ._*-]*$/.test(lang))return null;
  const headers=new Headers(request.headers);
  headers.delete("x-vercel-ip-country");
  if(country)headers.set("x-vercel-ip-country",country);
  key.searchParams.set("country",country);
  key.searchParams.set("lang",lang);
  return {key:new Request(key),path,request:new Request(request,{headers}),localized:true};
 }
 return {key:new Request(key),path,request,localized:false};
}

function safeHtml(response){
 if(response.status!==200||!response.body||response.headers.has("set-cookie")||response.headers.has("www-authenticate")||response.headers.has("content-range")||!/^(?:text\/html)(?:;|$)/i.test(response.headers.get("content-type")||""))return false;
 if(/noindex|none/i.test(response.headers.get("x-robots-tag")||""))return false;
 if(response.headers.get("content-encoding")&&!/^identity$/i.test(response.headers.get("content-encoding")))return false;
 if(response.headers.get("content-security-policy")?.includes("'nonce-"))return false;
 return !(response.headers.get("vary")||"").split(",").some(x=>x.trim()&&!VARY.has(x.trim().toLowerCase())&&x.trim().toLowerCase()!=="accept-language");
}

export function staticHtmlTTL(response,entry){
 if(!STATIC.has(entry.path)||!safeHtml(response))return 0;
 if((response.headers.get("vary")||"").toLowerCase().includes("accept-language"))return 0;
 // Built shells have no personalized data and hard expiry from the build.
 if(response.headers.get("x-gth-static-shell")==="build"){
  const end=response.headers.get("x-gth-shell-expires");
  return end==="never"?900:Math.max(0,Math.min(900,Math.floor((Number(end)-Date.now())/1000)-1));
 }
 const cc=response.headers.get("cache-control")||"";
 if(/\b(?:private|no-store|no-cache)\b/i.test(cc))return 0;
 const m=cc.match(/(?:^|,)\s*s-maxage=(\d+)/i);
 return m?Math.min(900,Number(m[1])):0;
}

async function boundedHTML(response){
 if(Number(response.headers.get("content-length"))>LIMIT)return null;
 const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,html="";
 try{
  for(;;){
   const {done,value}=await reader.read();if(done)break;
   bytes+=value.byteLength;if(bytes>LIMIT){await reader.cancel();return null;}
   html+=decoder.decode(value,{stream:true});
  }
  return html+decoder.decode();
 }catch{return null;}finally{reader.releaseLock();}
}

export function catalogueHTMLTTL(html,path,now=Date.now()){
 if(typeof html!=="string"||!/^<!doctype html>/i.test(html)||!/<\/html>\s*$/i.test(html)||/NEXT_HTTP_ERROR_FALLBACK|BAILOUT_TO_CLIENT_SIDE_RENDERING|Application error: a server-side exception|data-dgst=|<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html))return 0;
 if(TOURS.has(path)){
  if(!html.includes('data-gth-public-supplier-ready="1"')||!html.includes('data-gth-public-directory-ready="1"'))return 0;
  return 120;
 }
 if(path==="/tender"){
  const m=html.match(/<main\b[^>]*\bdata-gth-public-tender-until="([0-9]{13})"/);
  return m?Math.max(0,Math.min(60,Math.floor((Number(m[1])-now)/1000)-1)):0;
 }
 return 0;
}

function outward(response,entry,ttl,hit){
 const headers=new Headers(response.headers);
 headers.delete("x-gth-html-cache-until");headers.delete("x-gth-shell-expires");
 headers.set("X-GTH-HTML-Cache",hit?"HIT":"MISS");
 // Tender is cached only under its internal country/language variant, not
 // advertised as a shared URL-cache response to browsers or external CDNs.
 headers.set("Cache-Control",entry.localized?"private, no-store":"public, max-age=0, must-revalidate");
 const edge=entry.localized?"no-store":"public, s-maxage="+ttl;
 headers.set("CDN-Cache-Control",edge);headers.set("Cloudflare-CDN-Cache-Control",edge);
 return new Response(response.body,{status:200,headers});
}

async function store(cache,entry,response,ttl){
 if(!Number.isFinite(ttl)||ttl<1)return;
 const h=new Headers(response.headers);
 h.delete("content-length");h.delete("etag");h.delete("content-encoding");
 h.delete("CDN-Cache-Control");h.delete("Cloudflare-CDN-Cache-Control");
 h.delete("vary");h.set("cache-control","public, max-age="+ttl);
 h.set("x-gth-html-cache-until",String(Date.now()+ttl*1000));
 await cache.put(entry.key,new Response(response.body,{status:200,headers:h}));
}

export async function publicHtmlResponse(request,env,ctx,version,render,cache=globalThis.caches?.default){
 const entry=htmlCacheEntry(request,env,version);
 if(!entry||!cache)return render(entry?.request??request);
 try{
  const hit=await cache.match(entry.key);
  const remaining=hit?Math.floor((Number(hit.headers.get("x-gth-html-cache-until"))-Date.now())/1000):0;
  if(hit&&safeHtml(hit)&&remaining>0)return outward(hit,entry,remaining,true);
 }catch{/* Cache failures never prevent original rendering. */}
 const response=await render(entry.request);
 if(!safeHtml(response))return response;
 const ttl=staticHtmlTTL(response,entry);
 if(ttl>0){
  try{ctx.waitUntil(store(cache,entry,response.clone(),ttl).catch(()=>{}));}catch{}
  return outward(response,entry,ttl,false);
 }
 if(STATIC.has(entry.path))return response;
 // Stream the original response immediately. Validate a bounded copy after
 // rendering; incomplete/degraded catalogues cannot populate shared cache.
 try{
  const copy=response.clone();
  ctx.waitUntil((async()=>{
   const html=await boundedHTML(copy),seconds=catalogueHTMLTTL(html,entry.path);
   if(seconds>0)await store(cache,entry,new Response(html,{status:200,headers:copy.headers}),seconds);
  })().catch(()=>{}));
 }catch{}
 return response;
}
