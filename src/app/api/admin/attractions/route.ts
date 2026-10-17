import {createClient} from "@supabase/supabase-js";
import {authenticatedStorage} from "@/lib/security/auth";
import {enforceRateLimit} from "@/lib/security/rate-limit";
import {readJson,RequestError,requestError} from "@/lib/security/request";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
async function requireAdmin(req:Request){
 const {user}=await authenticatedStorage(req);
 if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator permission required",403);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))
  throw new RequestError("Review backend unavailable",503);
 return {user,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
export async function GET(req:Request){
 try{const {db}=await requireAdmin(req);
 const query=new URL(req.url).searchParams,p=Number(query.get("page")||"1");
 if(!Number.isInteger(p)||p<1||p>20||[...query.keys()].some(k=>k!=="page"))throw new RequestError("Invalid review page",400);
 const {data,error}=await db.from("gth_open_attractions").select("wikidata_qid,name,description,category,region_slug,latitude,longitude,wikidata_url,image_url,commons_page,image_author,image_license,image_license_url,is_public")
  .eq("is_public",false).order("name").range((p-1)*20,p*20-1);
 if(error)throw new RequestError("Review queue unavailable",503);
 return Response.json({items:data||[],page:p},{headers:HEADERS});
 }catch(e){return requestError(e);}
}
export async function POST(req:Request){
 try{
 const {user,db}=await requireAdmin(req);await enforceRateLimit(req,"submissions",user.id);
 const input=await readJson(req,1300),qid=input.wikidata_qid,action=input.action;
 if(typeof qid!=="string"||!/^Q[1-9][0-9]{0,14}$/.test(qid)||!["approve","hide"].includes(String(action)))
  throw new RequestError("Invalid source or action",400);
 if(action==="approve"&&input.source_verified!==true)throw new RequestError("Manual source and media-rights confirmation required",400);
 const {data,error}=await db.from("gth_open_attractions")
  .select("wikidata_qid,name,latitude,longitude,source_license,wikidata_url,image_url,commons_page,image_author,image_license,image_license_url")
  .eq("wikidata_qid",qid).maybeSingle();
 if(error||!data||data.source_license!=="CC0-1.0"||!data.name||
  !Number.isFinite(data.latitude)||!Number.isFinite(data.longitude)||
  data.wikidata_url!=="https://www.wikidata.org/wiki/"+qid)
  throw new RequestError("Unverified source identity",400);
 if(action==="approve"&&data.image_url&&!(data.commons_page&&data.image_author&&data.image_license&&data.image_license_url))
  throw new RequestError("Photo license/author not approved",400);
 const update=await db.from("gth_open_attractions").update({is_public:action==="approve"})
  .eq("wikidata_qid",qid).select("wikidata_qid,is_public").maybeSingle();
 if(update.error||!update.data)throw new RequestError("Publication review failed",503);
 return Response.json({id:qid,published:update.data.is_public},{headers:HEADERS});
 }catch(e){return requestError(e);}
}
