import { authenticatedStorage } from "@/lib/security/auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, RequestError, requestError } from "@/lib/security/request";
import { configuredMediaFeeds, validateMediaCandidate } from "@/lib/property-media/media-feed";

export const runtime="nodejs";
export async function POST(req:Request){
 try{
  const {client,user}=await authenticatedStorage(req);
  if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);
  await enforceRateLimit(req,"submissions",user.id);
  const body=await readJson(req,32768);
  const source=typeof body.source_key==="string"?body.source_key:"";
  const contract=configuredMediaFeeds().find(item=>item.key===source);
  if(!contract)throw new RequestError("No authorized media source contract is configured",403);
  if(!Array.isArray(body.items)||body.items.length<1||body.items.length>10)
   throw new RequestError("Between one and ten candidate references required",400);
  const items=body.items.map(value=>validateMediaCandidate(value,contract));
  if(items.some(item=>!item))throw new RequestError("Invalid project, rights or source URL evidence",400);
  const checked=items.filter((x):x is NonNullable<typeof x>=>Boolean(x));
  if(new Set(checked.map(i=>i.external_reference)).size!==checked.length)
   throw new RequestError("Duplicate supplier references in batch",409);
  const ids=checked.map(item=>item.rera_reference);
  const {data:projects,error}=await client.from("properties").select("id,rera_id")
   .eq("source_type","registry").in("rera_id",ids).limit(20);
  if(error)throw new RequestError("Registry lookup unavailable",503);
  const matches=new Map<string,number>();
  for(const p of projects||[]){
   if(matches.has(p.rera_id))throw new RequestError("Ambiguous registry identity",422);
   matches.set(p.rera_id,Number(p.id));
  }
  if(checked.some(i=>!matches.has(i.rera_reference)))
   throw new RequestError("Exact registry identity required",422);
  const rows=checked.map(item=>({
   ...item,source_key:contract.key,agreement_reference:contract.agreementReference,
   rights_basis:contract.rightsBasis,project_id:matches.get(item.rera_reference),
   match_method:"rera_exact",status:"pending"
  }));
  const insert=await client.from("property_media_candidates").insert(rows).select("id");
  if(insert.error)throw new RequestError("Candidate review intake unavailable or already submitted",409);
  return Response.json({queued:insert.data?.length||0,publication:false,
   message:"Metadata candidates queued privately. No image has been downloaded or published."},
   {status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){return requestError(error);}
}
export async function GET(req:Request){
 try{
  const {client,user}=await authenticatedStorage(req);
  if(user.app_metadata?.role!=="admin")throw new RequestError("Administrator access required",403);
  const {data,error}=await client.from("property_media_candidates")
    .select("id,project_id,rera_reference,source_key,external_reference,source_url,media_type,rights_basis,agreement_reference,permission_reference,attribution,status,created_at")
    .eq("status","pending").order("created_at",{ascending:false}).limit(50);
  if(error)throw new RequestError("Candidate queue unavailable",503);
  return Response.json(data||[],{headers:{"Cache-Control":"private,no-store"}});
 }catch(error){return requestError(error);}
}
