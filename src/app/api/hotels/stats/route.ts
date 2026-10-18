import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {NON_PROPERTY_NAME_PATTERN} from "@/lib/travel/hotel-name-quality";
export const dynamic="force-dynamic";
const TYPES=["hotel","motel","hostel","guest_house","apartment","resort"] as const;
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
export async function GET(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:"Catalog unavailable"},{status:503,headers:HEADERS});
 const params=new URL(req.url).searchParams;
 const input=params.get("country")?.trim().toUpperCase();
 const detected=req.headers.get("x-vercel-ip-country")??"";
 const country=input || (/^[A-Z]{2}$/.test(detected)?detected:"");
 if(input&&!/^[A-Z]{2}$/.test(input))return NextResponse.json({error:"Invalid country"},{status:400,headers:HEADERS});
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const base=()=>{let q=client.from("hotel_catalog").select("id",{count:"exact",head:true}).not("name","imatch",NON_PROPERTY_NAME_PATTERN);
   if(country)q=q.or("country_code.eq."+country+",extract_country_hint.eq."+country);return q;};
  const newest=client.from("hotel_catalog").select("imported_at")
   .order("imported_at",{ascending:false}).limit(1);
  if(country)newest.or("country_code.eq."+country+",extract_country_hint.eq."+country);
  const results=await Promise.all([base(),...TYPES.map(type=>base().eq("category",type)),newest]);
  if(results.some(r=>r.error))throw Error("Hotel catalog query failed");
  const result=results[results.length-1];
  const row=Array.isArray(result.data)?result.data[0]:null;
  const latest=row && "imported_at" in row && typeof row.imported_at==="string"?row.imported_at:null;
  const categories=Object.fromEntries(TYPES.map((key,i)=>[key,results[i+1].count??0]));
  return NextResponse.json({country:country||null,total:results[0].count??0,categories,
   latest_imported_at:latest,source:"OpenStreetMap",source_license:"ODbL-1.0",
   availability_verified:false,prices_verified:false,country_scope:"official OSM country tags plus extract-area hints (border-adjacent candidates possible)",
   disclosure:"Location directory only. Confirm rooms, taxes, cancellation policies and rates with hotel or authorized provider."},
   {headers:HEADERS});
 }catch{return NextResponse.json({error:"Catalog temporarily unavailable"},{status:503,headers:HEADERS});}
}
