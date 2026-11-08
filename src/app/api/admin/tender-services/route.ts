import {appendTenderCommercial,nextTenderCommercial,parseTenderCommercial} from "@/lib/tender/commercial";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import { authenticatedStorage } from "@/lib/security/auth";
import { RequestError, readJson, requestError } from "@/lib/security/request";
import { parseServiceMessage, SERVICE_MESSAGE_PREFIX } from "@/lib/tender/services";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
export async function GET(req:Request){
  try{
    const {client,user}=await authenticatedStorage(req);
    if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);
    const params=new URL(req.url).searchParams,status=params.get("status")??"new",page=params.get("page")??"1";
    if(!["new","reviewing","closed"].includes(status)||!/^([1-9]|[1-9]\d{1,3})$/.test(page))
      throw new RequestError("Invalid queue filter",400);
    const offset=(Number(page)-1)*20;
    const {data,error,count}=await client.from("partner_applications")
      .select("id,contact_name,contact_email,organisation,country,message,status,submitted_at",{count:"exact"})
      .eq("application_type","general").like("message",SERVICE_MESSAGE_PREFIX.replace(/_/g,"\\_")+"%")
      .eq("status",status).order("submitted_at",{ascending:false}).order("id",{ascending:false})
      .range(offset,offset+19);
    if(error?.code==="PGRST103")return Response.json({items:[],total:0,page:Number(page)},{headers});
    if(error)throw new RequestError("Service request queue is unavailable",503);
    const items=(data??[]).flatMap(row=>{
      const context=parseServiceMessage(row.message);
      let commercial=null,commercialInvalid=false;
      try{commercial=parseTenderCommercial(row.message);}catch{commercialInvalid=true;}
      return context?[{...context,request_id:row.id,contact_name:row.contact_name,
        contact_email:row.contact_email,organisation:row.organisation,country:row.country,
        commercial,commercialInvalid,status:row.status,submitted_at:row.submitted_at}]:[];
    });
    return Response.json({items,total:count??0,page:Number(page)},{headers});
  }catch(error){return requestError(error);}
}

export async function POST(req:Request){
 try{
  const {client,user}=await authenticatedStorage(req);
  if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);
  const body=await readJson(req,2000);
  if(typeof body.id!=="string"||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.id))throw new RequestError("Invalid request reference",400);
  await enforceRateLimit(req,"tender_operations",user.id);
  const previous=await client.from("partner_applications").select("id,message")
   .eq("id",body.id).eq("application_type","general").abortSignal(AbortSignal.timeout(8000)).maybeSingle();
  if(previous.error)throw new RequestError("Commercial log unavailable",503);
  if(!previous.data||!parseServiceMessage(previous.data.message))throw new RequestError("Tender service request not found",404);
  let commercial,message;
  try{commercial=nextTenderCommercial(body,parseTenderCommercial(previous.data.message),user.id);message=appendTenderCommercial(previous.data.message,commercial);}
  catch(error){throw new RequestError(error instanceof Error?error.message:"Invalid commercial event",409);}
  const {data,error}=await client.from("partner_applications").update({message,updated_at:commercial.updatedAt})
   .eq("id",body.id).eq("application_type","general").eq("message",previous.data.message)
   .select("id").abortSignal(AbortSignal.timeout(8000)).maybeSingle();
  if(error)throw new RequestError("Could not record the commercial event",503);
  if(!data)throw new RequestError("Another administrator changed this request. Reload before saving",409);
  return Response.json({commercial},{headers});
 }catch(error){return requestError(error);}
}
