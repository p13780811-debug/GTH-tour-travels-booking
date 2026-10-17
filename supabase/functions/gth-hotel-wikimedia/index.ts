/**
 * GTH PRO Commons media overlay ingestion.
 * GitHub Actions OIDC (signed RS256, bound to main & exact OSM sync workflow).
 * No client, service-role, Wikidata or Wikimedia API credentials in GitHub.
 */
import {createRemoteJWKSet,jwtVerify} from "npm:jose@5.9.6";
const REPO="p13780811-debug/GTH-tour-travels-booking";
const WORKFLOW=REPO+"/.github/workflows/gth-osm-bulk-hotels.yml@refs/heads/main";
const AUDIENCE="gth-hotel-wikimedia:dqprqjmhxjnrllczqyhz";
const ORIGIN="https://dqprqjmhxjnrllczqyhz.supabase.co";
const JWKS=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),{
 timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000
});
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
function obj(x:unknown):x is Record<string,unknown>{return !!x&&typeof x==="object"&&!Array.isArray(x);}
function txt(x:unknown,max:number):string{
 if(typeof x!=="string"||!x.trim()||x.length>max||/[\u0000-\u001f<>]/.test(x))throw Error("Invalid text");
 return x.trim();
}
function url(x:unknown,max:number):URL{
 const u=new URL(txt(x,max));
 if(u.protocol!=="https:"||u.username||u.password||u.port||u.search||u.hash)throw Error("Invalid URL");
 return u;
}
const LICENSES=new Map([
 ["CC BY 4.0","https://creativecommons.org/licenses/by/4.0/"],
 ["CC BY-SA 4.0","https://creativecommons.org/licenses/by-sa/4.0/"],
 ["CC BY 3.0","https://creativecommons.org/licenses/by/3.0/"],
 ["CC BY-SA 3.0","https://creativecommons.org/licenses/by-sa/3.0/"],
 ["CC0","https://creativecommons.org/publicdomain/zero/1.0/"],
 ["Public domain","https://creativecommons.org/publicdomain/mark/1.0/"]
]);
function validated(record:unknown){
 if(!obj(record)||Object.keys(record).some(k=>![
  "source","source_id","wikidata_qid","image_url","commons_page","author","license_name","license_url"
 ].includes(k)))throw Error("Unexpected fields");
 const source=txt(record.source,10),sourceId=txt(record.source_id,100);
 const qid=txt(record.wikidata_qid,20),photo=url(record.image_url,1300),page=url(record.commons_page,600);
 const author=txt(record.author,400),license=txt(record.license_name,80),licenseUrl=url(record.license_url,200);
 if(source!=="osm"||!/^(node|way|relation)\/[1-9][0-9]{0,18}$/.test(sourceId)||
   !/^Q[1-9][0-9]{0,14}$/.test(qid))throw Error("Invalid source identity");
 if(photo.hostname!=="upload.wikimedia.org"||
  !photo.pathname.startsWith("/wikipedia/commons/")||
  !/\.(?:jpg|jpeg|png|webp)$/i.test(photo.pathname))throw Error("Invalid Wikimedia image URL");
 if(page.hostname!=="commons.wikimedia.org"||!page.pathname.startsWith("/wiki/File:")||
   page.pathname.length<"/wiki/File:a.jpg".length)throw Error("Invalid Commons file page");
 if(LICENSES.get(license)!==licenseUrl.toString())throw Error("Unapproved media license");
 return {source,source_id:sourceId,wikidata_qid:qid,image_url:photo.toString(),
   commons_page:page.toString(),author,license_name:license,license_url:licenseUrl.toString(),
   source_name:"Wikimedia Commons",checked_at:new Date().toISOString()};
}
async function authenticated(req:Request){
 const authorization=req.headers.get("authorization")??"";
 if(!authorization.startsWith("Bearer ")||authorization.length>6000)throw Error("Invalid authorization");
 const {payload,protectedHeader}=await jwtVerify(authorization.slice(7),JWKS,{
  issuer:"https://token.actions.githubusercontent.com",audience:AUDIENCE,
  algorithms:["RS256"],clockTolerance:"5s"
 });
 if(protectedHeader.alg!=="RS256"||payload.sub!=="repo:"+REPO+":ref:refs/heads/main"||
  payload.repository!==REPO||String(payload.repository_id)!=="1169920747"||
  payload.ref!=="refs/heads/main"||payload.workflow_ref!==WORKFLOW||
  !["schedule","push","workflow_dispatch"].includes(String(payload.event_name)))
  throw Error("Untrusted GitHub origin");
}
Deno.serve(async req=>{
 if(req.method!=="POST")return Response.json({error:"Method not allowed"},{status:405,headers:HEADERS});
 try{await authenticated(req);}catch{return Response.json({error:"Unauthorized workflow"},{status:401,headers:HEADERS});}
 try{
  const raw=await req.text();
  if(raw.length>45000)throw Error("Too much data");
  const input:unknown=JSON.parse(raw);
  if(!obj(input)||Object.keys(input).some(k=>k!=="records")||!Array.isArray(input.records)||
   input.records.length===0||input.records.length>24)throw Error("Invalid media batch");
  const seen=new Set<string>();
  const records:ReturnType<typeof validated>[]=[];
  for(const row of input.records){
   const media=validated(row);
   if(seen.has(media.source_id))throw Error("Duplicate source");
   seen.add(media.source_id);records.push(media);
  }
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!key||Deno.env.get("SUPABASE_URL")!==ORIGIN)
    return Response.json({error:"Protected ingestion unavailable"},{status:503,headers:HEADERS});
  // FK enforces an existing OSM ID. Never invent a hotel or replace unlicensed OSM tags.
  const response=await fetch(ORIGIN+"/rest/v1/hotel_catalog_media?on_conflict=source,source_id",{
    method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,
     "Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},
    body:JSON.stringify(records),signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)return Response.json({error:"Licensed media write unavailable"},{status:502,headers:HEADERS});
  return Response.json({accepted:records.length,source:"Wikimedia Commons",verified_hotel_inventory:false},
    {headers:HEADERS});
 }catch{
  return Response.json({error:"Rejected Wikimedia media batch"},{status:400,headers:HEADERS});
 }
});