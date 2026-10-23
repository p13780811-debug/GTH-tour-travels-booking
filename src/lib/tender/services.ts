/** Shared public service catalogue and bounded, versioned intake format. No secrets. */
export const TENDER_SERVICES = [
  {id:"eligibility_review",name:"Eligibility review",summary:"Review your business profile against a selected notice and identify missing qualification evidence.",deliverable:"A written eligibility checklist with questions to resolve against the official notice."},
  {id:"document_review",name:"Bid document review",summary:"Request a review of document completeness, response structure and submission requirements.",deliverable:"A document gap list and preparation checklist. Submission remains on the official portal."},
  {id:"gem_onboarding",name:"GeM onboarding guidance",summary:"Get guidance on India's Government e-Marketplace registration and catalogue preparation.",deliverable:"An onboarding plan for your business. You retain control of your account and credentials."},
  {id:"tender_monitoring",name:"Tender monitoring",summary:"Discuss recurring opportunity research for your country, sector and business capacity.",deliverable:"An agreed research scope and reporting schedule, confirmed in your quote."},
] as const;
export type TenderServiceId = typeof TENDER_SERVICES[number]["id"];
export const SERVICE_MESSAGE_PREFIX = "TENDER_SERVICE_REQUEST_V1\n";
export const SERVICE_UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type ServiceRequest = {
  request_id:string; service:TenderServiceId; contact_name:string; contact_email:string;
  organisation:string; phone:string; country:string; notes:string; tender_id:string|null;
};
export type ServiceContext = {service:TenderServiceId;phone:string;notes:string;tender_id:string|null;tender_title:string|null};
export type ServiceQueueItem = ServiceRequest & {status:"new"|"reviewing"|"closed";submitted_at:string;tender_title:string|null};
export function serviceChoice(value:unknown):TenderServiceId|null {
  return TENDER_SERVICES.find(service=>service.id===value)?.id??null;
}
function plain(value:unknown,min:number,max:number):string|null {
  if(typeof value!=="string")return null;
  const text=value.trim();
  return text.length>=min&&text.length<=max&&!/[\u0000-\u0008\u000b-\u001f\u007f<>]/.test(text)?text:null;
}
export function validateServiceRequest(body:Record<string,unknown>):
  {ok:true;value:ServiceRequest}|{ok:false;error:string} {
  const allowed=["request_id","service","contact_name","contact_email","organisation","phone","country","notes","tender_id","consent_to_contact","website_check"];
  if(Object.keys(body).some(key=>!allowed.includes(key))||body.website_check)
    return {ok:false,error:"Invalid service request. Refresh the page and retry."};
  const service=serviceChoice(body.service);
  const name=plain(body.contact_name,2,100),email=plain(body.contact_email,5,254)?.toLowerCase();
  const organisation=plain(body.organisation,2,160),country=plain(body.country,2,100);
  const phone=typeof body.phone==="string"?body.phone.replace(/[\s()-]/g,""):"";
  const notes=plain(body.notes,20,900);
  if(!service||!name||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!organisation||!country||!notes||
     !/^\+?[1-9]\d{7,14}$/.test(phone)||body.consent_to_contact!==true)
    return {ok:false,error:"Complete all fields, use a valid phone number (8–15 digits), and agree to be contacted."};
  if(typeof body.request_id!=="string"||!SERVICE_UUID.test(body.request_id)||
    (body.tender_id!==null&&body.tender_id!==undefined&&(typeof body.tender_id!=="string"||!SERVICE_UUID.test(body.tender_id))))
    return {ok:false,error:"Invalid request reference. Refresh the page and retry."};
  return {ok:true,value:{request_id:body.request_id.toLowerCase(),service,contact_name:name,contact_email:email,
    organisation,phone,country,notes,tender_id:typeof body.tender_id==="string"?body.tender_id.toLowerCase():null}};
}
export function serviceMessage(request:ServiceRequest,tenderTitle:string|null):string {
  const context:ServiceContext={service:request.service,phone:request.phone,notes:request.notes,
    tender_id:request.tender_id,tender_title:tenderTitle?.replace(/[\u0000-\u001f\u007f<>]/g," ").slice(0,240)??null};
  const message=SERVICE_MESSAGE_PREFIX+JSON.stringify(context);
  if(message.length>3000)throw new Error("Service request exceeds storage limit");
  return message;
}
export function parseServiceMessage(message:unknown):ServiceContext|null {
  if(typeof message!=="string"||message.length>3000||!message.startsWith(SERVICE_MESSAGE_PREFIX))return null;
  try {
    const context=JSON.parse(message.slice(SERVICE_MESSAGE_PREFIX.length));
    if(!context||!serviceChoice(context.service)||!plain(context.notes,20,900)||
      typeof context.phone!=="string"||!/^\+?[1-9]\d{7,14}$/.test(context.phone)||
      !(context.tender_id===null||typeof context.tender_id==="string"&&SERVICE_UUID.test(context.tender_id))||
      !(context.tender_title===null||!!plain(context.tender_title,1,240)))return null;
    return {service:context.service,phone:context.phone,notes:context.notes,tender_id:context.tender_id,tender_title:context.tender_title};
  }catch{return null;}
}
/** A collision never discloses whether another person's reference exists. */
export function sameServiceSubmission(existing:Record<string,unknown>,request:ServiceRequest):boolean {
  const context=parseServiceMessage(existing.message);
  return context!==null&&context.service===request.service&&context.phone===request.phone&&
    context.notes===request.notes&&context.tender_id===request.tender_id&& existing.application_type==="general"&&existing.contact_name===request.contact_name&&
    existing.contact_email===request.contact_email&&existing.organisation===request.organisation&&
    existing.country===request.country&&existing.consent_to_contact===true;
}
