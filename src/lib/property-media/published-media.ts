import { supabase } from "@/lib/supabase";

export type PublishedMedia = {
 id:string; project_id:number; media_type:"photo"|"render"|"floor_plan";
 attribution:string|null; is_primary:boolean; published_at:string;
};
export function publishedMediaUrl(id:string):string {
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return "";
 return `/api/property-media/${encodeURIComponent(id)}`;
}
export async function getPublishedProjectMedia(projectIds:readonly number[]):Promise<PublishedMedia[]>{
 const ids=[...new Set(projectIds)].filter(id=>Number.isSafeInteger(id)&&id>0).slice(0,100);
 if(!ids.length)return [];
 try {
  const {data,error}=await supabase.from("property_published_media")
   .select("id,project_id,media_type,attribution,is_primary,published_at")
   .in("project_id",ids).order("published_at",{ascending:false}).limit(100);
  if(error||!data)return [];
  return (data as PublishedMedia[]).filter(m=>ids.includes(Number(m.project_id)));
 }catch{return []}
}
/** Floor plans never become the project photograph. */
export function projectCover(media:readonly PublishedMedia[]):PublishedMedia|undefined{
 return media.find(m=>m.is_primary && m.media_type!=="floor_plan")||
  media.find(m=>m.media_type==="photo")||media.find(m=>m.media_type==="render");
}
