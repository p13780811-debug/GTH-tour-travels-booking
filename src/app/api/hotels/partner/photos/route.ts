import sharp from "sharp";
import {randomUUID} from "node:crypto";
import {authenticatedStorage} from "@/lib/security/auth";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {readBytes,RequestError,requestError} from "@/lib/security/request";
import {hotelPartnerWriter,PRIVATE_BUCKET} from "@/lib/hotels/partner-server";

export const runtime="nodejs";
const MAX_INPUT=3*1024*1024;
const MAX_OUTPUT=2*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES=new Set(["image/jpeg","image/png","image/webp"]);
export async function POST(request:Request){
 try {
  const {client,user}=await authenticatedStorage(request);
  if(!user.email_confirmed_at)throw new RequestError("Email verification required",403);
  await enforceRateLimit(request,"upload",user.id);
  const kind=request.headers.get("content-type")||"";
  if(!kind.toLowerCase().startsWith("multipart/form-data;"))throw new RequestError("Hotel photo upload must use multipart form data",415);
  const bytes=await readBytes(request,MAX_INPUT+64*1024);
  const data=await new Response(Buffer.from(bytes),{headers:{"content-type":kind}}).formData();
  const submissionId=data.get("submission_id"),slotRaw=data.get("slot"),file=data.get("file");
  if(typeof submissionId!=="string"||!UUID.test(submissionId)||
    typeof slotRaw!=="string"||!/^[0-5]$/.test(slotRaw)||
    !(file instanceof File)||!TYPES.has(file.type))
     throw new RequestError("Choose a valid JPEG, PNG or WebP photo and hotel submission",400);
  if(file.size===0||file.size>MAX_INPUT)throw new RequestError("Photo must be 3 MB or smaller",413);
  const slot=Number(slotRaw);
  const {data:submission,error}=await client.from("hotel_partner_submissions")
    .select("id,status").eq("id",submissionId).eq("owner_id",user.id).maybeSingle();
  if(error||!submission||submission.status!=="pending")
    throw new RequestError("This hotel submission does not accept new photos",403);
  const writer=hotelPartnerWriter();
  const {data:occupied,error:photoError}=await writer.from("hotel_partner_photos")
    .select("id").eq("submission_id",submissionId).eq("slot",slot).maybeSingle();
  if(photoError)throw new RequestError("Hotel photo status unavailable",503);
  if(occupied)throw new RequestError("This photo slot is already filled. Choose an empty slot.",409);
  let processed:Buffer;
  try{
   processed=await sharp(Buffer.from(await file.arrayBuffer()),{
     failOn:"warning",limitInputPixels:30_000_000,animated:false,
   }).rotate().resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true})
     .webp({quality:78,effort:4}).toBuffer();
  }catch{throw new RequestError("Invalid or unsupported image file",400);}
  if(!processed.length||processed.byteLength>MAX_OUTPUT)
   throw new RequestError("Photo is too large after processing. Try a smaller photo.",413);
  // No public exposure before approval; metadata/EXIF removed by WebP re-encoding.
  const privatePath=`${user.id}/${submissionId}/${slot}-${randomUUID()}.webp`;
  const upload=await writer.storage.from(PRIVATE_BUCKET).upload(privatePath,processed,{
    contentType:"image/webp",cacheControl:"3600",upsert:false
  });
  if(upload.error)throw new RequestError("Private hotel photo storage is unavailable",503);
  const stored=await writer.from("hotel_partner_photos").insert({
    submission_id:submissionId,slot,private_path:privatePath,
  });
  if(stored.error){
   await writer.storage.from(PRIVATE_BUCKET).remove([privatePath]);
   throw new RequestError("Unable to attach this photo. Retry with an empty slot.",409);
  }
  return Response.json({uploaded:true,slot,status:"private_review"},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){return requestError(error);}
}
