import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(req:Request){
 try{
  const {client,user}=await authenticatedStorage(req);
  if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator review required",403);
  const body=await readJson(req,2048);
  const media=cleanString(body.media_id,{min:36,max:36,pattern:UUID});
  const action=cleanString(body.action,{min:7,max:9});
  const notes=cleanString(body.notes,{min:20,max:1000});
  if(!media||!action||!["publish","take_down"].includes(action)||!notes)
   throw new RequestError("Documented approval or takedown is required",400);
  const {data,error}=await client.rpc("manage_property_media_publication",
   {p_media:media,p_action:action,p_notes:notes});
  if(error||!data)throw new RequestError("Publication prerequisites not met",409);
  return Response.json({success:true,status:action==="publish"?"published":"taken_down"},
    {headers:{"Cache-Control":"no-store"}});
 }catch(error){return requestError(error)}
}
