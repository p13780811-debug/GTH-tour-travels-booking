import { PropertyService } from "@/lib/real-estate/propertyService";
import { cleanSlug } from "@/lib/security/validators";
import { requestError } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { privateMediaStore } from "@/lib/property-media/media-private";
import { createDossierPdf } from "@/lib/real-estate/dossier-pdf";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const missing=()=>Response.json({error:"Dossier unavailable"},{status:404,headers:{"Cache-Control":"no-store"}});
type ApprovedImage={image:Buffer;attribution:string};
/** Never export an image just because it is visible online. Permission must explicitly cover redistribution. */
async function licensedImage(projectId:number):Promise<ApprovedImage|null>{
 try{
  const db=privateMediaStore();
  const result=await db.from("property_published_media")
   .select("id,claim_media_id,project_id,status,media_type,attribution,is_primary")
   .eq("project_id",projectId).eq("status","published").neq("media_type","floor_plan")
   .order("is_primary",{ascending:false}).limit(3);
  if(result.error||!result.data)return null;
  for(const item of result.data){
   if(!uuid.test(item.id)||!uuid.test(item.claim_media_id)||Number(item.project_id)!==projectId)continue;
   const permission=await db.rpc("is_property_media_public",{p_id:item.id});
   if(permission.error||permission.data!==true)continue;
   const lookup=await db.from("property_claim_media")
    .select("id,claim_id,project_id,object_key,status,license_basis,permission_reference,rights_attested")
    .eq("id",item.claim_media_id).single();
   const media=lookup.data;
   if(!media||media.status!=="approved"||media.rights_attested!==true||Number(media.project_id)!==projectId)continue;
   if(!/\b(pdf|dossier|download|redistribut(?:e|ion)|export)\b/i.test(String(media.permission_reference||"")))continue;
   if(!["creator","authorized_owner","documented_license"].includes(media.license_basis))continue;
   const claim=await db.from("property_project_claims").select("status,project_id").eq("id",media.claim_id).single();
   if(claim.data?.status!=="approved"||Number(claim.data.project_id)!==projectId)continue;
   if(!/^claims\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(media.object_key))continue;
   const downloaded=await db.storage.from("gth-re-claim-media").download(media.object_key);
   const file=downloaded.data;
   if(downloaded.error||!file||file.size===0||file.size>5*1024*1024)continue;
   const image=Buffer.from(await file.arrayBuffer());
   if(image.toString("ascii",0,4)!=="RIFF"||image.toString("ascii",8,12)!=="WEBP")continue;
   return {image,attribution:String(item.attribution||"").slice(0,160)};
  }
 }catch{/* Fail closed: render branded PDF without unapproved media. */}
 return null;
}
export async function GET(req:Request,{params}:{params:Promise<{slug:string}>}){
 const slug=cleanSlug((await params).slug);
 if(!slug)return missing();
 try{
  await enforceRateLimit(req,"images");
  const p=await PropertyService.getBySlug(slug);
  if(!p||!Number.isSafeInteger(Number(p.id))||Number(p.id)<=0)return missing();
  const licensed=await licensedImage(Number(p.id));
  const pdf=await createDossierPdf({
   title:String(p.title||"Property record").slice(0,160),
   location:[p.location,p.city,p.country].filter(v=>typeof v==="string"&&!/not provided/i.test(v)).join(" | ").slice(0,150)||"Not recorded",
   reference:String(p.rera_id||"").slice(0,120),
   source:String(p.official_source_url||"").slice(0,240),
   status:p.registry_only?"Registry project, not published unit inventory":p.verified?"GTH reviewed record":"Public record, verification pending",
   price:p.registry_only?"Current unit price not published":String(p.formatted_price||"Price on request").slice(0,80),
   date:new Date().toISOString().slice(0,10),
   attribution:licensed?.attribution||"",image:licensed?.image
  });
  return new Response(pdf.buffer as ArrayBuffer,{status:200,headers:{
   "Content-Type":"application/pdf",
   "Content-Disposition":'attachment; filename="gth-pro-'+slug+'-dossier.pdf"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
   "Content-Length":String(pdf.byteLength)
  }});
 }catch(error){return requestError(error)}
}
