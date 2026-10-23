import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {safeVerifiedHotelAffiliateUrl,type HotelBookingMapping} from "@/lib/travel/hotel-booking-links";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Props={params:Promise<{id:string}>};
const noCache={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"};
/**
 * Hotel-specific affiliate exit. Resolve a reviewed OSM or licensed supplier record
 * against the EXISTING verified overlay, never against name similarity.
 * Does not fetch Klook, guess a property ID, or alter any OSM records.
 */
export async function GET(request:Request,{params}:Props){
 const {id}=await params;
 const osm=/^osm:(node|way|relation)-[0-9]{1,19}$/.test(id);
 const reviewed=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
 if(!osm&&!reviewed)return new NextResponse("Invalid hotel reference",{status:404,headers:noCache});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return new NextResponse("Hotel booking links temporarily unavailable",{status:503,headers:noCache});
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let query=db.from("hotel_booking_links")
   .select("provider,provider_property_id,provider_property_url,affiliate_url,hotel_name_at_provider")
   .eq("active",true).eq("exact_property_verified",true).eq("program_approved",true)
   .gte("verified_at",new Date(Date.now()-180*86400000).toISOString());
  if(osm)query=query.eq("catalog_source","osm").eq("catalog_source_id",id.slice(4).replace("-","/"));
  else query=query.eq("reviewed_hotel_id",id);
  const {data,error}=await query.order("verified_at",{ascending:false}).limit(20);
  if(error)return new NextResponse("Verified booking lookup temporarily unavailable",{status:503,headers:noCache});
  const matches=(data||[]).flatMap(value=>{
   const link=safeVerifiedHotelAffiliateUrl(value as HotelBookingMapping);
   return link?[{provider:value.provider,url:link}]:[];
  });
  // Customer preference: Klook when an exact approved hotel link exists;
  // otherwise a verified Trip.com or Booking.com hotel landing page.
  const preferred=["klook","trip_com","booking_com","other_approved"];
  matches.sort((a,b)=>preferred.indexOf(a.provider)-preferred.indexOf(b.provider));
  const chosen=matches[0];
  if(!chosen){
   // The ordinary GTH directory detail stays available for unlinked OSM hotels.
   return NextResponse.redirect(new URL("/hotels/stay/"+encodeURIComponent(id),request.url),{status:307,headers:noCache});
  }
  return NextResponse.redirect(chosen.url,{status:307,headers:{...noCache,"X-Robots-Tag":"noindex, nofollow"}});
 }catch{
  return new NextResponse("Hotel booking lookup temporarily unavailable",{status:503,headers:noCache});
 }
}
