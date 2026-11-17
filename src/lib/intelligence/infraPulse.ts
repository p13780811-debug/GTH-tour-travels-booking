import "server-only";
import {unstable_cache} from "next/cache";
import {createClient} from "@supabase/supabase-js";
import type {InfraNotice,InfraPulse} from "./contracts";
export function intelligencePublicDb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
}
const read=unstable_cache(async(ids:number[])=>{
 const db=intelligencePublicDb();if(!db)return null;
 const {data,error}=await db.rpc("gth_read_infra_pulse",{p_property_ids:ids}).abortSignal(AbortSignal.timeout(5000));
 if(error||!Array.isArray(data))return null;
 const map:Record<number,InfraPulse>={},checkedAt=new Date().toISOString();
 for(const row of data){
  if(!ids.includes(Number(row.property_id))||!Number.isSafeInteger(Number(row.total_count))||Number(row.total_count)<1||!Array.isArray(row.notices))continue;
  const notices:InfraNotice[]=row.notices.flatMap((n:Record<string,unknown>)=>typeof n.id==="string"&&/^[a-f0-9-]{36}$/i.test(n.id)&&typeof n.title==="string"&&typeof n.authority==="string"&&typeof n.deadline==="string"&&Date.parse(n.deadline)>Date.now()&&["city","district","region"].includes(String(n.scope))&&typeof n.region==="string"?[n as InfraNotice]:[]);
  if(notices.length)map[Number(row.property_id)]={count:Number(row.total_count),notices,checkedAt};
 }
 return map;
},["gth-infra-pulse-v1"],{revalidate:60});
/** One bounded anonymous/RLS request for a search page; no per-card query. */
export async function readInfraPulse(ids:number[]):Promise<Record<number,InfraPulse>> {
 const selected=[...new Set(ids)].filter(id=>Number.isSafeInteger(id)&&id>0).sort((a,b)=>a-b).slice(0,24);
 if(!selected.length)return {};
 try{
  const rows=await read(selected),now=Date.now();
  return Object.fromEntries(Object.entries(rows||{}).flatMap(([key,pulse])=>{
   // Cache expiration must never keep an expired notice visible or its old count.
   if(pulse.notices.some(n=>Date.parse(n.deadline)<=now))return [];
   return [[key,pulse]];
  }));
 }catch{return {};}
}
