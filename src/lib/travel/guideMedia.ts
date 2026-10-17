import "server-only";
import {createClient} from "@supabase/supabase-js";
import {safeCommonsMedia} from "@/lib/travel/open-attractions";
import {GUIDE_CONTENT_VERSION,contentReady,guideBySlug,topicGuides,guideCatalog} from "@/lib/travel/guideCatalog";

export type ApprovedGuideMedia={image_url:string;source_page:string;source_name:string;license_type:string;
 license_url:string;attribution_text:string;alt_text:string;width:number;height:number;guide_slug:string};
function client(){
 const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return u&&k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
function mediaSafe(raw:ApprovedGuideMedia):boolean{
 try{const page=new URL(raw.source_page),license=new URL(raw.license_url);
  return !!safeCommonsMedia(raw.image_url)&&page.protocol==="https:"&&page.hostname==="commons.wikimedia.org"&&
   page.pathname.startsWith("/wiki/File:")&&license.protocol==="https:"&&!license.username&&!license.password&&
   ["CC BY 4.0","CC BY-SA 4.0","CC0 1.0","Public domain"].includes(raw.license_type)&&
   raw.attribution_text.length>=3&&raw.alt_text.length>=8&&raw.width>=800&&raw.height>=500;
 }catch{return false;}
}
type Publish={slug:string;content_version:number};
export async function publishedMedia(slugs:readonly string[]):Promise<Map<string,ApprovedGuideMedia>>{
 const db=client();const out=new Map<string,ApprovedGuideMedia>();
 const safe=[...new Set(slugs)].filter(s=>/^[a-z]+(?:-[a-z]+)*(?:\/[a-z]+(?:-[a-z]+)*)?$/.test(s)).slice(0,30);
 if(!db||safe.length===0)return out;
 try{
  const [p,m]=await Promise.all([
   db.from("gth_travel_guide_publications").select("slug,content_version").eq("status","published")
     .not("editorial_reviewed_at","is",null).in("slug",safe).limit(30),
   db.from("gth_travel_guide_media").select("guide_slug,image_url,source_page,source_name,license_type,license_url,attribution_text,alt_text,width,height")
     .eq("editorial_approved",true).eq("is_hero",true).in("guide_slug",safe).order("priority",{ascending:false}).limit(60)
  ]);
  if(p.error||m.error)return out;
  const reviewed=new Set(((p.data??[]) as Publish[]).filter(x=>x.content_version===GUIDE_CONTENT_VERSION).map(x=>x.slug));
  for(const row of (m.data??[]) as ApprovedGuideMedia[]){
   if(reviewed.has(row.guide_slug)&&mediaSafe(row)&&!out.has(row.guide_slug))out.set(row.guide_slug,row);
  }
 }catch{return out;}
 return out;
}
export async function indexableGuidePaths():Promise<string[]>{
 const entries=[...guideCatalog.filter(contentReady).map(g=>g.slug),...topicGuides.filter(contentReady).map(g=>g.slug)];
 const images=await publishedMedia(entries);
 return entries.filter(slug=>images.has(slug));
}
export async function guidePublicationStats(){
 const all=[...guideCatalog.map(g=>g.slug),...topicGuides.map(g=>g.slug)];
 const ready=await publishedMedia(all);
 return {candidateGuides:all.length,indexableGuides:ready.size,awaitingEditorialOrImageReview:all.length-ready.size};
}
export function guideIsReadyForIndex(slug:string,media:Map<string,ApprovedGuideMedia>):boolean{
 const item=guideBySlug(slug)||topicGuides.find(x=>x.slug===slug);
 return !!item&&contentReady(item)&&media.has(slug);
}
