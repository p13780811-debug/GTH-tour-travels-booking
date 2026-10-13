import { createClient } from "@supabase/supabase-js";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { cleanString } from "@/lib/security/validators";

const types = ["developer","agent","travel_supplier","affiliate","general"] as const;
const safeHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function optional(raw: unknown, max: number): string|null {
  if (raw === undefined || raw === null || raw === "") return null;
  return cleanString(raw, {min:1,max}) || null;
}
function safeExternal(raw: unknown): string|null {
  if(raw === undefined || raw === null || raw === "") return null;
  if(typeof raw!=="string" || raw.length>500)throw new RequestError("Invalid website URL",400);
  try{
    const u=new URL(raw);
    if(u.protocol!=="https:" || u.username || u.password || u.port || !u.hostname.includes(".") ||
      u.hostname.includes(":") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) ||
      u.hostname==="localhost" || u.hostname.endsWith(".localhost"))
      throw new Error("Unsafe URL");
    return u.toString();
  }catch{throw new RequestError("Use a valid public HTTPS website URL",400);}
}
function privateWriter() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new RequestError("Partner enquiries are not configured yet",503);
  const parsed=new URL(url);
  if(parsed.protocol!=="https:"||!parsed.hostname.endsWith(".supabase.co"))
    throw new RequestError("Partner enquiries are not configured yet",503);
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function POST(req:Request){
  try {
    const body=await readJson(req,7000);
    const type=body.application_type;
    const name=cleanString(body.contact_name,{min:2,max:100});
    const email=cleanString(body.contact_email,{min:5,max:254});
    const message=cleanString(body.message,{min:15,max:3000});
    if(!types.includes(type as (typeof types)[number])||!name||!email||
       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!message||body.consent_to_contact!==true)
       throw new RequestError("Complete the form and agree to be contacted",400);
    // A hidden honeypot blocks naive automated posting, but is not a substitute for Redis rate limiting.
    if(body.website_check)throw new RequestError("Invalid submission",400);
    const db=privateWriter();
    await enforceRateLimit(req,"enquiries");
    const {error}=await db.from("partner_applications").insert({
      application_type:type,contact_name:name,contact_email:email.toLowerCase(),
      organisation:optional(body.organisation,160),country:optional(body.country,100),
      website:safeExternal(body.website),project_url:safeExternal(body.project_url),
      message,consent_to_contact:true,status:"new",
    });
    if(error)throw new RequestError("Enquiry could not be saved. Please retry later.",503);
    return Response.json({received:true,review_status:"new",published:false},
      {status:201,headers:safeHeaders});
  }catch(e){return requestError(e);}
}
