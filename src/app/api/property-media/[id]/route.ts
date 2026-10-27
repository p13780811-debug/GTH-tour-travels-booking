import {submissionMediaObject} from "@/lib/property-media/submission-media";
import { privateMediaStore } from "@/lib/property-media/media-private";
export const runtime="nodejs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noStore={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const missing=()=>new Response(null,{status:404,headers:noStore});

/**
 * Public proxy for explicitly published and currently approved private media.
 * No signed URLs or Storage object names are exposed to browsers or indexing.
 */
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!UUID.test(id))return missing();
 try{
  const db=privateMediaStore();
  const {data:allowed,error:denied}=await db.rpc("is_property_media_public",{p_id:id});
  if(denied||allowed!==true)return missing();
  const {data:published,error}=await db.from("property_published_media")
   .select("id,claim_media_id,project_id,status,source_submission_id,submission_media_index").eq("id",id).eq("status","published").single();
  if(error||!published)return missing();
  let bucket="gth-re-claim-media",objectKey="";
  if(published.source_submission_id){
   const {data:submission,error:submissionError}=await db.from("listing_submissions")
    .select("owner_id,property_id,status,media_urls,media_rights_confirmed").eq("id",published.source_submission_id).single();
   if(submissionError||submission?.status!=="approved"||!submission.media_rights_confirmed||submission.property_id!==published.project_id)return missing();
   const index=published.submission_media_index;
   if(!Number.isInteger(index)||index<0||index>7||!Array.isArray(submission.media_urls))return missing();
   const object=submissionMediaObject(submission.media_urls[index],submission.owner_id,process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||"");
   if(!object)return missing();
   bucket="property-images";objectKey=object;
  }else{
  const {data:media,error:mediaError}=await db.from("property_claim_media")
   .select("id,claim_id,project_id,object_key,status").eq("id",published.claim_media_id).single();
  if(mediaError||!media||media.status!=="approved"||media.project_id!==published.project_id)return missing();
  const {data:claim,error:claimError}=await db.from("property_project_claims")
   .select("status,project_id").eq("id",media.claim_id).single();
  if(claimError||claim?.status!=="approved"||claim.project_id!==published.project_id)return missing();
  if(!/^claims\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(media.object_key))return missing();
   objectKey=media.object_key;
  }
  const {data:file,error:fileError}=await db.storage.from(bucket).download(objectKey);
  if(fileError||!file||file.size>5*1024*1024||file.size<=0)return missing();
  const result=new Uint8Array(await file.arrayBuffer());
  if(result.length<12||String.fromCharCode(...result.slice(0,4))!=="RIFF"||
    String.fromCharCode(...result.slice(8,12))!=="WEBP")return missing();
  return new Response(result,{headers:{...noStore,"Content-Type":"image/webp","Content-Length":String(result.byteLength)}});
 }catch{return missing()}
}
