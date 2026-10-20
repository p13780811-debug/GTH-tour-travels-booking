import "server-only";

export type FeedContract = {
 key: string; origin: string; agreementReference: string; rightsBasis: "creator"|"authorized_owner"|"documented_license";
};
export type FeedCandidate = {
 external_reference: string; rera_reference: string; source_url: string;
 media_type: "photo"|"render"|"floor_plan"; permission_reference: string; attribution?: string;
};
const IDENTIFIER=/^[a-z][a-z0-9_-]{2,40}$/;
const RERA=/^P[0-9]{11}$/;
const TYPES=new Set(["photo","render","floor_plan"]);
const RIGHTS=new Set(["creator","authorized_owner","documented_license"]);
const isSafeUrl=(input:string): URL|null=>{
 try{
  const u=new URL(input);
  if(u.protocol!=="https:"||u.port||u.username||u.password||u.hash||u.hostname==="localhost"||
     /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)||u.hostname.includes(":")||
     !u.hostname.includes(".")||u.href.length>1200) return null;
  return u;
 }catch{return null}
};
const safe=(value:unknown,min:number,max:number):string|null=>
 typeof value==="string"&&value.length>=min&&value.length<=max&&
 value.trim().length>=min&&!/[<>\u0000-\u001f\u007f]/.test(value)?value.trim():null;

/** These contracts are business approvals, supplied only via server-side env; no browser token. */
export function configuredMediaFeeds(): FeedContract[] {
 let rows:unknown;
 try{rows=JSON.parse(process.env.GTH_RE_MEDIA_SOURCE_CONTRACTS||"[]");}catch{return []}
 if(!Array.isArray(rows)||rows.length>20)return [];
 const out:FeedContract[]=[];
 for(const value of rows){
  if(!value||typeof value!=="object")continue;
  const item=value as Record<string,unknown>;
  const key=safe(item.key,3,40),agreement=safe(item.agreementReference,12,500);
  const origin=typeof item.origin==="string"?isSafeUrl(item.origin):null;
  if(!key||!IDENTIFIER.test(key)||!agreement||!origin||origin.pathname!=="/"||
     origin.search||!RIGHTS.has(String(item.rightsBasis)))continue;
  if(out.some(row=>row.key===key||row.origin===origin.origin))continue;
  out.push({key,origin:origin.origin,agreementReference:agreement,
   rightsBasis:item.rightsBasis as FeedContract["rightsBasis"]});
 }
 return out;
}
export function validateMediaCandidate(value:unknown,contract:FeedContract):FeedCandidate|null{
 if(!value||typeof value!=="object")return null;
 const v=value as Record<string,unknown>;
 const id=safe(v.external_reference,5,150),rera=safe(v.rera_reference,12,12);
 const permission=safe(v.permission_reference,12,500);
 const attribution=v.attribution==null?undefined:safe(v.attribution,2,250);
 const source=typeof v.source_url==="string"?isSafeUrl(v.source_url):null;
 if(!id||!rera||!RERA.test(rera)||!permission||!source||source.origin!==contract.origin||
  !TYPES.has(String(v.media_type))||(v.attribution!=null&&!attribution))return null;
 return {external_reference:id,rera_reference:rera,source_url:source.href,
  media_type:v.media_type as FeedCandidate["media_type"],permission_reference:permission,
  ...(attribution?{attribution}:{})};
}
