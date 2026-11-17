import {readJson,RequestError,requestError} from "@/lib/security/request";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {propertyLeadWriter} from "@/lib/real-estate/lead-server";
export const runtime="nodejs";
const allowed=new Set(["mmr","kolkata","dubai","london","global"]);
const currencies=new Set(["INR","USD","AED","GBP","EUR","SGD"]);
function field(value:unknown,max:number) {
 if(typeof value!=="string")return "";
 const s=value.normalize("NFKC").trim();
 return s.length<=max&&!/[<>\u0000-\u001f\u007f]/.test(s)?s:"";
}
export async function POST(req:Request) {
 try {
  const origin=req.headers.get("origin");
  if((origin&&origin!==new URL(req.url).origin)||req.headers.get("sec-fetch-site")==="cross-site")throw new RequestError("Invalid origin",403);
  const body=await readJson(req,4096);
  const name=field(body.full_name,150),email=field(body.email,150).toLowerCase(),phone=field(body.phone_e164,16);
  const corridor=field(body.corridor,30),currency=field(body.currency,3);
  const id=field(body.request_id,36);
  const propertyId=body.property_id==null?null:Number(body.property_id);
  if(Object.keys(body).some(k=>!["full_name","email","phone_e164","corridor","currency","request_id","property_id","consent_to_contact","website_check"].includes(k))||
   name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||
   !/^\+[1-9][0-9]{7,14}$/.test(phone)||!allowed.has(corridor)||!currencies.has(currency)||
   !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(id)||
   (propertyId!==null&&(!Number.isSafeInteger(propertyId)||propertyId<=0))||
   body.consent_to_contact!==true||body.website_check)throw new RequestError("Check contact details and consent.",400);
  await enforceRateLimit(req,"enquiries");
  const db=propertyLeadWriter();
  const {data,error}=await db.from("property_nri_inquiries").upsert({
   request_id:id,property_id:propertyId,full_name:name,email,phone_e164:phone,
   investor_corridor:corridor,investor_currency:currency,lead_priority:"NRI_HIGH_VALUE"
  },{onConflict:"request_id",ignoreDuplicates:true}).select("id").maybeSingle();
  if(error)throw new RequestError("Inquiry could not be saved. Please retry.",503);
  return Response.json({received:true,request_reference:id,created:Boolean(data)},{status:data?201:200,headers:{"Cache-Control":"no-store"}});
 }catch(e){return requestError(e instanceof RequestError?e:new RequestError("Inquiry unavailable",503));}
}
