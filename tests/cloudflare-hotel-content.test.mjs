import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs as load} from "./helpers/tender-upgrade-loader.mjs";
const bounds=load("src/lib/travel/hotel-geo-bounds.ts");
let now=Date.parse("2026-11-27T00:00:00Z");
class Clock extends Date{static now(){return now;}}
class Storage{
 constructor(){this.data=new Map();this.queue=Promise.resolve();this.alarm=null;}
 async get(k){return this.data.get(k);}
 async put(k,v){this.data.set(k,structuredClone(v));}
 async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])this.data.delete(k);}
 async transaction(fn){const result=this.queue.then(()=>fn(this));this.queue=result.catch(()=>{});return result;}
 async getAlarm(){return this.alarm;}
 async setAlarm(v){this.alarm=v;}
 async list({prefix,limit,startAfter}){return new Map([...this.data].filter(([k])=>k.startsWith(prefix)&&(!startAfter||k>startAfter)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit));}
}
const profile=(city,country,id)=>({id,name:"Fixture hotel "+id,city,country,main_photo:"https://images.example.com/hotel.jpg",stars:4});
function fixture({storage=new Storage(),runtime={VERCEL_ENV:"production",NUITEE_PRODUCTION_API_KEY:"fixture-only"},fail=false}={}){
 const calls=[];
 const core=load("src/lib/travel/nuitee-hotel-content-core.ts",{"./hotel-geo-bounds":bounds},{fetch:async(url,init)=>{const u=new URL(url);calls.push(u);assert.equal(u.pathname,"/v3.0/data/hotels");assert.equal(init.method,"GET");assert.equal(init.redirect,"error");assert.equal(init.headers["X-API-Key"],"fixture-only");if(fail)return new Response(null,{status:503});return Response.json({data:[profile(u.searchParams.get("cityName")||"Kolkata",u.searchParams.get("countryCode"),"lp12345")]});}});
 const {HotelContentCache}=load("scripts/cloudflare-hotel-content.mjs",{"cloudflare:workers":{DurableObject:class{}},"../src/lib/travel/nuitee-hotel-content-core.ts":core},{Date:Clock});
 return {object:new HotelContentCache({storage},runtime),calls,storage,core};
}
const req=(city="Kolkata",country="IN",page="1")=>new Request("https://hotel-content.internal/profiles?"+new URLSearchParams({country,city,page}));
test("concurrent reads and durable warm cache never burn additional supplier calls, including after eviction",async()=>{
 now=Date.parse("2026-11-27T00:00:00Z");
 const a=fixture();const results=await Promise.all(Array.from({length:40},()=>a.object.fetch(req())));
 assert.equal(a.calls.length,1);for(const res of results){assert.equal(res.status,200);const body=await res.json();assert.equal(body.items[0].city,"Kolkata");assert.equal(body.items[0].image,"https://images.example.com/hotel.jpg");assert.equal(body.stale,false);}
 const b=fixture({storage:a.storage});assert.equal((await b.object.fetch(req("kolkata"))).status,200);assert.equal(b.calls.length,0);
});
test("persistent shared guard rejects the eleventh cold scope within a minute, even after restart",async()=>{
 now=Date.parse("2026-11-27T01:00:00Z");const a=fixture();
 const responses=await Promise.all(Array.from({length:12},(_,i)=>a.object.fetch(req("City "+i))));
 assert.equal(responses.filter(r=>r.status===200).length,10);assert.equal(a.calls.length,10);
 const b=fixture({storage:a.storage});assert.equal((await b.object.fetch(req("Other city"))).status,503);assert.equal(b.calls.length,0);
 now+=60001;assert.equal((await b.object.fetch(req("Next city"))).status,200);assert.equal(b.calls.length,1);
});
test("daily budget remains persistent and stale real content survives denied refresh",async()=>{
 now=Date.parse("2026-11-27T02:00:00Z");const a=fixture();await a.object.fetch(req());now+=86400001;
 await a.storage.put("budget",{minute:1,minuteUntil:now+60000,day:200,dayUntil:now+86400000});
 const b=fixture({storage:a.storage});const res=await b.object.fetch(req());assert.equal(res.status,200);assert.equal((await res.json()).stale,true);assert.equal(b.calls.length,0);
 assert.equal((await b.object.fetch(req("Mumbai"))).status,503);
 now+=7*86400000;await b.object.alarm();assert.equal(await a.storage.get("profile:"+JSON.stringify(["IN","kolkata",1])),undefined);
});
test("invalid scopes, missing credentials and protected preview fail closed; no direct supplier calls",async()=>{
 now=Date.parse("2026-11-27T03:00:00Z");const a=fixture();
 for(const path of ["/places","/profiles?country=IN&city=Kolkata&page=1&placeId=x","/profiles?country=IN&city=Kolkata&page=101","/profiles?country=IN&country=US&page=1","/profiles?country=IN&city=%3Cscript%3E&page=1"])assert.equal((await a.object.fetch(new Request("https://hotel-content.internal"+path))).status,400);
 assert.equal(a.calls.length,0);
 for(const runtime of [{VERCEL_ENV:"production"},{VERCEL_ENV:"preview",NUITEE_PRODUCTION_API_KEY:"fixture-only"}]){const b=fixture({runtime});assert.equal((await b.object.fetch(req())).status,503);assert.equal(b.calls.length,0);}
});
test("Cloudflare Next reader shares the binding for destination cards and hotel feeds, never falls through to Redis",async()=>{
 const a=fixture();let guard=0;const binding={idFromName(n){assert.equal(n,"global-hotel-content-v1");return n;},get(){return a.object;}};
 function reader(env){return load("src/lib/travel/nuitee-free-hotels.ts",{"server-only":{},"next/cache":{unstable_cache(){throw Error("Must not use Next cache in Cloudflare");}},"./nuitee-read-budget":{reserveNuiteeRefresh:async()=>{guard++;}},"./nuitee-hotel-content-core":a.core},{process:{env:{GTH_CLOUDFLARE_INGRESS:"1"}},globalThis:{[Symbol.for("__cloudflare-context__")]:{env}}});}
 const api=reader({GTH_CLOUDFLARE_INGRESS:"1",GTH_HOTEL_CONTENT:binding});assert.equal((await api.getFreeHotelProfiles("IN","Kolkata",1)).items[0].id,"lp12345");
 await api.getFreeHotelProfiles("IN","Kolkata",1);assert.equal(a.calls.length,1);
 await assert.rejects(reader({GTH_CLOUDFLARE_INGRESS:"1"}).getFreeHotelProfiles("IN","Kolkata",1));assert.equal(guard,0);
});
