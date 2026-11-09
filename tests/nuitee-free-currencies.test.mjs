import test from "node:test";
import assert from "node:assert/strict";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";
const shared=loadTenderTs("src/lib/travel/hotel-currency.ts");
const rows=shared.HOTEL_CURRENCY_OPTIONS.map(item=>({code:item.code,currency:item.name,countries:[]}));
function setup({key="fixture-private-currency-key",fetcher}={}){
 const calls=[];const env={NUITEE_PRODUCTION_API_KEY:key};let cachePromise;
 const api=loadTenderTs("src/lib/travel/nuitee-free-currencies.ts",{
  "server-only":{},"./hotel-currency":shared,
  "./nuitee-read-budget":{reserveNuiteeRefresh:async()=>{}},
  "next/cache":{unstable_cache:(fn,keys,options)=>{assert.equal(options.revalidate,86400);return ()=>{if(!cachePromise)cachePromise=fn().catch(error=>{cachePromise=undefined;throw error;});return cachePromise;};}},
 },{process:{env},fetch:async(url,options)=>{calls.push({url,options});return fetcher?fetcher(url,options):new Response(JSON.stringify({data:rows}));}});
 return {api,calls};
}
test("missing API key retains nine usable currencies with zero upstream calls",async()=>{
 const {api,calls}=setup({key:""});const result=await api.getHotelCurrencyCatalog();
 assert.equal(result.source,"local");assert.equal(result.items.length,9);assert.equal(calls.length,0);
});
test("parallel and warm currency reads share the single fixed free GET request",async()=>{
 const {api,calls}=setup();const all=await Promise.all(Array.from({length:40},()=>api.getHotelCurrencyCatalog()));
 await api.getHotelCurrencyCatalog();assert.equal(calls.length,1);assert.ok(all.every(value=>value.source==="nuitee"));
 assert.equal(calls[0].url,"https://api.liteapi.travel/v3.0/data/currencies");
 assert.equal(calls[0].options.method,"GET");assert.equal(calls[0].options.redirect,"error");assert.equal(calls[0].options.credentials,"omit");
 assert.equal(calls[0].options.headers["X-API-Key"],"fixture-private-currency-key");
 assert.doesNotMatch(JSON.stringify(all),/fixture-private|countries|X-API-Key/);
});
test("upstream failure has a bounded cooldown and keeps the existing options",async()=>{
 const {api,calls}=setup({fetcher:()=>new Response("Private upstream diagnostic",{status:429})});
 const first=await api.getHotelCurrencyCatalog();for(let i=0;i<40;i++)await api.getHotelCurrencyCatalog();
 assert.equal(first.source,"local");assert.equal(first.items.length,9);assert.equal(calls.length,1);
 assert.doesNotMatch(JSON.stringify(first),/Private upstream|fixture-private/);
});
test("metadata is sanitized, bounded and cannot expand booking currency permissions",()=>{
 const {api}=setup();const result=api.parseNuiteeCurrencies({data:[...rows,{code:"XXX",currency:"Unapproved"},{code:"USD",currency:"<script>bad</script>"}]});
 assert.equal(result.items.length,9);assert.equal(result.items.find(item=>item.code==="USD").name,"US Dollar");
 assert.throws(()=>api.parseNuiteeCurrencies({data:Array(501).fill(rows[0])}));
 assert.throws(()=>api.parseNuiteeCurrencies({data:[{code:"XXX",currency:"Unapproved"}]}));
});
test("currency preference reaches the original SDK handoff without changing rooms or dates",()=>{
 const {hotelWidgetSearchParams}=loadTenderTs("src/lib/travel/hotel-whitelabel.ts",{}, {atob,btoa});
 const start=new Date(Date.now()+86400000*30).toISOString().slice(0,10),end=new Date(Date.now()+86400000*33).toISOString().slice(0,10);
 const payload={place:{place_id:"ChIJwe1EZjDG5zsRaYxkjY_tpF0"},checkin:start,checkout:end,occupancies:btoa(JSON.stringify([{adults:2,rooms:2,children:[6]}]))};
 const value=hotelWidgetSearchParams(payload,"USD");assert.equal(value.get("currency"),"USD");assert.equal(value.get("checkin"),start);
 assert.equal(JSON.parse(atob(value.get("occupancies"))).length,2);
 assert.equal(hotelWidgetSearchParams(payload).get("currency"),"INR");
 assert.equal(hotelWidgetSearchParams(payload,"USD&redirect=bad").get("currency"),"INR");
});
