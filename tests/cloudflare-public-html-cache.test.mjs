import test from "node:test";
import assert from "node:assert/strict";
import {htmlCacheEntry,staticHtmlTTL,catalogueHTMLTTL,publicHtmlResponse} from "../scripts/cloudflare-public-html-cache.mjs";

const env={GTH_CLOUDFLARE_INGRESS:"1",VERCEL_ENV:"production",GTH_PUBLIC_LAUNCH_ENABLED:"true"};
const version="build_test_01";
const req=(path,init)=>new Request("https://www.gthproglobal.com"+path,init);
const html=(body="",headers={},status=200)=>new Response("<!DOCTYPE html><html><body>"+body+"</body></html>",{status,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store",...headers}});
const ready='<section data-gth-public-supplier-ready="1">Products</section><div data-gth-public-directory-ready="1">Directory</div>';
function memory(){
 const entries=new Map(),tasks=[];
 return {entries,tasks,cache:{async match(key){return entries.get(key.url)?.clone();},async put(key,value){entries.set(key.url,value.clone());}},ctx:{waitUntil(p){tasks.push(p);}}};
}
test("only canonical anonymous GET HTML routes are eligible; preview, private and RSC bypass",()=>{
 for(const path of ["/","/hotels","/real-estate","/tours","/activities","/tender"])assert.ok(htmlCacheEntry(req(path),env,version));
 for(const path of ["/hotels?city=Kolkata","/tender?country=IN","/real-estate/workspace","/api/hotels/discovery","/go/transport","/admin","/tours/1"])assert.equal(htmlCacheEntry(req(path),env,version),null);
 for(const name of ["Cookie","Authorization","RSC","Range","Next-Router-Prefetch","CF-Access-JWT-Assertion","If-None-Match"])assert.equal(htmlCacheEntry(req("/hotels",{headers:{[name]:"test"}}),env,version),null);
 assert.equal(htmlCacheEntry(req("/hotels",{method:"POST"}),env,version),null);
 assert.equal(htmlCacheEntry(req("/hotels",{headers:{Accept:"application/json"}}),env,version),null);
 assert.equal(htmlCacheEntry(req("/hotels",{headers:{"Cache-Control":"no-cache"}}),env,version),null);
 assert.equal(htmlCacheEntry(req("/hotels"),{...env,VERCEL_ENV:"preview"},version),null);
 assert.equal(htmlCacheEntry(req("/hotels"),{...env,GTH_PUBLIC_LAUNCH_ENABLED:"false"},version),null);
 assert.equal(htmlCacheEntry(req("/hotels"),env,""),null);
 assert.notEqual(htmlCacheEntry(req("/hotels"),env,version).key.url,htmlCacheEntry(req("/hotels"),env,"build_02").key.url);
});
test("static public HTML TTL is bounded, refuses unverified private or cookie responses",()=>{
 const entry=htmlCacheEntry(req("/hotels"),env,version);
 assert.equal(staticHtmlTTL(html("",{"X-GTH-Static-Shell":"build","X-GTH-Shell-Expires":"never"}),entry),900);
 assert.equal(staticHtmlTTL(html("",{"Cache-Control":"public, s-maxage=120"}),entry),120);
 assert.equal(staticHtmlTTL(html(),entry),0);
 assert.equal(staticHtmlTTL(html("",{"Cache-Control":"private, s-maxage=900"}),entry),0);
 assert.equal(staticHtmlTTL(html("",{"X-GTH-Static-Shell":"build","X-GTH-Shell-Expires":String(Date.now()-1)}),entry),0);
 assert.equal(staticHtmlTTL(html("",{"Cache-Control":"public, s-maxage=900","Set-Cookie":"session=private"}),entry),0);
 assert.equal(staticHtmlTTL(html("",{"Cache-Control":"public, s-maxage=900","Vary":"Accept-Language"}),entry),0);
 assert.equal(staticHtmlTTL(html("",{"Cache-Control":"public, s-maxage=900"},503),entry),0);
});
test("catalogue requires explicit source-ready markers, complete HTML and unexpired tender deadlines",()=>{
 const wrap=s=>"<!DOCTYPE html><html><body>"+s+"</body></html>";
 assert.equal(catalogueHTMLTTL(wrap(ready),"/tours"),120);
 assert.equal(catalogueHTMLTTL(wrap(ready),"/activities"),120);
 assert.equal(catalogueHTMLTTL(wrap('<section data-gth-public-supplier-ready="1"/>'),"/tours"),0);
 assert.equal(catalogueHTMLTTL(wrap(ready+'<template data-dgst="error"/>'),"/tours"),0);
 assert.equal(catalogueHTMLTTL("<!DOCTYPE html><html>"+ready,"/tours"),0);
 const now=1795810000000;
 assert.equal(catalogueHTMLTTL(wrap('<main data-gth-public-tender-until="'+(now+30000)+'"></main>'),"/tender",now),29);
 assert.equal(catalogueHTMLTTL(wrap('<main data-gth-public-tender-until="'+(now-1)+'"></main>'),"/tender",now),0);
});
test("anonymous shell emits edge-only TTL; repeated hit avoids render; cookies bypass",async()=>{
 const m=memory();let calls=0;
 const render=()=>{calls++;return html("public",{"X-GTH-Static-Shell":"build","X-GTH-Shell-Expires":"never"})};
 const first=await publicHtmlResponse(req("/hotels"),env,m.ctx,version,render,m.cache);
 assert.equal(first.headers.get("CDN-Cache-Control"),"public, s-maxage=900");
 assert.equal(first.headers.get("X-GTH-HTML-Cache"),"MISS");
 await Promise.all(m.tasks);
 const second=await publicHtmlResponse(req("/hotels"),env,m.ctx,version,render,m.cache);
 assert.equal(second.headers.get("X-GTH-HTML-Cache"),"HIT");assert.equal(calls,1);
 await publicHtmlResponse(req("/hotels",{headers:{Cookie:"private=1"}}),env,m.ctx,version,render,m.cache);
 assert.equal(calls,2);
});
test("catalogue validates full stream before reuse; errors or private responses do not populate cache",async()=>{
 const m=memory();let calls=0;
 const render=()=>{calls++;return html(ready)};
 const first=await publicHtmlResponse(req("/tours"),env,m.ctx,version,render,m.cache);
 assert.equal(first.headers.get("Cache-Control"),"private, no-store");
 await Promise.all(m.tasks);
 const second=await publicHtmlResponse(req("/tours"),env,m.ctx,version,render,m.cache);
 assert.equal(second.headers.get("X-GTH-HTML-Cache"),"HIT");assert.equal(calls,1);
 await publicHtmlResponse(req("/activities"),env,m.ctx,version,()=>html("unavailable"),m.cache);
 await Promise.all(m.tasks);
 assert.equal(m.entries.size,1);
 await publicHtmlResponse(req("/activities"),env,m.ctx,version,()=>html(ready,{"Set-Cookie":"private=1"}),m.cache);
 await Promise.all(m.tasks);assert.equal(m.entries.size,1);
});
test("tender variants isolate trusted country and language, never advertise shared CDN caching",async()=>{
 const m=memory();
 const variant=(country,lang)=>{const r=req("/tender",{headers:{"Accept-Language":lang,"x-vercel-ip-country":"GB"}});Object.defineProperty(r,"cf",{value:{country}});return r;};
 const indian=variant("IN","en-IN"),japanese=variant("JP","ja");
 const a=htmlCacheEntry(indian,env,version),b=htmlCacheEntry(japanese,env,version);
 assert.notEqual(a.key.url,b.key.url);assert.equal(a.request.headers.get("x-vercel-ip-country"),"IN");
 assert.equal(htmlCacheEntry(req("/tender",{headers:{"x-vercel-ip-country":"GB"}}),env,version).request.headers.has("x-vercel-ip-country"),false);
 let calls=0;const render=()=>{calls++;return html('<main data-gth-public-tender-until="'+(Date.now()+60000)+'"></main>')};
 await publicHtmlResponse(indian,env,m.ctx,version,render,m.cache);await Promise.all(m.tasks);
 const hit=await publicHtmlResponse(indian,env,m.ctx,version,render,m.cache);
 assert.equal(hit.headers.get("X-GTH-HTML-Cache"),"HIT");assert.equal(hit.headers.get("CDN-Cache-Control"),"no-store");assert.equal(hit.headers.get("Cache-Control"),"private, no-store");
 await publicHtmlResponse(japanese,env,m.ctx,version,render,m.cache);assert.equal(calls,2);
});
