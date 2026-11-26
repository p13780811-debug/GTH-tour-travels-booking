import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const origin="https://preview.example.com";
const request=(path,init)=>new Request(origin+path,init);
const entries=new Map();
const storage={async match(key){return entries.get(key.url)?.clone()},async put(key,response){entries.set(key.url,response.clone())},async delete(key){return entries.delete(key.url)}};
const api=loadTenderTs("src/lib/security/public-edge-cache.ts",{},{
 process:{env:{GTH_CLOUDFLARE_INGRESS:"1"}},Headers,caches:{default:storage}
});
test("edge public cache keys isolate routes, host and exact allowed query",()=>{
 const a=api.publicReadCacheKey(request("/api/mobility/cities?q=Mumbai"));
 const b=api.publicReadCacheKey(request("/api/mobility/cities?q=mumbai"));
 assert.equal(a.key.url,b.key.url);
 assert.notEqual(a.key.url,api.publicReadCacheKey(request("/api/real-estate/registry-preview?q=Mumbai")).key.url);
 for(const r of [request("/api/mobility/cities?q=Mumbai&q=Delhi"),request("/api/mobility/cities?q=Mumbai&extra=1"),request("/api/mobility/cities?q=Mumbai",{headers:{Authorization:"Bearer token"}}),request("/api/mobility/cities?q=Mumbai",{headers:{Cookie:"session=abc"}}),request("/api/mobility/traffic?city=mumbai",{method:"POST"}),request("/api/tender/workspaces"),request("/api/hotels/booking?city=Mumbai")])assert.equal(api.publicReadCacheKey(r),null);
});
test("edge read cache rejects errors and cookies, preserves no-store and expires before notices",async()=>{
 entries.clear();
 const req=request("/api/real-estate/registry-preview?q=Mumbai");
 await api.storePublicEdgeCache(req,Response.json({error:"unavailable"},{status:503}));
 assert.equal(entries.size,0);
 await api.storePublicEdgeCache(req,Response.json({items:[]},{headers:{"Set-Cookie":"session=abc"}}));
 assert.equal(entries.size,0);
 await api.storePublicEdgeCache(req,Response.json({items:[]}),Date.now()+100);
 assert.equal(entries.size,0);
 const source=Response.json({items:[{title:"Public record"}]},{headers:{"Cache-Control":"no-store"}});
 await api.storePublicEdgeCache(req,source);
 assert.equal((await source.json()).items.length,1);
 const hit=await api.readPublicEdgeCache(req);
 assert.equal(hit.headers.get("Cache-Control"),"no-store");
 assert.equal(hit.headers.get("X-GTH-Read-Cache"),"HIT");
 assert.equal((await hit.json()).items[0].title,"Public record");
 const traffic=request("/api/mobility/traffic?city=mumbai");
 await api.storePublicEdgeCache(traffic,Response.json({zones:[],reports:[]}));
 assert.ok(await api.readPublicEdgeCache(traffic));
 await api.invalidateTrafficEdgeCache(request("/api/mobility/traffic",{method:"POST"}),"mumbai");
 assert.equal(await api.readPublicEdgeCache(traffic),null);
});
