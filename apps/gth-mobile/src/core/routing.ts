export const SITE_ORIGIN = "https://www.gthproglobal.com" as const;

export type Pillar = "travel" | "hotel" | "property" | "tender" | "tour";
const TERM_LIMIT=70;
const words={
  hotel:/\b(?:hotels?|resorts?|stays?|rooms?|guest\s*houses?|accommodation)\b/i,
  property:/\b(?:real\s*estate|propert(?:y|ies)|flats?|apartments?|villas?|plots?|rera|homes?|housing)\b/i,
  tender:/\b(?:tenders?|bids?|procurement|rfp|gem)\b/i,
  tour:/\b(?:tours?|activities|attractions?|sightseeing)\b/i,
} as const;
export function normalizeQuery(raw:string):string {
 return raw.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,TERM_LIMIT);
}
export function detectPillar(query:string):Pillar|"all"{
 const q=normalizeQuery(query);
 if(words.tender.test(q))return "tender";
 if(words.property.test(q))return "property";
 if(words.hotel.test(q))return "hotel";
 if(words.tour.test(q))return "tour";
 return "all";
}
export function searchTerm(raw:string,kind:Pillar):string {
 const query=normalizeQuery(raw);
 const replace={
   hotel:/\b(?:find|search|best|cheap|hotels?|resorts?|stays?|rooms?|in|near|at)\b/gi,
   property:/\b(?:find|search|properties|property|homes?|in|near|buy|rent)\b/gi,
   tender:/\b(?:find|search|tenders?|bids?|procurement|rfp|in|for)\b/gi,
   tour:/\b(?:find|search|tours?|activities|attractions?|sightseeing|in|near)\b/gi,
   travel:/\b(?:find|search|travel|visit|in|near)\b/gi,
 }[kind];
 return query.replace(replace," ").replace(/\s+/g," ").trim().slice(0,TERM_LIMIT);
}
export function firstPartyUrl(path:string):string|null {
 if(!path.startsWith("/")||path.startsWith("//")||path.includes("\\")||/[\u0000-\u001f]/.test(path))return null;
 try {
  const url=new URL(path,SITE_ORIGIN);
  if(url.origin!==SITE_ORIGIN||url.username||url.password)return null;
  return url.toString();
 }catch{return null;}
}
export function approvedRecordPath(kind:Pillar,id:string):string|null {
 if(kind==="hotel"&&/^osm:(?:node|way|relation)-[0-9]{1,19}$/.test(id))return "/app/hotels/"+id;
 if(kind==="property"&&/^[a-z0-9][a-z0-9-]{1,127}$/.test(id))return "/app/property/"+id;
 if(kind==="tender"&&/^[a-f0-9-]{36}$/i.test(id))return "/app/tenders/"+id;
 return null;
}
export const serviceDestination:Record<Pillar,string>={
  travel:"/app/flights",hotel:"/app/hotels",property:"/app/property",tender:"/app/tenders",tour:"/tours",
};
