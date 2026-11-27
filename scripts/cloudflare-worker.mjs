// OpenNext custom Worker: keep full framework fallback, bypass SSR only for
// reviewed anonymous read contracts and build-verified public page shells.
import handler from "../.open-next/worker.js";
export {HotelContentCache} from "./cloudflare-hotel-content.mjs";
export * from "../.open-next/worker.js";
import shells from "../.open-next/gth-shell-manifest.mjs";
import {serveStaticShell,publicSecurityHeaders,canonicalReadRedirect} from "./cloudflare-shell-routing.mjs";
import {publicSitemapResponse} from "./cloudflare-sitemap-cache.mjs";
import {hotelGeoRequest} from "./cloudflare-hotel-geo.mjs";
import {nativePublicRead} from "./cloudflare-native-public-reads.mjs";
import {readPublicEdgeCache} from "../src/lib/security/public-edge-cache.ts";
export default {
 async fetch(request,env,ctx){
  const canonical=canonicalReadRedirect(request);
  if(canonical)return canonical;
  const url=new URL(request.url);
  if(url.hostname!=="gthproglobal.com"){
   const shell=await serveStaticShell(request,env.ASSETS,shells);
   if(shell)return shell;
   if(request.method==="GET"&&(url.pathname.startsWith("/api/mobility/")||url.pathname==="/api/real-estate/registry-preview"||url.pathname==="/api/stadiums/concierge")){
    const response=await readPublicEdgeCache(request,env.GTH_CLOUDFLARE_INGRESS==="1")??await nativePublicRead(request,env);
    if(response)return new Response(response.body,{status:response.status,headers:publicSecurityHeaders(response)});
   }
  }
  const render=()=>handler.fetch(url.pathname==="/api/hotels/discovery"&&request.method==="GET"?hotelGeoRequest(request):request,env,ctx);
  return publicSitemapResponse(request,env,ctx,render);
 }
};
