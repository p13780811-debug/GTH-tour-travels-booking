import { authenticatedStorage } from "@/lib/security/auth";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export async function GET(req: Request) {
 try { const { client } = await authenticatedStorage(req); const {data,error}=await client.from("listing_submissions").select("id,title,status,property_id,created_at").order("created_at",{ascending:false}).limit(50); if(error) throw new RequestError("Submission history unavailable",503); return Response.json(data||[],{headers:{"Cache-Control":"private, no-store"}}); } catch(error){return requestError(error)}
}
export async function POST(req: Request) {
 try {
  const {client,user}=await authenticatedStorage(req);
  const body=await readJson(req,12000);
  const payload: Record<string,string>={};
  for(const [key,min,max] of [["title",3,180],["country",2,80],["city",2,80],["location",2,250],["description",20,5000]] as const){ const value=cleanString(body[key],{min,max}); if(!value) throw new RequestError("Invalid listing details",400); payload[key]=value; }
  if(!["Apartment","Villa","Penthouse","Commercial","Plot"].includes(String(body.property_type)) || !["buy","rent"].includes(String(body.listing_type))) throw new RequestError("Invalid listing type",400);
  payload.property_type=String(body.property_type); payload.listing_type=String(body.listing_type);
  await enforceRateLimit(req,"submissions",user.id);
  const {error}=await client.from("listing_submissions").insert(payload);
  if(error) throw new RequestError("Submission service unavailable. No listing was published.",503);
  return Response.json({success:true,status:"review"},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){return requestError(error)}
}
