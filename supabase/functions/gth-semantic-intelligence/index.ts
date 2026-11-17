import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.10";

/**
 * GTH PRO native semantic inference: no external AI API, no user PII, no
 * bulk 175k-record backfill. Invocations require the project's service JWT
 * (injected server-side only). Source mapping is allowlisted and revalidated
 * before every individual, bounded upsert. No changes to existing source RLS.
 */
type Sector = "property"|"tender"|"attraction"|"hotel_directory";
type Source = {sector:Sector;source_ref:string;title:string;excerpt:string;
 country_code:string;city:string|null;canonical_path:string;source_url:string;
 source_deadline_at:string|null;expires_at:string};
const SECTORS = new Set<Sector>(["property","tender","attraction","hotel_directory"]);
const BATCH_MAX = 3;
const MODEL = new Supabase.ai.Session("gte-small");
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
function safeUrl(value:unknown,osm=false):string|null {
 if(typeof value!=="string"||value.length>1024)return null;
 try { const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash||!u.hostname.includes(".")
    ||/^(localhost|127\\.|10\\.|192\\.168\\.)/.test(u.hostname))return null;
  if(osm&&u.hostname!=="www.openstreetmap.org")return null;
  return u.href;
 }catch{return null;}
}
function clean(value:unknown,max:number):string {
 return typeof value==="string"?value.normalize("NFKC").replace(/[\\u0000-\\u001f\\u007f<>]/g," ").replace(/\\s+/g," ").trim().slice(0,max):"";
}
function sourceFromRow(sector:Sector,r:Record<string,unknown>):Source|null {
 const title=clean(sector==="hotel_directory"?r.name:r.title??r.name,180);
 const country=clean(sector==="property"?"IN":r.country_code,2).toUpperCase();
 const city=clean(r.city??r.region,100)||null;
 const id=clean(sector==="property"?String(r.id??""):sector==="tender"?r.id:r.source_id,150);
 const path = sector==="property"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(r.slug??""))
   ? "/real-estate/"+r.slug :
   sector==="tender"&&/^[a-f0-9-]{36}$/i.test(id) ? "/tender/"+id :
   /^(node|way|relation)\\/[1-9][0-9]{0,18}$/.test(id) ?
     (sector==="attraction"?"/attractions/osm/":"/hotels/stay/osm:")+id.replace("/","-") : "";
 const osm=sector==="attraction"||sector==="hotel_directory";
 const sourceUrl=safeUrl(sector==="property"?r.official_source_url:r.source_url,osm);
 if(title.length<3||!id||!sourceUrl||!path||!/^[A-Z]{2}$/.test(country)||
    !/[A-Za-z]{3}/.test(title))return null;
 let deadline:string|null=null;
 if(sector==="tender"){
  if(r.is_public!==true||r.source_verified!==true||r.status!=="published")return null;
  const raw=clean(r.deadline_at,40);
  if(!raw||!Number.isFinite(Date.parse(raw))||Date.parse(raw)<Date.now()+3600000)return null;
  deadline=new Date(raw).toISOString();
 }else if(sector==="property"){
  // A recorded regulator link alone does NOT imply source verification.
  if(r.verified!==true||!clean(r.official_source_reference,90))return null;
 }else {
  if(osm&&r.source_license!=="ODbL-1.0")return null;
  if(sector==="attraction"&&r.is_public!==true)return null;
  if(sourceUrl!=="https://www.openstreetmap.org/"+id)return null;
 }
 const excerpt=sector==="tender"?"Published public procurement notice: "+title+". "+(city??country)+". Check issuing authority and closing date.":
  sector==="property"?"Verified registry project "+title+". Registration "+clean(r.official_source_reference,90)+". "+(city??"India")+". Not an offer for sale.":
  sector==="attraction"?"Mapped attraction "+title+". "+(city??country)+". OpenStreetMap directory location; no ticket inventory.":
  "Mapped accommodation "+title+". "+(city??country)+". OpenStreetMap directory; confirm hotel with booking provider.";
 if(path.length>190||excerpt.length<8||excerpt.length>1200)return null;
 const maxExpiry=Date.now()+(sector==="tender"?86400000:7*86400000);
 const expiry=deadline?Math.min(maxExpiry,Date.parse(deadline)):maxExpiry;
 return {sector,source_ref:id,title,excerpt,country_code:country,city,canonical_path:path,source_url:sourceUrl,source_deadline_at:deadline,
  expires_at:new Date(expiry).toISOString()};
}
async function embed(text:string):Promise<number[]> {
 const raw=await MODEL.run(text.slice(0,700),{mean_pool:true,normalize:true});
 if(!Array.isArray(raw)||raw.length!==384||!raw.every(x=>typeof x==="number"&&Number.isFinite(x))){
  throw new Error("Embedding model unavailable or unexpected dimensions");
 }
 return raw as number[];
}
async function main(req:Request):Promise<Response>{
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 if(!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")||
   Number(req.headers.get("content-length")??0)>2000)return json({error:"Invalid request"},400);
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const endpoint=Deno.env.get("SUPABASE_URL");
 // This service-role JWT is never embedded in a public widget or returned.
 if(!service||!endpoint||req.headers.get("authorization")!=="Bearer "+service)return json({error:"Forbidden"},403);
 let input:Record<string,unknown>;
 try { const body=await req.text();if(body.length>2000)throw Error(); const parsed=JSON.parse(body);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error();input=parsed;
 }catch{return json({error:"Invalid request body"},400);}
 const db=createClient(endpoint,service,{auth:{persistSession:false,autoRefreshToken:false}});
 if(input.operation==="search"){
  const query=clean(input.query,160);
  const country=clean(input.country,2).toUpperCase();
  const sector=clean(input.sector,30);
  if(query.length<3||query.length>160||(country&&!/^[A-Z]{2}$/.test(country))||
    (sector&&!SECTORS.has(sector as Sector)))return json({error:"Invalid search filters"},400);
  const vector=await embed(query);
  const {data,error}=await db.rpc("gth_semantic_match",{
   p_embedding:"["+vector.join(",")+"]",p_country:country||null,p_sector:sector||null,p_limit:6,
  });
  if(error)return json({error:"Semantic index temporarily unavailable"},503);
  const results=(Array.isArray(data)?data:[]).filter(r=>
   r&&typeof r.canonical_path==="string"&&/^\\/(real-estate|tender|attractions|hotels)\\/[\\w/:-]+$/.test(r.canonical_path)
   &&typeof r.similarity==="number"&&r.similarity>=0.35).slice(0,6);
  return json({model:"gte-small",indexed:results.length>0,results});
 }
 if(input.operation!=="index")return json({error:"Unknown operation"},400);
 const sector=clean(input.sector,30) as Sector;
 const offset=input.offset===undefined?0:Number(input.offset);
 if(!SECTORS.has(sector)||!Number.isSafeInteger(offset)||offset<0||offset>1000)return json({error:"Invalid indexing scope"},400);
 const select=sector==="tender"?"id,title,region,country_code,status,is_public,source_verified,source_reference,source_url,deadline_at":
  sector==="property"?"id,title,slug,city,verified,official_source_reference,official_source_url":
  sector==="attraction"?"source_id,name,city,country_code,source_license,source_url,is_public":
  "source_id,name,city,country_code,source_license,source_url,source";
 const table=sector==="property"?"properties":sector==="tender"?"tenders":sector==="attraction"?"gth_osm_attractions":"hotel_catalog";
 let q=db.from(table).select(select);
 if(sector==="tender")q=q.eq("is_public",true).eq("source_verified",true).eq("status","published")
  .gt("deadline_at",new Date(Date.now()+3600000).toISOString()).order("deadline_at",{ascending:true});
 else if(sector==="property")q=q.eq("verified",true).not("official_source_url","is",null).order("id",{ascending:true});
 else if(sector==="attraction")q=q.eq("is_public",true).eq("source_license","ODbL-1.0").not("country_code","is",null).order("source_id",{ascending:true});
 else q=q.eq("source","osm").eq("source_license","ODbL-1.0").not("country_code","is",null).order("source_id",{ascending:true});
 const {data,error}=await q.range(offset,offset+11);
 if(error)return json({error:"Source lookup unavailable"},503);
 const sources=(data??[]).map(r=>sourceFromRow(sector,r as Record<string,unknown>)).filter((r):r is Source=>r!==null).slice(0,BATCH_MAX);
 let saved=0,unchanged=0;
 for(const source of sources){
  const {data:current,error:lookupError}=await db.from("gth_semantic_public_records")
   .select("source_ref,expires_at").eq("sector",source.sector).eq("source_ref",source.source_ref).maybeSingle();
  if(lookupError)return json({error:"Index lookup unavailable",saved},503);
  if(current&&Date.parse(current.expires_at)>Date.now()+86400000){unchanged++;continue;}
  const embedding=await embed([source.title,source.excerpt,source.city||source.country_code].join(" "));
  const {error:saveError}=await db.from("gth_semantic_public_records").upsert({
   ...source,embedding:"["+embedding.join(",")+"]",model:"gte-small",source_verified:true,is_public:true,indexed_at:new Date().toISOString(),
  },{onConflict:"sector,source_ref"});
  if(saveError)return json({error:"Index write unavailable",saved},503);
  saved++;
 }
 return json({model:"gte-small",sector,scanned:(data??[]).length,eligible:sources.length,saved,unchanged,limit:BATCH_MAX,nextOffset:offset+12});
}
Deno.serve(req=>main(req).catch(()=>json({error:"AI inference temporarily unavailable"},503)));
