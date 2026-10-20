import "server-only";
import { createClient } from "@supabase/supabase-js";
import { RequestError } from "@/lib/security/request";

/** Server-only service role; it must never be imported in client components or NEXT_PUBLIC_ variables. */
export function privateMediaStore(){
 const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new RequestError("Property media unavailable",503);
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
