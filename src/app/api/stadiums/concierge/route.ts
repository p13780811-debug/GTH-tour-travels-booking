import {createClient} from "@supabase/supabase-js";
import {findStadium} from "@/lib/travel/stadiums";
import {haversineKm,venueLocations,safeHotelHandoff} from "@/lib/travel/stadium-concierge";
export const runtime="nodejs";
export async function GET(req:Request){
 const slug=new URL(req.url).searchParams.get("venue")||"";
 if(!/^[a-z0-9-]{3,70}$/.test(slug))return Response.json({error:"Invalid venue"},{status:400});
 const venue=findStadium(slug);
 if(!venue)return Response.json({error:"Unknown venue"},{status:404});
 const location=venueLocations[slug],bookingUrl=safeHotelHandoff(venue);
 const base={venue:venue.name,transit:location?.transit||"Check official venue transit and gate notices.",bookingUrl,hotels:[] as {name:string;distanceKm:number;sourceUrl:string}[]};
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!location||!url||!key)return Response.json({...base,note:"Nearby hotel records unavailable; use city booking search."},{headers:{"Cache-Control":"public, s-maxage=3600"}});
 try{
  const latDelta=5/111, lngDelta=5/(111*Math.max(.1,Math.cos(location.lat*Math.PI/180)));
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from("hotel_catalog").select("name,latitude,longitude,source_url,category")
   .gte("latitude",location.lat-latDelta).lte("latitude",location.lat+latDelta)
   .gte("longitude",location.lng-lngDelta).lte("longitude",location.lng+lngDelta)
   .in("category",["hotel","guest_house","hostel","motel","resort"]).limit(300);
  if(error)throw new Error("Hotel catalog unavailable");
  const seen=new Set<string>();
  const hotels=(data||[]).flatMap(row=>{
   const name=typeof row.name==="string"?row.name.trim():"";
   const lat=Number(row.latitude),lng=Number(row.longitude);
   if(!name||!Number.isFinite(lat)||!Number.isFinite(lng)||!Number.isFinite(location.lat)||!Number.isFinite(location.lng))return [];
   const distanceKm=haversineKm(location,{lat,lng});
   if(distanceKm>5||distanceKm<0)return [];
   let sourceUrl="";
   try{const parsed=new URL(row.source_url);if(parsed.protocol==="https:"&&["www.openstreetmap.org","openstreetmap.org"].includes(parsed.hostname))sourceUrl=parsed.toString();}catch{/* no unsafe URL */}
   return [{name:name.slice(0,160),distanceKm:Math.round(distanceKm*100)/100,sourceUrl}];
  }).sort((a,b)=>a.distanceKm-b.distanceKm).filter(h=>{const k=h.name.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}).slice(0,5);
  return Response.json({...base,hotels,note:"Distances are straight-line estimates, not verified walking routes. OSM directory records are not live Nuitee inventory."},{headers:{"Cache-Control":"public, s-maxage=3600"}});
 }catch{return Response.json({...base,note:"Hotel directory temporarily unavailable. Continue to booking search."},{headers:{"Cache-Control":"no-store"}});}
}
