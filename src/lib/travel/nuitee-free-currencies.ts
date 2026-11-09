import "server-only";
import {unstable_cache} from "next/cache";
import {HOTEL_CURRENCY_OPTIONS} from "./hotel-currency";

// Pricing supplied by the owner and official liteapi-node-sdk 4.3.2:
// GET /data/currencies is a free metadata endpoint, subject to the ToS.
// There is no caller-controlled URL/path, request body or method.
const CURRENCIES_URL="https://api.liteapi.travel/v3.0/data/currencies";
const TTL=86400;
export type HotelCurrencyCatalog={items:{code:string;name:string}[];source:"nuitee"|"local"};
const local:HotelCurrencyCatalog={items:HOTEL_CURRENCY_OPTIONS.map(item=>({...item})),source:"local"};
let inFlight:Promise<HotelCurrencyCatalog>|undefined;
let retryAfter=0;

export function parseNuiteeCurrencies(input:unknown):HotelCurrencyCatalog{
  if(!input||typeof input!=="object"||!Array.isArray((input as {data?:unknown}).data))throw Error("Invalid currency metadata");
  const data=(input as {data:unknown[]}).data;if(data.length>500)throw Error("Currency metadata too large");
  const names=new Map<string,string>();
  for(const row of data){
    if(!row||typeof row!=="object")continue;
    const {code,currency}=row as {code?:unknown;currency?:unknown};
    if(typeof code!=="string"||!HOTEL_CURRENCY_OPTIONS.some(item=>item.code===code))continue;
    if(typeof currency!=="string"||currency.length<2||currency.length>80||/[\x00-\x1f<>]/.test(currency))continue;
    names.set(code,currency.trim());
  }
  // Only the previously supported booking currencies are offered. Metadata
  // cannot silently expand the booking validator or remove an existing option.
  if(!names.size)throw Error("No supported currencies returned");
  return {items:HOTEL_CURRENCY_OPTIONS.map(item=>({code:item.code,name:names.get(item.code)||item.name})),source:"nuitee"};
}
const cached=unstable_cache(async():Promise<HotelCurrencyCatalog>=>{
  const key=process.env.NUITEE_PRODUCTION_API_KEY;
  if(!key)throw Error("Currency metadata not configured");
  const response=await fetch(CURRENCIES_URL,{
    method:"GET",headers:{accept:"application/json","X-API-Key":key},
    redirect:"error",credentials:"omit",signal:AbortSignal.timeout(5000),cache:"no-store",
  });
  if(!response.ok)throw Error("Currency metadata unavailable");
  if(Number(response.headers.get("content-length")||0)>128000)throw Error("Currency metadata too large");
  const text=await response.text();if(text.length>128000)throw Error("Currency metadata too large");
  return parseNuiteeCurrencies(JSON.parse(text));
},["gth-free-nuitee-currencies-v1"],{revalidate:TTL});

export async function getHotelCurrencyCatalog():Promise<HotelCurrencyCatalog>{
  if(!process.env.NUITEE_PRODUCTION_API_KEY)return local;
  if(Date.now()<retryAfter)return local;
  if(inFlight)return inFlight;
  const pending=cached().catch(()=>{retryAfter=Date.now()+300000;return local;});
  inFlight=pending;
  try{return await pending;}finally{if(inFlight===pending)inFlight=undefined;}
}
