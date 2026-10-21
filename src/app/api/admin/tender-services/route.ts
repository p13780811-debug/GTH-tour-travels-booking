import { authenticatedStorage } from "@/lib/security/auth";
import { RequestError, requestError } from "@/lib/security/request";
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
      return context?[{...context,request_id:row.id,contact_name:row.contact_name,
        contact_email:row.contact_email,organisation:row.organisation,country:row.country,
        status:row.status,submitted_at:row.submitted_at}]:[];
    });
    return Response.json({items,total:count??0,page:Number(page)},{headers});
  }catch(error){return requestError(error);}
}
