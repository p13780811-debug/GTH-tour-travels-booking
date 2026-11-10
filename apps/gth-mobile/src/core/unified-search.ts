import {getSourceCards,type DiscoveryCard,type DiscoveryKind} from "./catalog";
import {detectPillar,normalizeQuery,type Pillar} from "./routing";

export type SearchChoice=DiscoveryKind|"all"|"travel";
export type SearchSlice={kind:DiscoveryKind;items:DiscoveryCard[];total:number;error:string|null;page?:number;hasNext?:boolean;totalIsExact?:boolean;stale?:boolean};
export type SearchOutcome={items:DiscoveryCard[];total:number;warnings:string[];slices:SearchSlice[]};
export const SOURCE_KINDS:readonly DiscoveryKind[]=["hotel","property","tender","tour"];

export function searchChoice(raw:string,selected:SearchChoice="all"):SearchChoice{
 if(selected!=="all")return selected;
 const detected=detectPillar(raw);
 return detected==="all"?"all":detected;
}
/** Query each *existing* public API; no app-only duplicate index or unverified data. */
export async function searchNativeSources(choice:SearchChoice,raw:string,signal:AbortSignal,tenderRegion="IN"):Promise<SearchOutcome>{
 const query=normalizeQuery(raw);
 const sources:DiscoveryKind[]=choice==="all"? [...SOURCE_KINDS] :
  choice==="travel"?["hotel","tour"]:[choice];
 const results=await Promise.allSettled(sources.map(kind=>getSourceCards(kind,query,signal,tenderRegion)));
 const slices:SearchSlice[]=sources.map((kind,index)=>{
  const result=results[index];
  return result.status==="fulfilled"
   ?{kind,items:result.value.items,total:result.value.total,totalIsExact:result.value.totalIsExact,error:null,page:1,hasNext:result.value.hasNext===true}
   :{kind,items:[],total:0,error:"Source temporarily unavailable",page:0,hasNext:false};
 });
 return combineSlices(slices);
}
export function combineSlices(slices:SearchSlice[]):SearchOutcome{
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

/** Advance only sources with a confirmed next page. Failed pages keep their
 * previous cursor and records, so Retry never skips records or erases results. */
export async function nextNativePage(previous:SearchSlice[],raw:string,signal:AbortSignal,tenderRegion="IN"):Promise<SearchOutcome>{
 const slices=await Promise.all(previous.map(async slice=>{
  if(!slice.hasNext)return slice;
  const page=(slice.page??1)+1;
  try{
   const data=await getSourceCards(slice.kind,normalizeQuery(raw),signal,tenderRegion,page);
   const seen=new Set(slice.items.map(item=>item.id));
   const items=[...slice.items,...data.items.filter(item=>!seen.has(item.id))];
   return {...slice,items,total:Math.max(data.total,items.length),totalIsExact:data.totalIsExact,page,
    hasNext:data.hasNext===true&&data.items.length>0,error:null,stale:false};
  }catch{return {...slice,error:"Source temporarily unavailable"};}
 }));
 return combineSlices(slices);
}

/** Recover only failed sources at their failed page. Successful pages remain
 * visible, and a failed first page is retried at page one rather than skipped. */
export async function retryNativeSources(previous:SearchSlice[],raw:string,signal:AbortSignal,tenderRegion="IN"):Promise<SearchOutcome>{
 const slices=await Promise.all(previous.map(async slice=>{
  if(!slice.error)return slice;
  const page=(slice.page??0)+1;
  try{
   const data=await getSourceCards(slice.kind,normalizeQuery(raw),signal,tenderRegion,page);
   const seen=new Set(slice.items.map(item=>item.id));
   const items=[...slice.items,...data.items.filter(item=>!seen.has(item.id))];
   return {...slice,items,total:Math.max(data.total,items.length),totalIsExact:data.totalIsExact,page,
    hasNext:data.hasNext===true,error:null,stale:false};
  }catch{return slice;}
 }));
 return combineSlices(slices);
}

/** Re-read the loaded window on a user-initiated refresh. Refreshing pages
 * replaces old source data, including removals, without discarding pagination
 * or any personal notebook. Failed sources retain an explicitly stale snapshot. */
export async function refreshNativeSources(previous:SearchSlice[],raw:string,signal:AbortSignal,tenderRegion="IN"):Promise<SearchOutcome>{
 const slices=await Promise.all(previous.map(async old=>{
  try{
   let fresh:SearchSlice={...old,items:[],error:null,stale:false};
   const seen=new Set<string>();
   for(let page=1;page<=Math.max(1,old.page??1);page++){
    const data=await getSourceCards(old.kind,normalizeQuery(raw),signal,tenderRegion,page);
    const items=data.items.filter(item=>{if(seen.has(item.id))return false;seen.add(item.id);return true;});
    fresh={...fresh,items:[...fresh.items,...items],total:data.total,totalIsExact:data.totalIsExact,page,hasNext:data.hasNext===true};
    if(!fresh.hasNext)break;
   }
   return {...fresh,total:Math.max(fresh.total,fresh.items.length)};
  }catch{return {...old,error:"Refresh unavailable; showing previously loaded records",stale:true};}
 }));
 return combineSlices(slices);
}
