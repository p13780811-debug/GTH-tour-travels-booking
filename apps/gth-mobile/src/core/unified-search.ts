import {getSourceCards,type DiscoveryCard,type DiscoveryKind} from "./catalog";
import {detectPillar,normalizeQuery,type Pillar} from "./routing";

export type SearchChoice=DiscoveryKind|"all"|"travel";
export type SearchSlice={kind:DiscoveryKind;items:DiscoveryCard[];total:number;error:string|null};
export type SearchOutcome={items:DiscoveryCard[];total:number;warnings:string[];slices:SearchSlice[]};
export const SOURCE_KINDS:readonly DiscoveryKind[]=["hotel","property","tender","tour"];

export function searchChoice(raw:string,selected:SearchChoice="all"):SearchChoice{
 if(selected!=="all")return selected;
 const detected=detectPillar(raw);
 return detected==="all"?"all":detected;
}
/** Query each *existing* public API; no app-only duplicate index or unverified data. */
export async function searchNativeSources(choice:SearchChoice,raw:string,signal:AbortSignal):Promise<SearchOutcome>{
 const query=normalizeQuery(raw);
 const sources:DiscoveryKind[]=choice==="all"? [...SOURCE_KINDS] :
  choice==="travel"?["hotel","tour"]:[choice];
 const results=await Promise.allSettled(sources.map(kind=>getSourceCards(kind,query,signal)));
 const slices:SearchSlice[]=sources.map((kind,index)=>{
  const result=results[index];
  return result.status==="fulfilled"
   ?{kind,items:result.value.items,total:result.value.total,error:null}
   :{kind,items:[],total:0,error:"Source temporarily unavailable"};
 });
 const seen=new Set<string>();
 const combined=slices.flatMap(slice=>slice.items).filter(item=>{
  const id=item.kind+":"+item.id;
  if(seen.has(id))return false;
  seen.add(id);return true;
 });
 return {
  items:combined,total:slices.reduce((sum,item)=>sum+item.total,0),
  warnings:slices.filter(s=>s.error).map(s=>s.kind+" results are temporarily unavailable"),
  slices,
 };
}
