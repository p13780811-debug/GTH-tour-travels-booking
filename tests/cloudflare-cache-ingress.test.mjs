import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

test("Worker binding enables native cache before process.env initialization without broadening eligibility",async()=>{
 const entries=new Map();
 const cache={async put(key,value){entries.set(key.url,value.clone());},async match(key){return entries.get(key.url)?.clone();},async delete(key){return entries.delete(key.url);}};
 const api=loadTenderTs("src/lib/security/public-edge-cache.ts",{}, {Headers,globalThis:{caches:{default:cache}},process:{env:{}}});
 const req=new Request("https://www.gthproglobal.com/api/mobility/cities?q=Mumbai");
 const result=()=>Response.json({cities:[{name:"Mumbai"}],degraded:false});
 await api.storePublicEdgeCache(req,result());
 assert.equal(entries.size,0);
 await api.storePublicEdgeCache(req,result(),Infinity,true);
 assert.equal(entries.size,1);
 assert.equal(await api.readPublicEdgeCache(req),null);
 const hit=await api.readPublicEdgeCache(req,true);
 assert.equal(hit.headers.get("X-GTH-Read-Cache"),"HIT");
 assert.equal((await hit.json()).cities[0].name,"Mumbai");
 for(const unsafe of [new Request(req,{headers:{Cookie:"session=private"}}),new Request(req,{headers:{Authorization:"Bearer private"}}),new Request(req,{method:"POST"}),new Request("https://www.gthproglobal.com/api/real-estate/workspace"),new Request(req.url+"&q=Delhi")]){
  assert.equal(await api.readPublicEdgeCache(unsafe,true),null);
  await api.storePublicEdgeCache(unsafe,result(),Infinity,true);
 }
 assert.equal(entries.size,1);
 const other=new Request("https://www.gthproglobal.com/api/mobility/cities?q=Kolkata");
 await api.storePublicEdgeCache(other,new Response(null,{status:503}),Infinity,true);
 await api.storePublicEdgeCache(other,Response.json({}, {headers:{"Set-Cookie":"session=private"}}),Infinity,true);
 await api.storePublicEdgeCache(other,result(),Date.now()-1,true);
 assert.equal(entries.size,1);
 assert.equal(await api.readPublicEdgeCache(other,true),null);
});
test("static shell allowlist and crawler rules keep private property workspace excluded",()=>{
 const shell=readFileSync("scripts/cloudflare-prepare-static-shells.mjs","utf8");
 const robots=readFileSync("src/app/robots.ts","utf8");
 assert.match(shell,/const exact=new Set\(\["\/","\/hotels","\/real-estate"/);
 assert.doesNotMatch(shell,/["']\/real-estate\/workspace["']/);
 assert.match(robots,/"\/real-estate\/workspace"/);
 assert.match(robots,/userAgent: "\*"/);
 assert.match(robots,/sitemap-index\.xml/);
});
