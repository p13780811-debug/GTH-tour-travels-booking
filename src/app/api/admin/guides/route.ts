import {createClient} from "@supabase/supabase-js";
import {authenticatedStorage} from "@/lib/security/auth";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {readJson,RequestError,requestError} from "@/lib/security/request";
import {guideBySlug,topicGuides,contentReady,GUIDE_CONTENT_VERSION} from "@/lib/travel/guideCatalog";
import {safeCommonsMedia} from "@/lib/travel/open-attractions";
export const dynamic="force-dynamic";
const H={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function admin(req:Request){
 const {user}=await authenticatedStorage(req);
 if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator permission required",403);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))
  throw new RequestError("Guide review backend unavailable",503);
 return {user,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
function sourceUrl(value:unknown,host:string,prefix:string){
 if(typeof value!=="string"||value.length>1800)return false;
 try{const u=new URL(value);return u.protocol==="https:"&&u.hostname===host&&u.pathname.startsWith(prefix)&&!u.username&&!u.password&&!u.port;}catch{return false;}
}
export async function GET(req:Request){
 try{
  if(new URL(req.url).search)throw new RequestError("Unexpected review query",400);
  const {db}=await admin(req);
  const [pubs,media]=await Promise.all([
   db.from("gth_travel_guide_publications").select("slug,content_version,status,editorial_reviewed_at").order("slug").limit(40),
   db.from("gth_travel_guide_media").select("id,guide_slug,source_page,license_type,license_url,attribution_text,alt_text,image_url,width,height,is_hero,editorial_approved,rights_reviewed_at")
    .order("created_at",{ascending:false}).limit(120)
  ]);
  if(pubs.error||media.error)throw new RequestError("Editorial queue unavailable",503);
  return Response.json({guides:pubs.data||[],media:media.data||[]},{headers:H});
 }catch(e){return requestError(e);}
}
export async function POST(req:Request){
 try{
  const {user,db}=await admin(req);await enforceRateLimit(req,"submissions",user.id);
  const body=await readJson(req,700);
  const action=body.action,slug=body.slug,id=body.id;
  if(!["approve_media","revoke_media","publish_guide","unpublish_guide"].includes(String(action))||
    Object.keys(body).some(k=>!["action","slug","id","source_checked","destination_checked","editorial_checked"].includes(k)))
    throw new RequestError("Invalid review action",400);
  if(action==="approve_media"||action==="revoke_media"){
   if(typeof id!=="string"||!UUID.test(id))throw new RequestError("Invalid media ID",400);
   const {data,error}=await db.from("gth_travel_guide_media")
    .select("id,guide_slug,image_url,source_page,license_type,license_url,attribution_text,alt_text,width,height")
    .eq("id",id).maybeSingle();
   if(error||!data)throw new RequestError("Media candidate not available",404);
   if(action==="approve_media"){
    if(body.source_checked!==true||body.destination_checked!==true||
      !safeCommonsMedia(data.image_url)||!sourceUrl(data.source_page,"commons.wikimedia.org","/wiki/File:")||
      !["creativecommons.org","www.creativecommons.org","commons.wikimedia.org"].some(host=>sourceUrl(data.license_url,host,"/"))||
      !["CC BY 4.0","CC BY-SA 4.0","CC0 1.0","Public domain"].includes(data.license_type)||
      typeof data.attribution_text!=="string"||data.attribution_text.length<3||
      typeof data.alt_text!=="string"||data.alt_text.length<8||
      !Number.isInteger(data.width)||data.width<800||!Number.isInteger(data.height)||data.height<500)
      throw new RequestError("Source, destination and rights review required",400);
   }
   const update=await db.from("gth_travel_guide_media").update(action==="approve_media"?
      {editorial_approved:true,is_hero:true,rights_reviewed_at:new Date().toISOString(),priority:100}:
      {editorial_approved:false,is_hero:false,rights_reviewed_at:null,priority:0})
     .eq("id",id).select("id,guide_slug,editorial_approved").maybeSingle();
   if(update.error||!update.data)throw new RequestError("Media review unavailable",503);
   return Response.json({updated:true,media:update.data},{headers:H});
  }
  if(typeof slug!=="string"||!slug||slug.length>95)throw new RequestError("Invalid guide slug",400);
  const item=guideBySlug(slug)||topicGuides.find(x=>x.slug===slug);
  if(!item||!contentReady(item))throw new RequestError("Guide content is incomplete",400);
  if(action==="publish_guide"){
   if(body.editorial_checked!==true)throw new RequestError("Editorial review confirmation required",400);
   const {data,error}=await db.from("gth_travel_guide_media")
    .select("id").eq("guide_slug",slug).eq("is_hero",true).eq("editorial_approved",true)
    .not("rights_reviewed_at","is",null).limit(1);
   if(error||!data?.length)throw new RequestError("A rights-approved hero image is required",400);
  }
  const patch=action==="publish_guide"?
   {status:"published",content_version:GUIDE_CONTENT_VERSION,editorial_reviewed_at:new Date().toISOString()}:
   {status:"draft",editorial_reviewed_at:null};
  const update=await db.from("gth_travel_guide_publications").update(patch).eq("slug",slug)
   .select("slug,status,editorial_reviewed_at").maybeSingle();
  if(update.error||!update.data)throw new RequestError("Editorial status update unavailable",503);
  return Response.json({updated:true,guide:update.data},{headers:H});
 }catch(e){return requestError(e);}
}
