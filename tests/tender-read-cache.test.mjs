import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const ID="edb636b8-1c11-4e70-b0aa-ff38d965c777";
function fixture(){
 let tick=Date.now(),unavailable=false,budgetDenied=false,stale=false;const counts={search:0,detail:0,batch:0,stats:0,budget:0},options=[];
 const record={id:ID,deadline_at:new Date(tick+10000).toISOString(),title:"Original public notice"};
 const clock=class extends Date{static now(){return tick;}};
 const parser=loadTenderTs("src/lib/tender/catalog.ts",{"@supabase/supabase-js":{createClient:()=>{throw Error("No actual DB in unit fixture");}}});
 const success=()=>unavailable?{ok:false,status:503,error:"private provider detail"}:{ok:true,items:[{...record}],total:1,page:1,size:12};
 const raw={...parser,searchPublicTenders:async()=>{counts.search++;return success();},getPublicTender:async()=>{counts.detail++;return unavailable?success():{ok:true,item:{...record}};},getPublicTenderBatch:async()=>{counts.batch++;return success();},getTenderDiscoveryStats:async()=>{counts.stats++;return unavailable?null:{sectors:{works:1,goods:0,services:0,consultancy:0,other:0},closingSoon7:1,latestImportedAt:null};}};
 const next={unstable_cache(fn,key,opts){options.push(opts);const entries=new Map();return async(...args)=>{const key=JSON.stringify(args),entry=entries.get(key);if(entry&&(stale||tick-entry.time<opts.revalidate*1000))return entry.value;const value=await fn(...args);entries.set(key,{value,time:tick});return value;};}};
 const api=loadTenderTs("src/lib/tender/public-reader.ts",{"server-only":{},"next/cache":next,"./catalog":raw,"./read-budget":{reserveTenderRefresh:async()=>{counts.budget++;if(budgetDenied)throw {status:429};}}},{Date:clock});
 return {api,counts,options,record,advance:ms=>tick+=ms,fail:v=>unavailable=v,deny:v=>budgetDenied=v,serveStale:v=>stale=v};
}
const filters={q:"",country:"IN",sector:"",scope:"local",nearby:["NP","BD"],page:1};
test("warm public visits share normalized country/filter cache and do not spend new DB refresh budget",async()=>{
 const h=fixture();for(let i=0;i<100;i++)await h.api.searchCachedPublicTenders({...filters,q:i%2?" Road  Works ":"road works",nearby:i%2?["BD","NP","NP"]:["NP","BD"]});
 assert.equal(h.counts.search,1);assert.equal(h.counts.budget,1);
 await h.api.searchCachedPublicTenders({...filters,country:"GB"});assert.equal(h.counts.search,2,"geographic scopes must never share data");
 h.advance(60001);await h.api.searchCachedPublicTenders({...filters,q:"road works"});assert.equal(h.counts.search,3);
});
test("expired notices disappear even inside the short cache window; stats share only identical geographic scope",async()=>{
 const h=fixture();assert.ok((await h.api.getCachedPublicTender(ID)).item);h.advance(11000);assert.equal((await h.api.getCachedPublicTender(ID)).item,null);assert.equal(h.counts.detail,1);
 await h.api.getCachedTenderStats(filters);await h.api.getCachedTenderStats({...filters,q:"different",page:2,sector:"goods"});assert.equal(h.counts.stats,1);
 assert.ok(h.options.some(o=>o.revalidate===60));assert.ok(h.options.some(o=>o.revalidate===300));
});
test("shortlists use one sorted bounded batch, rejecting oversized, duplicate and malformed ID sets before reads",async()=>{
 const h=fixture(),second="edb636b8-1c11-4e70-b0aa-ff38d965c778";
 await h.api.getCachedTenderBatch([ID,second]);await h.api.getCachedTenderBatch([second,ID]);assert.equal(h.counts.batch,1);
 for(const ids of [[],[ID,ID],["unsafe"],Array.from({length:41},(_,i)=>ID.slice(0,-2)+String(i).padStart(2,"0"))])assert.equal((await h.api.getCachedTenderBatch(ids)).ok,false);
 assert.equal(h.counts.batch,1);
});
test("provider and budget failures remain explicit, are not cached as empty and do not leak diagnostics",async()=>{
 const h=fixture();h.fail(true);const response=await h.api.searchCachedPublicTenders(filters);assert.equal(response.ok,false);assert.doesNotMatch(JSON.stringify(response),/private provider/);
 h.fail(false);assert.equal((await h.api.searchCachedPublicTenders(filters)).ok,true);assert.equal(h.counts.search,2);
 const capped=fixture();capped.deny(true);assert.equal((await capped.api.searchCachedPublicTenders(filters)).status,429);assert.equal(capped.counts.search,0);
 const noCountry=fixture();await noCountry.api.searchCachedPublicTenders({...filters,country:""});assert.equal(noCountry.counts.budget,0);
});
test("CDN caching requires explicit country and language, and cannot extend a notice beyond its deadline",()=>{
 const h=fixture();assert.match(h.api.tenderResponseHeaders(new URLSearchParams("scope=world"),[])["Cache-Control"],/private, no-store/);
 assert.match(h.api.tenderResponseHeaders(new URLSearchParams("country=IN&lang=unsupported"),[])["Cache-Control"],/private/);
 assert.match(h.api.tenderResponseHeaders(new URLSearchParams("country=IN"),[])["Cache-Control"],/private/);
 assert.match(h.api.tenderResponseHeaders(new URLSearchParams("country=IN&lang=en"),[new Date(Date.now()+5000).toISOString()])["Cache-Control"],/s-maxage=[0-4],/);
});

test("simultaneous cold visitors share one fill; an over-age persisted snapshot refreshes instead of failing the first visitor",async()=>{
 const h=fixture();await Promise.all(Array.from({length:50},()=>h.api.searchCachedPublicTenders(filters)));assert.equal(h.counts.search,1);assert.equal(h.counts.budget,1);
 h.serveStale(true);h.advance(6*60000);h.record.deadline_at=new Date(Date.now()+86400000).toISOString();h.record.title="Fresh notice after a quiet period";
 const next=await h.api.searchCachedPublicTenders(filters);assert.equal(next.ok,true);assert.equal(next.items[0].title,h.record.title);assert.equal(h.counts.search,2);
 const invalid=fixture();assert.equal((await invalid.api.searchCachedPublicTenders({...filters,q:"㍍".repeat(40)})).status,400);assert.equal(invalid.counts.search,0);
});
