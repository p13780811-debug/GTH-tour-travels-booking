import "server-only";
import {listAppRecords,normalizeAppQuery,type AppListing,type AppQuery} from "./catalog";
import type {MobileSection} from "./routes";

export type ExplorePillar="all"|"travel"|"property"|"tender"|"ticket";
const SECTION_GROUPS:Record<ExplorePillar,readonly MobileSection[]>={
 all:["destinations","hotels","property","tenders"],
 travel:["destinations","hotels"],
 property:["property"],
 tender:["tenders"],
 ticket:[],
};
export function normalizeExploreQuery(params:Record<string,string|string[]|undefined>){
 const raw=typeof params.pillar==="string"?params.pillar:"all";
 const pillar:ExplorePillar=raw==="travel"||raw==="property"||raw==="tender"||raw==="ticket"?raw:"all";
 const q=normalizeAppQuery(params).q;
 return {q,pillar};
}
export type ExploreResult={section:MobileSection;data:AppListing};
export async function searchGlobalRecords(q:string,pillar:ExplorePillar):Promise<ExploreResult[]>{
 if(q.length<2)return [];
 const sections=SECTION_GROUPS[pillar];
 const params:AppQuery={q,country:"",category:"",destination:"",page:1};
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),4500);
 try{
  // One deadline for every optional source. Authenticated/source-restricted
  // records remain restricted by the existing public Supabase RLS policies.
  const results=await Promise.allSettled(sections.map(section=>listAppRecords(section,params,controller.signal)));
  return sections.map((section,i)=>({
   section,
   data:results[i].status==="fulfilled"?results[i].value:
    {items:[],total:0,page:1,size:24,error:"Source unavailable; try its dedicated directory"},
  }));
 }finally{clearTimeout(timer);}
}
