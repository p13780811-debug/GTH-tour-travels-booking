import {authenticatedStorage} from "@/lib/security/auth";
import {hotelPartnerWriter} from "@/lib/hotels/partner-server";
import {validHotelBookingMapping} from "@/lib/travel/hotel-booking-links";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {readJson,RequestError,requestError} from "@/lib/security/request";
export const runtime="nodejs";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
async function requireAdmin(req:Request){
 const {user}=await authenticatedStorage(req);
 if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator permission required",403);
}
export async function GET(req:Request){
 try{
  await requireAdmin(req);
  const db=hotelPartnerWriter();
  const {data,error}=await db.from("hotel_booking_links")
   .select("id,catalog_source,catalog_source_id,reviewed_hotel_id,provider,provider_property_id,provider_property_url,affiliate_url,hotel_name_at_provider,active,verified_at,created_at")
   .eq("active",false).order("created_at",{ascending:true}).limit(40);
  if(error)throw new RequestError("Partner matching queue is unavailable",503);
  return Response.json(data||[],{headers:HEADERS});
 }catch(error){return requestError(error);}
}
export async function POST(req:Request){
 try{
  await requireAdmin(req);
  await enforceRateLimit(req,"submissions");
  const input=await readJson(req,1500);
  const id=input.id,action=input.action;
  if(typeof id!=="number"||!Number.isSafeInteger(id)||id<1||!["approve","disable"].includes(String(action)))
   throw new RequestError("Invalid booking-link review",400);
  const db=hotelPartnerWriter();
  const {data:row,error}=await db.from("hotel_booking_links")
   .select("id,catalog_source,catalog_source_id,reviewed_hotel_id,provider,provider_property_id,provider_property_url,affiliate_url,hotel_name_at_provider,active")
   .eq("id",id).maybeSingle();
  if(error||!row)throw new RequestError("Partner link record not found",404);
  if(action==="approve"){
   if(row.active)throw new RequestError("Already approved",409);
   if(input.exact_hotel_confirmed!==true||input.affiliate_program_confirmed!==true)
    throw new RequestError("Confirm exact supplier property ID and your active affiliate program before approval",400);
   if(!validHotelBookingMapping(row))
    throw new RequestError("Unusable partner deep link, property URL or supplier identity",400);
  }
  const update=action==="approve"
   ?{active:true,exact_property_verified:true,program_approved:true,verified_at:new Date().toISOString()}
   :{active:false,exact_property_verified:false,program_approved:false,verified_at:null};
  const {data:saved,error:saveError}=await db.from("hotel_booking_links")
   .update(update).eq("id",id).select("id,active").maybeSingle();
  if(saveError||!saved)throw new RequestError("Unable to save booking mapping review",503);
  return Response.json(saved,{headers:HEADERS});
 }catch(error){return requestError(error);}
}
