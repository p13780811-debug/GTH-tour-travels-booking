import {validPropertySlug} from "./property-seo";
export const RECENT_KEY="gth-property-recent-v1";
export type RecentProperty={slug:string;title:string;city:string;viewedAt:number};
const clean=(value:unknown,max:number)=>typeof value==='string'?value.replace(/[<>\u0000-\u001f\u007f]/g,'').trim().slice(0,max):'';
export function normalizeRecent(value:unknown,now=Date.now()):RecentProperty[]{
 if(!Array.isArray(value))return [];
 const seen=new Set<string>();
 return value.slice(0,100).flatMap(row=>{
  if(!row||typeof row!=='object'||!validPropertySlug(row.slug)||!Number.isFinite(row.viewedAt)||row.viewedAt>now||row.viewedAt<now-30*86400000)return [];
  const title=clean(row.title,180);if(title.length<3)return [];
  return [{slug:row.slug,title,city:clean(row.city,80),viewedAt:row.viewedAt}];
 }).sort((a,b)=>b.viewedAt-a.viewedAt).filter(row=>{if(seen.has(row.slug))return false;seen.add(row.slug);return true;}).slice(0,12);
}
export function rememberProperty(history:unknown,property:Pick<RecentProperty,'slug'|'title'|'city'>,now=Date.now()){
 return normalizeRecent([{...property,viewedAt:now},...normalizeRecent(history,now).filter(row=>row.slug!==property.slug)],now);
}
