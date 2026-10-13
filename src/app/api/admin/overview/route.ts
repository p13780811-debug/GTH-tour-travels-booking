import { authenticatedStorage } from "@/lib/security/auth";
import { RequestError, requestError } from "@/lib/security/request";
export const dynamic="force-dynamic";
export async function GET(req:Request){
  try{
    const {client,user}=await authenticatedStorage(req);
    if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);
    const resources=[
      ["partner_applications", "status", "new"],
      ["listing_submissions", "status", "review"],
      ["leads", null, null],
    ] as const;
    const counts=await Promise.all(resources.map(async ([table,key,value])=>{
      let query=client.from(table).select("id",{count:"exact",head:true});
      if(key&&value)query=query.eq(key,value);
      const {count,error}=await query;
      return {resource:table,accessible:!error,count:error?null:(count??0)};
    }));
    return Response.json({
      counts,
      services:{
        supabase:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        ai:Boolean(process.env.GEMINI_API_KEY),
        rate_limiting:Boolean(process.env.UPSTASH_REDIS_REST_URL&&process.env.UPSTASH_REDIS_REST_TOKEN),
        partner_inbox:Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        flight_source:Boolean(process.env.AVIASALES_API_TOKEN||process.env.TRAVELPAYOUTS_TOKEN||process.env.TRAVELPAYOUTS_API_TOKEN),
      },
      note:"Configuration indicators only. These are not external-provider uptime checks.",
      generated_at:new Date().toISOString()
    },{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch(e){return requestError(e);}
}
