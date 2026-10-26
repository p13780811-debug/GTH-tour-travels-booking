import {submissionMediaObject} from "@/lib/property-media/submission-media";
import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";
import { privateMediaStore } from "@/lib/property-media/media-private";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req:Request){
 try{
  const {client,user}=await authenticatedStorage(req);
  if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator review required",403);
  const body=await readJson(req,2048);
  if(body.submission_id!==undefined){
   const submission=cleanString(body.submission_id,{min:36,max:36,pattern:UUID});
   const index=body.photo_index;
   const action=body.action;
   const notes=cleanString(body.notes,{min:20,max:1000});
   if(!submission||typeof index!=="number"||!Number.isInteger(index)||index<0||index>7||!["publish","take_down"].includes(String(action))||!notes)throw new RequestError("Documented photo review required",400);
   const {data,error}=await client.rpc("manage_submission_media_publication",{p_submission:submission,p_index:index,p_action:action,p_notes:notes});
   if(error||!data)throw new RequestError("Independent rights approval and published inventory are required",409);
   return Response.json({success:true,status:action==="publish"?"published":"taken_down"},{headers:{"Cache-Control":"no-store"}});
  }
  const media=cleanString(body.media_id,{min:36,max:36,pattern:UUID});
  const action=cleanString(body.action,{min:7,max:9});
  const notes=cleanString(body.notes,{min:20,max:1000});
  if(!media||!action||!["publish","take_down"].includes(action)||!notes)
   throw new RequestError("Documented approval or takedown is required",400);
  const {data,error}=await client.rpc("manage_property_media_publication",
   {p_media:media,p_action:action,p_notes:notes});
  if(error||!data)throw new RequestError("Publication prerequisites not met",409);
  return Response.json({success:true,status:action==="publish"?"published":"taken_down"},
    {headers:{"Cache-Control":"no-store"}});
 }catch(error){return requestError(error)}
}

export async function GET(req:Request){
 try{
  const {client,user}=await authenticatedStorage(req);
  if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);
  const publicationDb=privateMediaStore();
  const [media,published,submissions]=await Promise.all([
   client.from("property_claim_media").select("id,project_id,claim_id,media_type,supplier,attribution,license_basis,permission_reference,reviewed_at,status")
    .eq("status","approved").order("reviewed_at",{ascending:false}).limit(60),
   publicationDb.from("property_published_media").select("id,claim_media_id,project_id,media_type,is_primary,published_at,source_submission_id,submission_media_index")
    .eq("status","published").order("published_at",{ascending:false}).limit(60),
   client.from("listing_submissions").select("id,title,property_id,owner_id,media_urls,media_rights_confirmed,reviewed_at")
    .eq("status","approved").eq("media_rights_confirmed",true).order("reviewed_at",{ascending:false}).limit(60),
  ]);
  if(media.error||published.error||submissions.error)throw new RequestError("Media publication queue unavailable",503);
  const reviewedSubmissions=(submissions.data||[]).map(({owner_id,media_urls,...item})=>({...item,
   // Preserve indexes so a filtered invalid URL never points approval at another photo.
   media_urls:Array.isArray(media_urls)?media_urls.map(raw=>submissionMediaObject(raw,owner_id,process.env.NEXT_PUBLIC_SUPABASE_URL||"")?raw:null):[],
  }));
  return Response.json({eligible:media.data||[],published:published.data||[],submissions:reviewedSubmissions},
   {headers:{"Cache-Control":"private,no-store"}});
 }catch(error){return requestError(error)}
}
