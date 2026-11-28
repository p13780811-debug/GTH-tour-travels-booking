// Native Worker anonymous public GETs; no Next or Supabase SDK initialization.
// The original Next API remains the fallback for errors, authentication, and
// all methods outside these exact read contracts. All database reads use RLS.
import {nativeTenderRead,nativeTenderInput,nativeTenderUnavailable} from "./cloudflare-native-tender.mjs";
import {publicReadCacheKey,storePublicEdgeCache} from "../src/lib/security/public-edge-cache.ts";
import {MOBILITY_CITIES,mobilityCity,mobilityCityKey,mobilityText} from "../src/lib/mobility/city.ts";
import {countryCodeForDestinationName} from "../src/lib/travel/osmCountryCodes.ts";
import {reportsForZone,isTrafficCity} from "../src/lib/mobility/traffic.ts";
import {parseRegistryFilters,REGISTRY_PAGE_SIZE} from "../src/lib/real-estate/registry-search.ts";
import {validPropertySlug} from "../src/lib/real-estate/property-seo.ts";
import {findStadium} from "../src/lib/travel/stadiums.ts";
import {haversineKm,venueLocations,safeHotelHandoff} from "../src/lib/travel/stadium-concierge.ts";

function publicDb(env){
 const url=new URL(env.NEXT_PUBLIC_SUPABASE_URL||""),key=env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(url.protocol!=="https:"||!url.hostname.endsWith(".supabase.co")||url.username||url.password||url.port||url.search||url.hash||url.pathname!=="/"||typeof key!=="string")throw Error("Public DB configuration unavailable");
 const headers={apikey:key,Accept:"application/json"};
 if(!key.startsWith("sb_publishable_")){
  const parts=key.split(".");
  if(parts.length!==3||JSON.parse(atob(parts[1].replace(/-/g,"+").replace(/_/g,"/"))).role!=="anon")throw Error("Only anonymous keys allowed");
  headers.Authorization="Bearer "+key;
 }
 return async(path,params,body,options)=>{
  const endpoint=new URL("/rest/v1/"+path,url);
  if(params)endpoint.search=new URLSearchParams(params).toString();
  const response=await fetch(endpoint,{headers:{...headers,...(body?{"Content-Type":"application/json"}:{}),...(options?.exactCount?{Prefer:"count=exact"}:{})},method:body?"POST":"GET",body:body?JSON.stringify(body):undefined,redirect:"error",signal:AbortSignal.timeout(4500)});
  if(options?.exactCount)return response;
  if(!response.ok)throw Error("Public DB read unavailable");
  return response.json();
 };
}
function reply(data,control){return Response.json(data,{headers:{"Cache-Control":control,"X-GTH-Edge-Read":"native","X-Content-Type-Options":"nosniff"}})}
export async function nativePublicRead(request,env){
 if(env.GTH_CLOUDFLARE_INGRESS!=="1")return null;
 const tenderInput=nativeTenderInput(request,env);
 if(tenderInput){
  try{return await nativeTenderRead(request,env,publicDb(env));}
  catch{return nativeTenderUnavailable(tenderInput,"db_configuration");}
 }
 if(!publicReadCacheKey(request))return null;
 const url=new URL(request.url);
 if(url.hostname==="gthproglobal.com")return null;
 try{
  const db=publicDb(env);
  // The custom Worker runs before OpenNext initializes process.env. The
  // native binding check above is authoritative for these anonymous reads.
  const store=(response,expiresAt=Infinity)=>storePublicEdgeCache(request,response,expiresAt,true);
  if(url.pathname==="/api/mobility/cities"){
   const prefix=mobilityText(url.searchParams.get("q"),70).toLocaleLowerCase("en");
   if(prefix.length<2)return null;
   const rows=await db("destinations",{select:"name,slug,country,country_code",is_active:"is.true",name:"ilike."+prefix.replace(/[\\%_]/g,"\\$&")+"%",order:"name.asc,slug.asc",limit:"15"});
   if(!Array.isArray(rows))return null;
   const matches=new Map();
   for(const city of MOBILITY_CITIES)if(city.name.toLocaleLowerCase("en").startsWith(prefix))matches.set(mobilityCityKey(city),city);
   for(const row of rows){const city=mobilityCity({name:row.name,slug:row.slug,country:row.country,countryCode:row.country_code??countryCodeForDestinationName(row.country)});if(city)matches.set(mobilityCityKey(city),city);}
   return store(reply({cities:[...matches.values()].slice(0,12),degraded:false},"public, s-maxage=300, stale-while-revalidate=60"));
  }
  if(url.pathname==="/api/mobility/traffic"){
   const city=url.searchParams.get("city");if(!isTrafficCity(city))return null;
   const feed=await db("rpc/mobility_traffic_feed",null,{p_city:city});
   if(!feed||!Array.isArray(feed.zones)||!Array.isArray(feed.reports))return null;
   const reports=reportsForZone(feed.reports,"");
   return store(reply({zones:feed.zones,reports},"public, max-age=0, s-maxage=25"),Math.min(Infinity,...reports.map(report=>Date.parse(report.expiresAt))));
  }
  if(url.pathname==="/api/real-estate/registry-preview"){
   const parsed=parseRegistryFilters({q:url.searchParams.get("q")||""});if(!parsed.ok)return null;
   const q=parsed.filters.q;
   const rows=await db("properties",{select:"id,slug,title,rera_id,developer,builder_name,city,district,status",source_type:"in.(registry,rera)",ingestion_source:"ilike.%maharera%",rera_id:"not.is.null",or:"(title.ilike.%"+q+"%,rera_id.ilike.%"+q+"%,city.ilike.%"+q+"%,district.ilike.%"+q+"%)",order:"slug.asc",limit:String(REGISTRY_PAGE_SIZE)});
   if(!Array.isArray(rows))return null;
   const selected=rows.filter(row=>validPropertySlug(row.slug)&&typeof row.title==="string"&&row.title.trim().length>=3&&/^P[0-9]{11}$/.test(row.rera_id||"")&&row.status!=="archived").slice(0,6);
   const ids=[...new Set(selected.map(row=>Number(row.id)))].filter(id=>Number.isSafeInteger(id)&&id>0).sort((a,b)=>a-b);
   const pulses={};let cacheable=true;
   if(ids.length)try{
    const data=await db("rpc/gth_read_infra_pulse",null,{p_property_ids:ids});
    if(!Array.isArray(data))throw Error();
    const checkedAt=new Date().toISOString(),now=Date.now();
    for(const row of data){
     if(!ids.includes(Number(row.property_id))||!Number.isSafeInteger(Number(row.total_count))||Number(row.total_count)<1||!Array.isArray(row.notices))continue;
     const notices=row.notices.filter(n=>typeof n.id==="string"&&/^[a-f0-9-]{36}$/i.test(n.id)&&typeof n.title==="string"&&typeof n.authority==="string"&&typeof n.deadline==="string"&&Date.parse(n.deadline)>now&&["city","district","region"].includes(String(n.scope))&&typeof n.region==="string");
     if(notices.length)pulses[Number(row.property_id)]={count:Number(row.total_count),notices,checkedAt};
    }
   }catch{cacheable=false;}
   const items=selected.map(({id,slug,title,rera_id,developer,builder_name,city,district})=>({id,infraPulse:pulses[Number(id)],slug,title,rera_id,developer:developer||builder_name,city:city||district}));
   const response=reply({items},"no-store");
   return cacheable?store(response,Math.min(Infinity,...Object.values(pulses).flatMap(p=>p.notices.map(n=>Date.parse(n.deadline))))):response;
  }
  if(url.pathname==="/api/stadiums/concierge"){
   const slug=url.searchParams.get("venue"),venue=findStadium(slug),location=venueLocations[slug];
   if(!venue||!location)return null;
   const latDelta=5/111,lngDelta=5/(111*Math.max(.1,Math.cos(location.lat*Math.PI/180)));
   // PostgREST accepts repeated range keys, preserving both bounds.
   const params=new URLSearchParams([["select","name,latitude,longitude,source_url,category"],["latitude","gte."+(location.lat-latDelta)],["latitude","lte."+(location.lat+latDelta)],["longitude","gte."+(location.lng-lngDelta)],["longitude","lte."+(location.lng+lngDelta)],["category","in.(hotel,guest_house,hostel,motel,resort)"],["limit","300"]]);
   const rows=await db("hotel_catalog",params);
   if(!Array.isArray(rows))return null;
   const seen=new Set();
   const hotels=rows.flatMap(row=>{
    const name=typeof row.name==="string"?row.name.trim():"",lat=Number(row.latitude),lng=Number(row.longitude);
    if(!name||!Number.isFinite(lat)||!Number.isFinite(lng))return [];
    const distanceKm=haversineKm(location,{lat,lng});if(distanceKm>5||distanceKm<0)return [];
    let sourceUrl="";try{const u=new URL(row.source_url);if(u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&["www.openstreetmap.org","openstreetmap.org"].includes(u.hostname))sourceUrl=u.toString();}catch{/* Reject malformed or untrusted source links. */}
    return [{name:name.slice(0,160),distanceKm:Math.round(distanceKm*100)/100,sourceUrl}];
   }).sort((a,b)=>a.distanceKm-b.distanceKm).filter(h=>{const k=h.name.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,5);
   return store(reply({venue:venue.name,transit:location.transit,bookingUrl:safeHotelHandoff(venue),hotels,note:"Nearest among up to 300 loaded records, not an exhaustive hotel ranking. Distances are straight-line estimates, not walking routes. OSM records are not live Nuitee inventory."},"public, s-maxage=3600"));
  }
 }catch{/* Original bounded and authenticated routes remain authoritative fallback. */}
 return null;
}
