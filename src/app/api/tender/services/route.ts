import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { getPublicTender } from "@/lib/tender/catalog";
import { serviceMessage, sameServiceSubmission, validateServiceRequest } from "@/lib/tender/services";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function privateWriter(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  let valid=false;
  try{const parsed=new URL(url??"");valid=parsed.protocol==="https:"&&parsed.hostname.endsWith(".supabase.co")&&!parsed.username&&!parsed.password&&!parsed.port;}catch{}
  if(!valid||!url||!key)throw new RequestError("Service requests are temporarily unavailable. Please retry later.",503);
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function POST(req:Request){
  try{
    const parsed=validateServiceRequest(await readJson(req,9000));
    if(!parsed.ok)throw new RequestError(parsed.error,400);
    const request=parsed.value;
    const db=privateWriter();
    await enforceRateLimit(req,"enquiries");
    const readPrevious=()=>db.from("partner_applications").select("application_type,contact_name,contact_email,organisation,country,message,consent_to_contact")
      .eq("id",request.request_id).maybeSingle();
    // A retry can arrive after the notice expires or its recorded title changes.
    // Compare the original buyer payload before resolving current catalogue data.
    const existing=await readPrevious();
    if(existing.error)throw new RequestError("Request could not be checked. Please retry later.",503);
    if(existing.data){
      if(!sameServiceSubmission(existing.data,request))throw new RequestError("Request could not be confirmed. Refresh the page before retrying.",409);
      return Response.json({received:true,reference:request.request_id},{headers});
    }
    let title:string|null=null;
    if(request.tender_id){
      const tender=await getPublicTender(request.tender_id);
      if(!tender.ok)throw new RequestError("Tender record could not be checked. Please retry later.",503);
      if(!tender.item)throw new RequestError("This tender is no longer available. Return to discovery or request a general service review.",409);
      title=tender.item.title;
    }
    const message=serviceMessage(request,title);
    const {error}=await db.from("partner_applications").insert({
      id:request.request_id,application_type:"general",contact_name:request.contact_name,
      contact_email:request.contact_email,organisation:request.organisation,country:request.country,
      message,consent_to_contact:true,status:"new",
    });
    if(error?.code==="23505"){
      const previous=await readPrevious();
      if(previous.error||!previous.data||!sameServiceSubmission(previous.data,request))
        throw new RequestError("Request could not be confirmed. Refresh the page before retrying.",409);
      return Response.json({received:true,reference:request.request_id},{headers});
    }
    if(error)throw new RequestError("Request could not be saved. Please retry with the same form.",503);
    return Response.json({received:true,reference:request.request_id},{status:201,headers});
  }catch(error){return requestError(error);}
}
