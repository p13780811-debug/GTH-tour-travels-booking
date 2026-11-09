import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const localization=loadTenderTs("src/lib/tender/localization.ts",{"server-only":{},"next/headers":{headers:async()=>new Headers()}});
const geography=loadTenderTs("src/lib/travel/hotel-audience.ts",{"server-only":{},"@/lib/tender/localization":localization});
const bounds=loadTenderTs("src/lib/travel/hotel-geo-bounds.ts");
const request=(query="",headers={})=>new Request("http://127.0.0.1/api/hotels/discovery"+query,{headers});
const ip={"x-vercel-ip-country":"IN","x-vercel-ip-city":"Mumbai","x-vercel-ip-latitude":"19.01","x-vercel-ip-longitude":"72.8"};
const profile=(id,country="IN",city="Mumbai",latitude=19.01)=>({id,name:"Fixture hotel "+id,country,city,address:"Fixture street",main_photo:"https://photos.example.com/property.jpg",stars:3,latitude,longitude:72.8});
function service({key="fixture-key",fetcher,budget=async()=>{}}={}){
 const calls=[],cache=new Map();
 const api=loadTenderTs("src/lib/travel/nuitee-free-hotels.ts",{
  "server-only":{},"./hotel-geo-bounds":bounds,"./nuitee-read-budget":{reserveNuiteeRefresh:budget},
  "next/cache":{unstable_cache:(fn,keys,options)=>{assert.equal(options.revalidate,86400);return ()=>{const key=JSON.stringify(keys);if(!cache.has(key))cache.set(key,fn().catch(error=>{cache.delete(key);throw error;}));return cache.get(key);};}},
 },{process:{env:{NUITEE_PRODUCTION_API_KEY:key}},fetch:async(url,options)=>{calls.push({url:new URL(url),options});return fetcher?fetcher(url,options):new Response(JSON.stringify({data:[profile("lp12345")]}));}});
 return {api,calls};
}
test("Geo-IP uses trusted country/city headers and a manual country override excludes inferred city/coordinates",()=>{
 const auto=geography.resolveHotelAudience(request("",ip));assert.equal(auto.country,"IN");assert.equal(auto.city,"Mumbai");assert.equal(auto.explicit,false);
 const manual=geography.resolveHotelAudience(request("?country=GB",ip));assert.equal(manual.country,"GB");assert.equal(manual.city,"");assert.equal(manual.point,null);
 assert.equal(geography.resolveHotelAudience(request("",{"x-country":"IN","x-city":"Mumbai"})).country,"");
 for(const query of ["?country=ZZ","?country=IN&country=GB","?city=Mumbai","?country=IN&page=101","?country=IN&path=places","?country=IN&city=%3Cscript%3E"])
   assert.throws(()=>geography.resolveHotelAudience(request(query,ip)));
});
test("hotel content is bounded, country/city verified and has no cached rates, keys or invented stars",()=>{
 const {api}=service();const parsed=api.parseNuiteeHotels({data:[profile("lp12345"),profile("lp54321","GB"),{...profile("lp98765"),stars:10,price:1,apiKey:"private",main_photo:"javascript:bad"} ]},"IN");
 assert.equal(parsed.items.length,2);assert.equal(parsed.items[1].stars,null);assert.equal(parsed.items[1].image,null);
 assert.doesNotMatch(JSON.stringify(parsed),/private|apiKey|price|GB/);
 assert.equal(api.parseNuiteeHotels({data:[profile("lp12345","IN","Pune")]},"IN","Mumbai").items.length,0);
});
test("nearest profiles are ranked within the requested city sample, not by another visitor's location",()=>{
 const list=[{id:"far",latitude:20,longitude:72.8},{id:"near",latitude:19.01,longitude:72.8}];
 assert.equal(geography.nearestHotelProfiles(list,{lat:19.01,lon:72.8})[0].id,"near");
 assert.equal(geography.nearestHotelProfiles(list,{lat:20,lon:72.8})[0].id,"far");
});
test("warm/parallel profile reads coalesce, use only free GET content and keep scope keys separate",async()=>{
 let budget=0;const {api,calls}=service({budget:async()=>{budget++;}});
 await Promise.all(Array.from({length:40},()=>api.getFreeHotelProfiles("IN","Mumbai",1)));await api.getFreeHotelProfiles("IN","Mumbai",1);
 assert.equal(calls.length,1);assert.equal(budget,1);assert.equal(calls[0].url.pathname,"/v3.0/data/hotels");assert.equal(calls[0].url.searchParams.get("limit"),"24");
 assert.equal(calls[0].options.method,"GET");assert.equal(calls[0].options.redirect,"error");
 await api.getFreeHotelProfiles("IN","",2);assert.equal(calls[1].url.searchParams.get("offset"),"24");
 await assert.rejects(api.getFreeHotelProfiles("GB","London",1));assert.equal(calls.length,3);
});
test("missing production key or exhausted refresh budget never calls a supplier endpoint",async()=>{
 const missing=service({key:""});await assert.rejects(missing.api.getFreeHotelProfiles("IN","Mumbai",1));assert.equal(missing.calls.length,0);
 const denied=service({budget:async()=>{throw Error("Denied");}});await assert.rejects(denied.api.getFreeHotelProfiles("IN","Mumbai",1));assert.equal(denied.calls.length,0);
});
test("inferred responses are private; explicit-country responses ignore viewer geo; city failure falls back to country",async()=>{
 const GET=loadTenderTs("src/app/api/hotels/discovery/route.ts",{
  "next/server":{NextResponse:{json:(value,init)=>Response.json(value,init)}},
  "@/lib/travel/hotel-audience":geography,
  "@/lib/travel/nuitee-free-hotels":{getFreeHotelProfiles:async(country,city)=>{if(city)throw Error("City unavailable");return {items:[{id:"lp12345",country,city:"Country preview"}],hasMore:true};}},
 }).GET;
 const auto=await GET(request("",ip));assert.equal(auto.headers.get("cache-control"),"private, no-store");const a=await auto.json();assert.equal(a.scope.country,"IN");assert.equal(a.items.length,1);assert.equal(a.scope.point,undefined);
 const selected=await GET(request("?country=GB",ip));assert.match(selected.headers.get("cache-control"),/public/);assert.equal((await selected.json()).items[0].country,"GB");
 const partial=await GET(request("?country=IN&city=Mumbai",ip));assert.match(partial.headers.get("cache-control"),/private, no-store/);assert.equal((await partial.json()).partial,true);
});
