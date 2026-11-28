import test from "node:test";
import assert from "node:assert/strict";
import {sitemapCacheKey,sitemapTTL,publicSitemapResponse} from "../scripts/cloudflare-sitemap-cache.mjs";
const env={GTH_CLOUDFLARE_INGRESS:"1",VERCEL_ENV:"production",GTH_PUBLIC_LAUNCH_ENABLED:"true"};
const req=(path,init)=>new Request("https://www.gthproglobal.com"+path,init);
const xml=(headers={},status=200)=>new Response('<?xml version="1.0"?><urlset/>',{status,headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, s-maxage=86400",...headers}});
test("canonical public sitemap requests only, no private, preview, query, or credential cache keys",()=>{
 for(const path of ["/sitemap.xml","/sitemap-index.xml","/attractions/sitemap.xml","/seo-sitemaps/destinations/0.xml","/attractions/sitemaps/in/1.xml"])
  assert.equal(new URL(sitemapCacheKey(req(path),env).url).pathname,"/__gth_sitemap_cache_v1"+path);
 for(const path of ["/api/hotels/discovery","/real-estate/workspace","/sitemap.xml?q=1","/attractions/sitemaps/in/9999999.xml","/go/transport"])
  assert.equal(sitemapCacheKey(req(path),env),null);
 for(const header of ["Cookie","Authorization","RSC","Range"])assert.equal(sitemapCacheKey(req("/sitemap.xml",{headers:{[header]:"test"}}),env),null);
 assert.equal(sitemapCacheKey(req("/sitemap.xml"),{...env,VERCEL_ENV:"preview"}),null);
 assert.equal(sitemapCacheKey(req("/sitemap.xml"),{...env,GTH_PUBLIC_LAUNCH_ENABLED:"false"}),null);
 assert.equal(sitemapCacheKey(req("/sitemap.xml",{method:"POST"}),env),null);
 assert.equal(sitemapCacheKey(new Request("https://gthproglobal.com/sitemap.xml"),env),null);
});
test("only successful explicitly cacheable XML, capped to one hour",()=>{
 assert.equal(sitemapTTL(xml()),3600);
 assert.equal(sitemapTTL(xml({"Cache-Control":"public, s-maxage=60"})),60);
 for(const response of [xml({},503),xml({"Set-Cookie":"x=y"}),xml({"Cache-Control":"private, s-maxage=100"}),xml({"Cache-Control":"no-store, s-maxage=100"}),xml({"Vary":"Cookie"}),xml({"Content-Type":"text/html"}),xml({"Cache-Control":"public"})])assert.equal(sitemapTTL(response),0);
});
test("repeated canonical sitemap reads hit cache; failures never replace valid XML",async()=>{
 const data=new Map(),tasks=[];
 const cache={async match(k){return data.get(k.url)?.clone()},async put(k,v){data.set(k.url,v.clone())}};
 const ctx={waitUntil(p){tasks.push(p)}};
 let renders=0;
 const render=()=>{renders++;return xml()};
 const request=req("/sitemap.xml");
 await publicSitemapResponse(request,env,ctx,render,cache);await Promise.all(tasks);
 const second=await publicSitemapResponse(request,env,ctx,render,cache);
 assert.equal(renders,1);assert.equal(second.headers.get("X-GTH-Sitemap-Cache"),"HIT");
 assert.match(await second.text(),/<urlset/);
 await publicSitemapResponse(req("/sitemap-index.xml"),env,ctx,()=>xml({},503),cache);
 assert.equal(data.size,1);
 await publicSitemapResponse(req("/sitemap.xml",{headers:{Cookie:"private=1"}}),env,ctx,render,cache);
 assert.equal(renders,2);
});
