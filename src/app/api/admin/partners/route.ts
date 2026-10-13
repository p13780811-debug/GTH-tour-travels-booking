import { authenticatedStorage } from "@/lib/security/auth";
import { RequestError, readJson, requestError } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/security/rate-limit";
const heads={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
async function admin(req:Request){
  const {client,user}=await authenticatedStorage(req);
  if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);
  return {client,user};
}
export async function GET(req:Request){
  try{
    const {client}=await admin(req);
    const {data,error}=await client.from("partner_applications")
      .select("id,application_type,contact_name,contact_email,organisation,website,project_url,country,message,status,submitted_at")
      .order("submitted_at",{ascending:false}).limit(100);
    if(error)throw new RequestError("Partner review queue unavailable",503);
    return Response.json({items:data||[]},{headers:heads});
  }catch(e){return requestError(e);}
}
export async function POST(req:Request){
  try{
    const {client,user}=await admin(req);
    const body=await readJson(req,1500);
    const id=body.id,status=body.status;
    if(typeof id!=="string"||!/^[a-f0-9]{8}-[a-f0-9-]{27,36}$/i.test(id)||
      (status!=="reviewing"&&status!=="closed"))
      throw new RequestError("Invalid partner review",400);
    await enforceRateLimit(req,"submissions",user.id);
    const {data,error}=await client.from("partner_applications")
      .update({status,updated_at:new Date().toISOString()}).eq("id",id)
      .select("id,status").maybeSingle();
    if(error||!data)throw new RequestError("Could not update application",409);
    return Response.json({item:data},{headers:heads});
  }catch(e){return requestError(e);}
}
