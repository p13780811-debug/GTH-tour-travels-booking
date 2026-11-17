import {authenticatedStorage} from "@/lib/security/auth";
import {readJson,RequestError,requestError} from "@/lib/security/request";
import {propertyLeadWriter} from "@/lib/real-estate/lead-server";
import {ENQUIRY_STATUSES,validateEnquiryUpdate} from "@/lib/intelligence/enquiry-operations";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
async function admin(req:Request){const {user}=await authenticatedStorage(req);if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);return propertyLeadWriter();}
const columns="id,request_id,lead_kind,target_key,currency,full_name,email,phone_e164,contact_preference,requested_city,country_code,services,group_size,notes,tender_ids,status,operator_notes,next_follow_up_at,created_at,updated_at";
export async function GET(req:Request){try{
 const db=await admin(req),url=new URL(req.url),status=url.searchParams.get("status"),cursor=url.searchParams.get("before");
 if(status&&!ENQUIRY_STATUSES.includes(status as typeof ENQUIRY_STATUSES[number]))throw new RequestError("Invalid status",400);
 if(cursor&&!/^[1-9][0-9]{0,15}$/.test(cursor))throw new RequestError("Invalid cursor",400);
 let q=db.from("gth_intelligence_leads").select(columns).order("id",{ascending:false}).limit(100);if(status)q=q.eq("status",status);if(cursor)q=q.lt("id",cursor);
 const [{data,error},jobs]=await Promise.all([q.abortSignal(AbortSignal.timeout(5000)),db.from("gth_semantic_refresh_jobs").select("sector,last_success_at,last_status,saved,scanned").order("sector").abortSignal(AbortSignal.timeout(5000))]);
 if(error)throw new RequestError("Private enquiries unavailable",503);
 return Response.json({items:data??[],next_cursor:data?.length===100?data[99].id:null,refresh_jobs:jobs.error?null:jobs.data},{headers});
}catch(error){return requestError(error);}}
export async function PATCH(req:Request){try{
 if((req.headers.get("origin")&&req.headers.get("origin")!==new URL(req.url).origin)||req.headers.get("sec-fetch-site")==="cross-site")throw new RequestError("Use the private dashboard",403);
 const db=await admin(req);let input;try{input=validateEnquiryUpdate(await readJson(req,2600));}catch(error){if(error instanceof RequestError)throw error;throw new RequestError("Review status, notes and follow-up date.",400);}
 const updated_at=new Date(Math.max(Date.now(),Date.parse(input.expected_updated_at)+1)).toISOString();
 const {data,error}=await db.from("gth_intelligence_leads").update({status:input.status,operator_notes:input.operator_notes,next_follow_up_at:input.next_follow_up_at,updated_at}).eq("id",input.id).eq("updated_at",input.expected_updated_at).select(columns).maybeSingle();
 if(error)throw new RequestError("Enquiry update unavailable",503);if(!data)throw new RequestError("This enquiry changed. Refresh before editing it again.",409);return Response.json({item:data},{headers});
}catch(error){return requestError(error);}}
