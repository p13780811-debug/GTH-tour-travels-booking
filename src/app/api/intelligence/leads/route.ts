import {createHash} from "node:crypto";
import {readJson,RequestError,requestError} from "@/lib/security/request";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {propertyLeadWriter} from "@/lib/real-estate/lead-server";
import {validateIntelligenceLead,conciergeWhatsApp} from "@/lib/intelligence/contracts";
import {readInfraPulse,intelligencePublicDb} from "@/lib/intelligence/infraPulse";
import {resolveEventTarget} from "@/lib/intelligence/eventShockwave";
export const runtime="nodejs";
export async function POST(req:Request){
 try{
  const origin=req.headers.get("origin");if((origin&&origin!==new URL(req.url).origin)||req.headers.get("sec-fetch-site")==="cross-site")throw new RequestError("Use this site's enquiry form.",403);
  let input;try{input=validateIntelligenceLead(await readJson(req,6000));}catch(error){if(error instanceof RequestError)throw error;throw new RequestError("Review contact details and consent.",400);}
  await enforceRateLimit(req,"enquiries");
  const db=propertyLeadWriter(),fingerprint=createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const previous=await db.from("gth_intelligence_leads").select("payload_hash,whatsapp_message").eq("request_id",input.requestId).maybeSingle();
  if(previous.error)throw new RequestError("Enquiries temporarily unavailable.",503);
  if(previous.data){if(previous.data.payload_hash!==fingerprint)throw new RequestError("This reference belongs to a different enquiry. Refresh before retrying.",409);return Response.json({received:true,reference:input.requestId,whatsapp_url:conciergeWhatsApp(process.env.GTH_BUSINESS_WHATSAPP_NUMBER,previous.data.whatsapp_message)},{headers:{"Cache-Control":"no-store"}});}
  let targetKey:string,title:string,tenderIds:string[]=[];
  if(input.kind==="infra"){
   const publicDb=intelligencePublicDb();if(!publicDb)throw new RequestError("Project lookup unavailable.",503);
   const {data,error}=await publicDb.from("properties").select("id,title,status").eq("id",input.propertyId).limit(1).abortSignal(AbortSignal.timeout(5000));
   if(error)throw new RequestError("Project lookup unavailable.",503);if(!data?.[0]||data[0].status==="archived")throw new RequestError("Project unavailable.",404);
   const pulse=(await readInfraPulse([input.propertyId!]))[input.propertyId!];if(!pulse)throw new RequestError("No current regional infrastructure matches are available for this project.",409);
   title=data[0].title;targetKey="property:"+input.propertyId;tenderIds=pulse.notices.map(n=>n.id);
  }else if(input.kind==="requirement"){
 title=input.topic!.replaceAll("_"," ");targetKey="requirement:"+input.topic;
 }else{
   const venue=await resolveEventTarget(input.target!);if(!venue)throw new RequestError("Venue unavailable.",404);title=venue.name;targetKey=venue.key;
  }
  const message="GTH PRO "+(input.kind==="infra"?"Infra-Backed Investor Dossier":input.kind==="requirement"?"Research Requirement":"VIP Hospitality & Group Charter")+" enquiry. Reference: "+input.requestId+". Target: "+targetKey+" ("+String(title).slice(0,150)+"). Currency: "+input.currency+". Regional Tender IDs: "+(tenderIds.join(", ")||"not applicable")+". Services: "+input.services.join(", ")+". Please confirm source records and supplier availability.";
  const {error}=await db.from("gth_intelligence_leads").insert({request_id:input.requestId,payload_hash:fingerprint,lead_kind:input.kind,target_key:targetKey,property_id:input.propertyId,currency:input.currency,full_name:input.fullName,email:input.email,phone_e164:input.phone,contact_preference:input.contactPreference,requested_city:input.city,country_code:input.country,services:input.services,group_size:input.groupSize,notes:input.notes,tender_ids:tenderIds,whatsapp_message:message});
  if(error?.code==="23505")throw new RequestError("Your request may already be saved. Retry this same form to confirm.",409);
  if(error)throw new RequestError("Enquiry could not be saved. Retry this same form.",503);
  return Response.json({received:true,reference:input.requestId,whatsapp_url:conciergeWhatsApp(process.env.GTH_BUSINESS_WHATSAPP_NUMBER,message)},{status:201,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 }catch(error){return requestError(error instanceof RequestError?error:new RequestError("Enquiries temporarily unavailable.",503));}
}
