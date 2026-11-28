// OpenNext custom Worker: keep full framework fallback, bypass SSR only for
// reviewed anonymous read contracts and build-verified public page shells.
import handler from "../.open-next/worker.js";
export {HotelContentCache} from "./cloudflare-hotel-content.mjs";
export * from "../.open-next/worker.js";
import shells,{buildVersion} from "../.open-next/gth-shell-manifest.mjs";
import {serveStaticShell,publicSecurityHeaders,canonicalReadRedirect} from "./cloudflare-shell-routing.mjs";
import {publicHtmlResponse} from "./cloudflare-public-html-cache.mjs";
import {publicSitemapResponse} from "./cloudflare-sitemap-cache.mjs";
import {hotelGeoRequest} from "./cloudflare-hotel-geo.mjs";
import {nativePublicRead} from "./cloudflare-native-public-reads.mjs";
import {nativeTenderInput} from "./cloudflare-native-tender.mjs";
import {readPublicEdgeCache} from "../src/lib/security/public-edge-cache.ts";
export default {
 async fetch(request,env,ctx){
  const canonical=canonicalReadRedirect(request);
  if(canonical)return canonical;
  const render=async(request)=>{
  const url=new URL(request.url);
  if(url.hostname!=="gthproglobal.com"){
   const shell=await serveStaticShell(request,env.ASSETS,shells);
   if(shell)return shell;
   if(request.method==="GET"&&(url.pathname.startsWith("/api/mobility/")||url.pathname==="/api/real-estate/registry-preview"||url.pathname==="/api/stadiums/concierge"||url.pathname==="/api/tender")){
    const response=await readPublicEdgeCache(request,env.GTH_CLOUDFLARE_INGRESS==="1")??await nativePublicRead(request,env);
    if(response)return new Response(response.body,{status:response.status,headers:publicSecurityHeaders(response)});
   }
  }
  return handler.fetch(url.pathname==="/api/hotels/discovery"&&request.method==="GET"?hotelGeoRequest(request):request,env,ctx);
  };
  const response=await publicSitemapResponse(request,env,ctx,()=>publicHtmlResponse(request,env,ctx,buildVersion,render));
  // Protected preview only: report fixed eligibility flags, never credentials,
  // cookie values, user identity, request headers or private bindings.
  const auditUrl=new URL(request.url);
  if(auditUrl.hostname==="gth-pro-preview-20261126.p13780811.workers.dev"&&auditUrl.pathname==="/api/tender"&&request.method==="GET"){
   const headers=new Headers(response.headers);
   const flags=[
    env.GTH_CLOUDFLARE_INGRESS==="1"?"ingress=1":"ingress=0",
    nativeTenderInput(request,env)?"eligible=1":"eligible=0",
    request.headers.has("cookie")?"cookie=1":"cookie=0",
    request.headers.has("authorization")?"auth=1":"auth=0",
    request.headers.has("rsc")?"rsc=1":"rsc=0",
    request.headers.has("range")?"range=1":"range=0",
    request.headers.has("cf-access-jwt-assertion")?"access=1":"access=0",
   ];
   headers.set("X-GTH-Preview-Tender-Diagnostic",flags.join(";"));
   headers.set("Cache-Control","private, no-store");
   return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
  return response;
 }
};
