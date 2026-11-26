import {validatedMumbaiSnapshot} from "./osm";
import snapshot from "./mumbai-osm-snapshot.json";

// Public, fixed, dated extract only: no secrets, database, live reports or auth.
// Return null for every case requiring the full existing API implementation.
export function publicMumbaiMapResponse(request:Request,now=Date.now()):Response|null{
  if(request.method!=="GET")return null;
  const url=new URL(request.url);
  if(url.pathname!=="/api/mobility/map"||url.searchParams.get("city")!=="mumbai"||url.searchParams.get("refresh")==="1")return null;
  const data=validatedMumbaiSnapshot(snapshot,{name:"Mumbai",slug:"mumbai",countryCode:"IN",country:"India"},now);
  if(!data)return null;
  return Response.json({state:"available",...data},{headers:{"Cache-Control":"public, max-age=0, s-maxage=21600, stale-while-revalidate=3600"}});
}
