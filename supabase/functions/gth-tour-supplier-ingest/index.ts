/** GTH WeGoTrip affiliate catalogue: GitHub Actions OIDC RS256, exact workflow/ref only.
 * Source candidate original media verified by the signed upstream job; no scraping,
 * no user input, no legacy Tours publication flag updates.
 */
import {createRemoteJWKSet,jwtVerify} from "npm:jose@5.9.6";
const REPO="p13780811-debug/GTH-tour-travels-booking";
const WF=REPO+"/.github/workflows/gth-india-tour-inventory.yml@refs/heads/main";
const AUD="gth-tours-inventory:dqprqjmhxjnrllczqyhz";
const HOST="https://dqprqjmhxjnrllczqyhz.supabase.co";
const JWKS=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
 {timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000});
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const COLS=new Set(["provider","provider_product_id","title","country_code","country_name",
 "city_id","city_name","city_slug","product_slug","product_type","source_url","image_url",
 "currency","price_numeric","source_verified","image_verified","available","last_verified_at"]);
function verifyRow(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid row");
 const r=value as Record<string,unknown>;
 if(Object.keys(r).some(k=>!COLS.has(k))||Object.keys(r).length!==COLS.size)
   throw Error("Unknown or missing supplier fields");
 const id=r.provider_product_id,city=r.city_id,citySlug=r.city_slug,slug=r.product_slug;
 if(r.provider!=="wegotrip"||typeof id!=="string"||!/^[1-9]\d{0,17}$/.test(id)||
 typeof city!=="number"||!Number.isSafeInteger(city)||city<=0||
 typeof citySlug!=="string"||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(citySlug)||
 typeof slug!=="string"||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||
 typeof r.title!=="string"||r.title.length<3||r.title.length>240||
 /[\u0000-\u001f<>]/.test(r.title)||
 typeof r.country_code!=="string"||!/^[A-Z]{2}$/.test(r.country_code)||
 typeof r.country_name!=="string"||r.country_name.length<2||r.country_name.length>120||
 typeof r.city_name!=="string"||r.city_name.length<2||r.city_name.length>120||
 /[\u0000-\u001f<>]/.test(r.country_name)||/[\u0000-\u001f<>]/.test(r.city_name)||
 ![1,2,3].includes(Number(r.product_type))||typeof r.product_type!=="number"||
 r.source_verified!==true||r.image_verified!==true||r.available!==true||
 typeof r.currency!=="string"||!/^[A-Z]{3}$/.test(r.currency)||
 (r.price_numeric!==null&&(typeof r.price_numeric!=="number"||!Number.isFinite(r.price_numeric)||r.price_numeric<=0))||
 typeof r.last_verified_at!=="string")throw Error("Unverified product facts");
 const checked=Date.parse(r.last_verified_at);
 if(!Number.isFinite(checked)||checked>Date.now()+120000||Date.now()-checked>3*3600000)
   throw Error("Untrusted freshness");
 try{
  const source=new URL(String(r.source_url)), image=new URL(String(r.image_url));
  const expected="/"+citySlug+"-d"+city+"/"+slug+"-p"+id+"/";
  if(source.protocol!=="https:"||!["wegotrip.com","www.wegotrip.com"].includes(source.hostname)||
    source.pathname!==expected||source.search||source.hash||source.username||source.password||source.port||
    image.protocol!=="https:"||!["wgt-prod-storage.s3.amazonaws.com","app.wegotrip.com"].includes(image.hostname)||
    !/^\/media\/[^?#]+\.(?:jpe?g|png|webp)$/i.test(image.pathname)||
    image.search||image.hash||image.username||image.password||image.port)
    throw Error("Unapproved supplier origin");
 }catch{throw Error("Invalid provider product identity or photo URL");}
 return r;
}
async function authorise(req:Request){
 const auth=req.headers.get("authorization")||"";
 if(!auth.startsWith("Bearer ")||auth.length>6000)throw Error("Missing signed workflow identity");
 const {payload,protectedHeader}=await jwtVerify(auth.slice(7),JWKS,{
  issuer:"https://token.actions.githubusercontent.com",audience:AUD,
  algorithms:["RS256"],clockTolerance:"5s"});
 if(protectedHeader.alg!=="RS256"||payload.repository!==REPO||
  String(payload.repository_id)!=="1169920747"||
  payload.ref!=="refs/heads/main"||payload.workflow_ref!==WF||
  payload.sub!=="repo:"+REPO+":ref:refs/heads/main"||
  !["push","schedule","workflow_dispatch"].includes(String(payload.event_name)))
    throw Error("Untrusted workflow");
}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:HEADERS});
 try{await authorise(req);}catch{return Response.json({error:"Unauthorized workflow"},{status:401,headers:HEADERS});}
 try{
  const raw=await req.text();
  if(raw.length>70000)throw Error("Oversize supplier batch");
  const body:unknown=JSON.parse(raw);
  if(!body||typeof body!=="object"||Array.isArray(body)||Object.keys(body).join(",")!=="rows")
    throw Error("Invalid supplier payload");
  const rows=(body as {rows:unknown}).rows;
  if(!Array.isArray(rows)||rows.length<1||rows.length>30)
    throw Error("Invalid supplier batch");
  const verified=rows.map(verifyRow);
  if(new Set(verified.map(row=>row.provider_product_id)).size!==verified.length)
    throw Error("Duplicate supplier IDs");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!key||Deno.env.get("SUPABASE_URL")!==HOST)
    return Response.json({error:"DB service unavailable"},{status:503,headers:HEADERS});
  const target=HOST+"/rest/v1/tour_supplier_products?on_conflict=provider,provider_product_id";
  const result=await fetch(target,{method:"POST",headers:{
   apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",
   Prefer:"resolution=merge-duplicates,return=minimal"},
   body:JSON.stringify(verified),signal:AbortSignal.timeout(20000)});
  if(!result.ok)return Response.json({error:"Supplier DB write unavailable"},{status:502,headers:HEADERS});
  return Response.json({accepted:verified.length},{headers:HEADERS});
 }catch{return Response.json({error:"Rejected unverified supplier inventory"},{status:400,headers:HEADERS});}
});
