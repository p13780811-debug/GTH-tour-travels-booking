// Cloudflare's included regional Cache API. No Redis commands, storage product,
// or paid binding. Only fixed anonymous public read endpoints are eligible.
type CachePolicy={ttl:number;clientControl:string};
const policies:Record<string,CachePolicy>={
 "/api/mobility/cities":{ttl:300,clientControl:"public, s-maxage=300, stale-while-revalidate=60"},
 "/api/mobility/traffic":{ttl:15,clientControl:"public, max-age=0, s-maxage=25"},
 "/api/real-estate/registry-preview":{ttl:30,clientControl:"no-store"},
 "/api/stadiums/concierge":{ttl:300,clientControl:"public, s-maxage=3600"},
};
type CacheStore=Pick<Cache,"match"|"put"|"delete">;
function regionalCache():CacheStore|undefined{
 if(process.env.GTH_CLOUDFLARE_INGRESS!=="1")return undefined;
 return (globalThis as typeof globalThis & {caches?:CacheStorage & {default?:CacheStore}}).caches?.default;
}
export function publicReadCacheKey(req:Request):{key:Request;policy:CachePolicy}|null{
 if(req.method!=="GET"||req.headers.has("authorization")||req.headers.has("cookie")||
 req.headers.has("range")||req.headers.has("rsc")||req.headers.has("x-middleware-prefetch"))return null;
 const url=new URL(req.url);
 const policy=Object.prototype.hasOwnProperty.call(policies,url.pathname)?policies[url.pathname]:undefined;
 if(!policy||url.search.length>600)return null;
 const field=url.pathname.endsWith("/traffic")?"city":url.pathname.endsWith("/concierge")?"venue":"q";
 if([...url.searchParams.keys()].some(k=>k!==field)||url.searchParams.getAll(field).length!==1)return null;
 const raw=url.searchParams.get(field)||"";
 let value=raw;
 if(field==="q"){
  value=raw.normalize("NFKC").trim().replace(/\s+/gu," ");
  if(value.length<2||value.length>70||!/^[\p{L}\p{M}\p{N} .&'’-]+$/u.test(value))return null;
  // City search normalizes to lowercase before querying. Preserve registry
  // case to avoid assumptions about the database collation.
  if(url.pathname==="/api/mobility/cities")value=value.toLocaleLowerCase("en");
 }else if(field==="city"){
  if(!/^(?:mumbai|kolkata|d:[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(value)||value.length>142)return null;
 }else if(!/^[a-z0-9-]{3,70}$/.test(value))return null;
 const key=new URL(url.origin);
 // A versioned, separate namespace prevents mixing with framework/CDN caches.
 key.pathname="/__gth_public_read_v1"+url.pathname;
 key.searchParams.set(field,value);
 return {key:new Request(key.toString()),policy};
}
export async function readPublicEdgeCache(req:Request):Promise<Response|null>{
 try{
  const cache=regionalCache(),entry=publicReadCacheKey(req);
  if(!cache||!entry)return null;
  const stored=await cache.match(entry.key);
  if(!stored)return null;
  const headers=new Headers(stored.headers);
  headers.set("Cache-Control",entry.policy.clientControl);
  headers.set("X-Content-Type-Options","nosniff");
  headers.set("X-GTH-Read-Cache","HIT");
  return new Response(stored.body,{status:200,headers});
 }catch{return null;}
}
/** Call only with a successful, anonymous, source-backed response after validation.
 * Payload expiry (if any) is a hard cap, never extended by a cache hit. */
export async function storePublicEdgeCache(req:Request,response:Response,expiresAt=Infinity):Promise<Response>{
 try{
  const cache=regionalCache(),entry=publicReadCacheKey(req);
  if(!cache||!entry||response.status!==200||response.headers.has("set-cookie"))return response;
  const ttl=Math.min(entry.policy.ttl,Math.floor((expiresAt-Date.now())/1000)-1);
  if(!Number.isFinite(ttl)||ttl<1)return response;
  const headers=new Headers({"Content-Type":"application/json","Cache-Control":"public, max-age="+ttl,"X-Content-Type-Options":"nosniff"});
  // Limit cached JSON and avoid accidentally persisting a large response.
  const body=await response.clone().text();
  if(body.length>128000)return response;
  await cache.put(entry.key,new Response(body,{status:200,headers}));
 }catch{/* Cache availability must not change application behavior. */}
 return response;
}
export async function invalidateTrafficEdgeCache(request:Request,city:string):Promise<void>{
 try{
  const url=new URL("/api/mobility/traffic",request.url);url.searchParams.set("city",city);
  const entry=publicReadCacheKey(new Request(url));
  if(entry)await regionalCache()?.delete(entry.key);
 }catch{/* Other regions expire within 15 seconds. */}
}
