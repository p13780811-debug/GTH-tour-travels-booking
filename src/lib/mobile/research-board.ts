/** Minimal device-only research shortcuts. No booking, identity, price or search history is persisted. */
export const RESEARCH_KEY="gth.app.research.v1";
export const RESEARCH_LIMIT=24;
export type ResearchKind="destination"|"hotel"|"property"|"tender";
export type ResearchEntry={kind:ResearchKind;href:string;title:string;subtitle:string;addedAt:number};
const PATHS:Record<ResearchKind,RegExp>={
 destination:/^\/app\/destinations\/[a-z0-9][a-z0-9-]{1,79}$/,
 hotel:/^\/app\/hotels\/osm:(?:node|way|relation)-[0-9]{1,19}$/,
 property:/^\/app\/property\/[a-z0-9][a-z0-9-]{1,127}$/,
 tender:/^\/app\/tenders\/[a-f0-9-]{36}$/i,
};
const trim=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
export function validResearchEntry(value:unknown):value is ResearchEntry{
 if(!value||typeof value!=="object")return false;
 const x=value as Record<string,unknown>;
 return typeof x.kind==="string"&&Object.prototype.hasOwnProperty.call(PATHS,x.kind)
   &&typeof x.href==="string"&&PATHS[x.kind as ResearchKind].test(x.href)
   &&typeof x.title==="string"&&x.title.trim().length>0&&x.title.length<=120
   &&typeof x.subtitle==="string"&&x.subtitle.length<=120
   &&typeof x.addedAt==="number"&&Number.isSafeInteger(x.addedAt)
   &&x.addedAt>=0&&x.addedAt<=Date.now()+86_400_000;
}
export function parseResearch(raw:string|null):ResearchEntry[]{
 if(!raw||raw.length>16000)return [];
 try{
  const values:unknown=JSON.parse(raw);
  if(!Array.isArray(values))return [];
  const seen=new Set<string>();
  return values.filter((v):v is ResearchEntry=>validResearchEntry(v))
   .filter(v=>{if(seen.has(v.href))return false;seen.add(v.href);return true;})
   .slice(0,RESEARCH_LIMIT)
   .map(v=>({kind:v.kind,href:v.href,title:v.title,subtitle:v.subtitle,addedAt:v.addedAt}));
 }catch{return [];}
}
export function saveResearch(current:ResearchEntry[],input:Omit<ResearchEntry,"addedAt">,now=Date.now()):ResearchEntry[]{
 const entry={kind:input.kind,href:input.href,title:trim(input.title,120),subtitle:trim(input.subtitle,120),addedAt:now};
 if(!validResearchEntry(entry))return current;
 return [entry,...current.filter(v=>v.href!==entry.href)].slice(0,RESEARCH_LIMIT);
}
export function removeResearch(current:ResearchEntry[],href:string):ResearchEntry[]{
 return current.filter(entry=>entry.href!==href);
}
