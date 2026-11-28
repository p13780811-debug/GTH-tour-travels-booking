import { enforceRateLimit } from "@/lib/security/rate-limit";
import { readJson, RequestError, requestError } from "@/lib/security/request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECTORS = new Set(["property","tender","attraction","hotel_directory"]);
const noCache = {"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
/**
 * Server-only semantic inference gateway. Production AI never reaches a
 * browser-accessible service key. Redis rate limits must succeed before model
 * inference: no anonymous quota bypass or paid third-party APIs.
 */
export async function POST(req:Request):Promise<Response>{
 try{
  const origin=new URL(req.url).origin;
  if((req.headers.get("origin")&&req.headers.get("origin")!==origin)||
    req.headers.get("sec-fetch-site")==="cross-site")throw new RequestError("Cross-origin request rejected",403);
  const body=await readJson(req,1000);
  const query=typeof body.query==="string"?body.query.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/g," ").replace(/\s+/g," ").trim():"";
  const country=typeof body.country==="string"?body.country.toUpperCase():"";
  const sector=typeof body.sector==="string"?body.sector:"";
  if(query.length<3||query.length>160||(country&&!/^[A-Z]{2}$/.test(country))||
     (sector&&!SECTORS.has(sector)))throw new RequestError("Invalid semantic query",400);
  await enforceRateLimit(req,"ai");
  const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!endpoint||!key)throw new RequestError("AI search is not configured",503);
  const root=new URL(endpoint);
  if(root.protocol!=="https:"||!root.hostname.endsWith(".supabase.co")||
    root.port||root.username||root.password||root.search||root.hash)throw new RequestError("AI search is not configured",503);
  const target=new URL("/functions/v1/gth-semantic-intelligence",root);
  let result:Response;
  try{
   result=await fetch(target,{method:"POST",cache:"no-store",redirect:"manual",
     headers:{"Content-Type":"application/json","Authorization":"Bearer "+key,"apikey":key},
     body:JSON.stringify({operation:"search",query,country,sector}),signal:AbortSignal.timeout(20000)});
  }catch{throw new RequestError("AI search temporarily unavailable",503);}
  if(!result.ok)throw new RequestError("AI search temporarily unavailable",503);
  const parsed:unknown=await result.json().catch(()=>null);
  if(!parsed||typeof parsed!=="object"||!Array.isArray((parsed as {results?:unknown}).results))
    throw new RequestError("AI search temporarily unavailable",503);
  const values=((parsed as {results:unknown[]}).results).slice(0,6).flatMap(raw=>{
    if(!raw||typeof raw!=="object")return [];
    const r=raw as Record<string,unknown>;
    const href=typeof r.canonical_path==="string"?r.canonical_path:"";
    if(!/^\/(real-estate|tender|attractions|hotels)\/[A-Za-z0-9/_:-]{1,180}$/.test(href))return [];
    const title=typeof r.title==="string"?r.title.slice(0,220):"";
    const summary=typeof r.excerpt==="string"?r.excerpt.slice(0,500):"";
    const country=typeof r.country_code==="string"?r.country_code:"";
    const sim=Number(r.similarity);
    if(!title||!summary||!/^[A-Z]{2}$/.test(country)||!Number.isFinite(sim)||sim<0.35||sim>1)return [];
    return [{title,summary,href,country,city:typeof r.city==="string"?r.city.slice(0,100):"",
      sector:typeof r.sector==="string"?r.sector:"source",similarity:sim,
      source:typeof r.source_url==="string"&&r.source_url.startsWith("https://")?r.source_url:""}];
  });
  return Response.json({model:"gte-small",indexed:values.length>0,results:values},{headers:noCache});
 }catch(error){return requestError(error);}
}
