import {authenticatedStorage} from "@/lib/security/auth";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {readJson,RequestError,requestError} from "@/lib/security/request";
import {validateHotelSubmission} from "@/lib/hotels/partner-validation";

const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request){
 try{
  const {client,user}=await authenticatedStorage(request);
  const {data,error}=await client.from("hotel_partner_submissions")
    .select("id,hotel_name,city,country_code,status,created_at,published_hotel_id")
    .eq("owner_id",user.id).order("created_at",{ascending:false}).limit(30);
  if(error)throw new RequestError("Your hotel submissions are not available right now",503);
  const ids=(data||[]).map(x=>x.id);
  const {data:photos,error:photoError}=ids.length
   ?await client.from("hotel_partner_photos").select("submission_id").in("submission_id",ids)
   :{data:[],error:null};
  if(photoError)throw new RequestError("Photo status is not available right now",503);
  const totals=new Map<string,number>();
  for(const photo of photos||[])totals.set(photo.submission_id,(totals.get(photo.submission_id)||0)+1);
  return Response.json((data||[]).map(row=>({...row,photo_count:totals.get(row.id)||0})),{headers:HEADERS});
 }catch(error){return requestError(error);}
}
export async function POST(request:Request){
 try{
  const {client,user}=await authenticatedStorage(request);
  if(!user.email||!user.email_confirmed_at)throw new RequestError("Verify your email before submitting",403);
  const body=await readJson(request,10500);
  const row=validateHotelSubmission(body,user.id,user.email.toLowerCase());
  await enforceRateLimit(request,"submissions",user.id);
  const {data,error}=await client.from("hotel_partner_submissions")
    .insert(row).select("id,status").single();
  if(error||!data)throw new RequestError("Hotel submission service is unavailable. Nothing was published.",503);
  return Response.json({id:data.id,status:data.status,published:false,next:"Add your own hotel photos, then wait for review."},{status:201,headers:HEADERS});
 }catch(error){return requestError(error);}
}
