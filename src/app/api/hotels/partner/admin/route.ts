import {authenticatedStorage} from "@/lib/security/auth";
import {hotelPartnerWriter,PRIVATE_BUCKET,PUBLIC_BUCKET} from "@/lib/hotels/partner-server";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {readJson,RequestError,requestError} from "@/lib/security/request";
import {siteUrl} from "@/lib/seo/site";

export const runtime="nodejs";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function requireAdmin(request:Request){
 const {user}=await authenticatedStorage(request);
 // Client-controlled user_metadata is never a permission source.
 if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator permission required",403);
 return user;
}
export async function GET(request:Request){
 try{
  await requireAdmin(request);
  const db=hotelPartnerWriter();
  const {data,error}=await db.from("hotel_partner_submissions")
   .select("id,hotel_name,city,country_code,address,category,description,owner_name,contact_email,website,photo_rights_confirmed,owner_authorised,status,created_at,published_hotel_id")
   .in("status",["pending","reviewing","approved","rejected"])
   .order("created_at",{ascending:false}).limit(30);
  if(error)throw new RequestError("Review queue unavailable",503);
  const submissions=data||[];
  const {data:photos,error:photoError}=submissions.length
   ?await db.from("hotel_partner_photos").select("submission_id,slot,private_path")
     .in("submission_id",submissions.map(x=>x.id)).order("slot",{ascending:true})
   :{data:[],error:null};
  if(photoError)throw new RequestError("Review gallery unavailable",503);
  const grouped=new Map<string,{slot:number;url:string}[]>();
  for(const photo of photos||[]){
   const list=grouped.get(photo.submission_id)||[];
   if(list.length>=6)continue;
   const {data:signed}=await db.storage.from(PRIVATE_BUCKET)
      .createSignedUrl(photo.private_path,600);
   if(signed?.signedUrl)list.push({slot:photo.slot,url:signed.signedUrl});
   grouped.set(photo.submission_id,list);
  }
  return Response.json(submissions.map(item=>({...item,photos:grouped.get(item.id)||[]})),{headers:HEADERS});
 }catch(error){return requestError(error);}
}
export async function POST(request:Request){
 try{
  await requireAdmin(request);
  await enforceRateLimit(request,"submissions");
  const input=await readJson(request,1500);
  const id=input.submission_id,action=input.action;
  if(typeof id!=="string"||!UUID.test(id)||!["approve","reject"].includes(String(action)))
   throw new RequestError("Invalid review request",400);
  const db=hotelPartnerWriter();
  const {data:row,error:readError}=await db.from("hotel_partner_submissions")
   .select("id,hotel_name,city,category,description,address,website,status,owner_authorised,photo_rights_confirmed,published_hotel_id")
   .eq("id",id).maybeSingle();
  if(readError||!row)throw new RequestError("Hotel submission was not found",404);
  if(row.status!=="pending")throw new RequestError("Hotel has already been reviewed or is processing",409);
  if(action==="reject"){
   const note=typeof input.review_note==="string"?input.review_note.trim().slice(0,400):"Information or media requires revision";
   const result=await db.from("hotel_partner_submissions").update({
    status:"rejected",review_note:note||"Submission not approved",reviewed_at:new Date().toISOString()
   }).eq("id",id).eq("status","pending").select("id").maybeSingle();
   if(result.error||!result.data)throw new RequestError("Unable to reject hotel submission",409);
   return Response.json({review_status:"rejected",published:false},{headers:HEADERS});
  }
  if(input.business_verified!==true||input.photo_rights_verified!==true||
     !row.owner_authorised||!row.photo_rights_confirmed)
    throw new RequestError("Manually verify the hotel business, owner authority and rights to every submitted photo",400);
  const {data:photos,error:photosError}=await db.from("hotel_partner_photos")
   .select("slot,private_path").eq("submission_id",id).order("slot",{ascending:true}).limit(6);
  if(photosError||!photos?.length)throw new RequestError("At least one original hotel photograph is required before approval",400);
  const claim=await db.from("hotel_partner_submissions")
    .update({status:"reviewing"}).eq("id",id).eq("status","pending").select("id").maybeSingle();
  if(claim.error||!claim.data)throw new RequestError("Hotel review is being processed",409);
  try{
   const gallery:{hotel_id:string;slot:number;image_url:string}[]=[];
   for(const photo of photos){
    const download=await db.storage.from(PRIVATE_BUCKET).download(photo.private_path);
    if(download.error||!download.data)throw new Error("Photo evidence unavailable");
    const bytes=Buffer.from(await download.data.arrayBuffer());
    if(!bytes.length||bytes.byteLength>2*1024*1024)throw new Error("Invalid review image");
    const publicPath=`hotels/${id}/${photo.slot}.webp`;
    const copied=await db.storage.from(PUBLIC_BUCKET).upload(publicPath,bytes,{
     contentType:"image/webp",cacheControl:"3600",upsert:true
    });
    if(copied.error)throw new Error("Reviewed photo publication unavailable");
    const imageUrl=db.storage.from(PUBLIC_BUCKET).getPublicUrl(publicPath).data.publicUrl;
    gallery.push({hotel_id:id,slot:photo.slot,image_url:imageUrl});
   }
   const website=row.website;
   const publicSource=website||siteUrl("/hotels/stay/"+id);
   // The hotel is inserted with invisible gates until both review and photo rows exist.
   const prepared=await db.from("hotels").upsert({
    id,name:row.hotel_name,city:row.city,image_url:gallery[0].image_url,
    source_name:"GTH PRO Reviewed Hotel Partner",source_url:publicSource,
    affiliate_link:null,is_public:false,media_rights_verified:false,
   },{onConflict:"id"});
   if(prepared.error)throw new Error("Partner publication failed");
   const galleryWrite=await db.from("hotel_partner_public_photos")
     .upsert(gallery,{onConflict:"hotel_id,slot"});
   if(galleryWrite.error)throw new Error("Reviewed photo gallery unavailable");
   const approved=await db.from("hotel_partner_submissions").update({
    status:"approved",published_hotel_id:id,reviewed_at:new Date().toISOString(),
    review_note:"Approved after business and media-rights review"
   }).eq("id",id).eq("status","reviewing").select("id").maybeSingle();
   if(approved.error||!approved.data)throw new Error("Hotel approval status unavailable");
   const exposed=await db.from("hotels").update({
    is_public:true,media_rights_verified:true
   }).eq("id",id);
   if(exposed.error)throw new Error("Public listing activation failed");
   return Response.json({review_status:"approved",published:true,hotel_id:id},{headers:HEADERS});
  }catch{
   // Fail closed. Human admins can retry a pending request; never expose incomplete media.
   await db.from("hotels").update({is_public:false,media_rights_verified:false}).eq("id",id);
   await db.from("hotel_partner_submissions").update({
    status:"pending",published_hotel_id:null,review_note:"Publication interrupted; review can be retried."
   }).eq("id",id).in("status",["reviewing","approved"]);
   throw new RequestError("Hotel publication failed safely. Please retry the review.",503);
  }
 }catch(error){return requestError(error);}
}
