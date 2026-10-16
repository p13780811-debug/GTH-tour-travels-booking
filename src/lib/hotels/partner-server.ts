import {createClient} from "@supabase/supabase-js";
import {RequestError} from "@/lib/security/request";
export const PRIVATE_BUCKET="hotel-partner-private";
export const PUBLIC_BUCKET="hotel-partner-public";
/** Only call this server-side, after a verified user's token or admin role. */
export function hotelPartnerWriter(){
 const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!endpoint||!key)throw new RequestError("Hotel partner review is not configured",503);
 const url=new URL(endpoint);
 if(url.protocol!=="https:"||!url.hostname.endsWith(".supabase.co")||
   url.username||url.password||url.port||url.search||url.hash)
   throw new RequestError("Hotel partner review is not configured",503);
 return createClient(endpoint,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
