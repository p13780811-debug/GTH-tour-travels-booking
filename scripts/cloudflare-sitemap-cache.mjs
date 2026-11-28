// Public sitemap caching only; never cache authenticated, personalized,
// booking, RSC, error or private responses. No paid binding required.
const BLOCKED=["authorization","cookie","range","rsc","next-router-state-tree","next-router-prefetch","next-router-segment-prefetch","next-action","x-middleware-prefetch"];
export function sitemapCacheKey(request,env){
 if(env.GTH_CLOUDFLARE_INGRESS!=="1"||env.VERCEL_ENV!=="production"||env.GTH_PUBLIC_LAUNCH_ENABLED!=="true"||request.method!=="GET")return null;
 const u=new URL(request.url);
 if(u.origin!=="https://www.gthproglobal.com"||u.search||BLOCKED.some(h=>request.headers.has(h)))return null;
 const path=u.pathname;
 if(!["/sitemap.xml","/sitemap-index.xml","/attractions/sitemap.xml"].includes(path)&&!/^\/seo-sitemaps\/[a-z0-9-]{1,40}\/[0-9]{1,6}\.xml$/.test(path)&&!/^\/attractions\/sitemaps\/[a-zA-Z-]{2,40}\/[0-9]{1,6}\.xml$/.test(path))return null;
 u.pathname="/__gth_sitemap_cache_v1"+path;
 return new Request(u);
}
export function sitemapTTL(response){
 if(response.status!==200||!response.body||response.headers.has("set-cookie")||! /^(?:application|text)\/xml(?:;|$)/i.test(response.headers.get("content-type")||""))return 0;
 const cc=response.headers.get("cache-control")||"";
 if(/(?:^|,)\s*(?:private|no-store|no-cache)(?:\s*(?:,|=|$))/i.test(cc))return 0;
 if((response.headers.get("vary")||"").split(",").some(x=>x.trim()&&!/^accept-encoding$/i.test(x.trim())))return 0;
 const match=cc.match(/(?:^|,)\s*s-maxage=(\d+)\s*(?:,|$)/i);
 return match?Math.min(3600,Number(match[1])):0;
}
export async function publicSitemapResponse(request,env,ctx,render,cache=globalThis.caches?.default){
 const key=sitemapCacheKey(request,env);
 if(!key||!cache)return render();
 try{
  const hit=await cache.match(key);
  if(hit&&sitemapTTL(hit)>0){const headers=new Headers(hit.headers);headers.set("X-GTH-Sitemap-Cache","HIT");return new Response(hit.body,{status:200,headers});}
 }catch{/* Cache availability must not prevent crawling. */}
 const response=await render();
 const ttl=sitemapTTL(response);
 if(ttl>0){
  try{
   const headers=new Headers(response.headers);
   headers.set("Cache-Control","public, max-age=0, s-maxage="+ttl);
   const copy=new Response(response.clone().body,{status:200,headers});
   ctx.waitUntil(cache.put(key,copy).catch(()=>{}));
  }catch{/* Preserve the original successful response. */}
 }
 return response;
}
