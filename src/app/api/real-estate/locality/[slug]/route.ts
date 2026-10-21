import { cleanSlug } from "@/lib/security/validators";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { requestError } from "@/lib/security/request";
import { PropertyService } from "@/lib/real-estate/propertyService";
import { nearestOsm, safeRoutingBase, validCoordinates, type OsmElement } from "@/lib/real-estate/connectivity";
export const runtime="nodejs";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
export async function GET(req:Request,{params}:{params:Promise<{slug:string}>}){
 const slug=cleanSlug((await params).slug);
 if(!slug)return Response.json({error:"Invalid project"},{status:400,headers});
 try{
  await enforceRateLimit(req,"images");
  const project=await PropertyService.getBySlug(slug);
  if(!project)return Response.json({error:"Project not found"},{status:404,headers});
  const origin={lat:project.lat,lng:project.lng};
  if(!validCoordinates(origin))return Response.json({status:"missing_coordinates",metro:null,airport:null,notice:"No project-specific recorded coordinates. Connectivity is not estimated."},{headers});
  // Public volunteer endpoint: a single bounded user-initiated request only, never background/crawler traffic.
  const query=`[out:json][timeout:8];(nwr(around:6000,${origin.lat},${origin.lng})["railway"="station"]["station"~"^(subway|light_rail)$"];nwr(around:6000,${origin.lat},${origin.lng})["railway"="subway_entrance"];nwr(around:90000,${origin.lat},${origin.lng})["aeroway"="aerodrome"]["iata"];);out center 40;`;
  let elements:OsmElement[]=[];
  try{
   const endpoint="https://overpass.private.coffee/api/interpreter";
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json","User-Agent":"GTHPRO/1.0 (official@gthproglobal.com)"},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(10000),next:{revalidate:86400}});
   if(!response.ok)throw Error("OSM provider unavailable");
   const size=Number(response.headers.get("content-length")||0);
   if(size>300000)throw Error("Unexpected response size");
   const body=await response.text();if(body.length>300000)throw Error("Unexpected response size");
   const parsed:unknown=JSON.parse(body);
   if(!parsed||typeof parsed!=="object"||!Array.isArray((parsed as {elements?:unknown}).elements))throw Error("Unexpected response");
   elements=(parsed as {elements:OsmElement[]}).elements.slice(0,200);
  }catch{return Response.json({status:"source_unavailable",metro:null,airport:null,notice:"OpenStreetMap lookup is temporarily unavailable; no distance claims are displayed."},{headers});}
  const metro=nearestOsm(elements,origin,"metro");
  const airport=nearestOsm(elements,origin,"airport");
  let airportDriveMinutes:number|null=null;
  const base=safeRoutingBase(process.env.GTH_OSRM_BASE_URL);
  // Road minutes only from an explicitly configured trusted routing host, never a demo server.
  if(airport&&base){
   try{
    const target=new URL(`route/v1/driving/${origin.lng},${origin.lat};${airport.longitude},${airport.latitude}`,base);
    target.searchParams.set("overview","false");
    const response=await fetch(target,{signal:AbortSignal.timeout(7000),next:{revalidate:86400}});
    if(response.ok){
     const data:unknown=await response.json();
     const route=(data as {routes?:{duration?:number}[]})?.routes?.[0];
     if(typeof route?.duration==="number"&&Number.isFinite(route.duration)&&route.duration>0&&route.duration<36000) airportDriveMinutes=Math.max(1,Math.round(route.duration/60));
    }
   }catch{/* Driving time remains unavailable, not fabricated. */}
  }
  return Response.json({status:"source_backed",metro,airport,airportDriveMinutes,notice:"OpenStreetMap contributors (ODbL). Based on recorded project coordinates; straight-line distances are not walking routes. Road estimates require a configured routing service. Confirm details independently."},{headers});
 }catch(e){return requestError(e)}
}
