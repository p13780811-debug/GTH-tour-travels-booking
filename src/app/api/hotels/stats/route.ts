import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {cleanString} from "@/lib/security/validators";
export const dynamic="force-dynamic";
const TYPES=["hotel","motel","hostel","guest_house","apartment","resort"] as const;
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
export async function GET(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:"Catalog unavailable"},{status:503,headers:HEADERS});
 const params=new URL(req.url).searchParams;
 const destination=params.get("destination");
 if(destination&&!/^[a-z]+(?:-[a-z]+)*$/.test(destination))return NextResponse.json({error:"Invalid destination"},{status:400,headers:HEADERS});
 const rawCity=params.get("city"),rawName=params.get("name");
 const city=rawCity?cleanString(rawCity,{min:2,max:80,pattern:/^[\p{L}\p{M}\s.'-]+$/u}):null;
 const name=rawName?cleanString(rawName,{min:2,max:80,pattern:/^[\p{L}\p{M}\p{N}\s.'&-]+$/u}):null;
 if((rawCity&&!city)||(rawName&&!name))return NextResponse.json({error:"Invalid search"},{status:400,headers:HEADERS});
 const input=params.get("country")?.trim().toUpperCase();
 // Counts and results use the same worldwide default, not implicit visitor geolocation.
 const country=input || "";
 if(input&&!/^[A-Z]{2}$/.test(input))return NextResponse.json({error:"Invalid country"},{status:400,headers:HEADERS});
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  let matchingCity=city;
  if(destination){
   const {data:place,error:placeError}=await client.from("destinations")
    .select("name").eq("slug",destination).eq("is_active",true).maybeSingle();
   if(placeError)return NextResponse.json({error:"Destination lookup unavailable"},{status:503,headers:HEADERS});
   const knownName=place?.name;
   if(typeof knownName!=="string"||!cleanString(knownName,{min:2,max:80,pattern:/^[\p{L}\p{M}\s.'-]+$/u}))
    return NextResponse.json({error:"Destination not found"},{status:404,headers:HEADERS});
   matchingCity=knownName.trim();
  }
  const safeLike=(value:string)=>"%"+value.replace(/[\\%_]/g,(c)=>"\\"+c)+"%";
  const cityLike=matchingCity?safeLike(matchingCity):"";
  const nameLike=name?safeLike(name):"";
  const base=()=>{let q=client.from("hotel_catalog").select("id",{count:"exact",head:true});
   if(country)q=q.or("country_code.eq."+country+",extract_country_hint.eq."+country);
   if(matchingCity)q=q.or("city.ilike."+cityLike+",region.ilike."+cityLike);
   if(name)q=q.ilike("name",nameLike);
   return q;
  };
  let newest=client.from("hotel_catalog").select("imported_at");
  if(country)newest=newest.or("country_code.eq."+country+",extract_country_hint.eq."+country);
  if(matchingCity)newest=newest.or("city.ilike."+cityLike+",region.ilike."+cityLike);
  if(name)newest=newest.ilike("name",nameLike);
  const results=await Promise.all([base(),...TYPES.map(type=>base().eq("category",type)),newest.order("imported_at",{ascending:false}).limit(1)]);
  if(results.some(r=>r.error))throw Error("Hotel catalog query failed");
  const result=results[results.length-1];
  const row=Array.isArray(result.data)?result.data[0]:null;
  const latest=row && "imported_at" in row && typeof row.imported_at==="string"?row.imported_at:null;
  const categories=Object.fromEntries(TYPES.map((key,i)=>[key,results[i+1].count??0]));
  return NextResponse.json({country:country||null,city:matchingCity||null,name:name||null,total:results[0].count??0,categories,
   latest_imported_at:latest,source:"OpenStreetMap",source_license:"ODbL-1.0",
   availability_verified:false,prices_verified:false,country_scope:"official OSM country tags plus extract-area hints (border-adjacent candidates possible)",
   disclosure:"Location directory only. Confirm rooms, taxes, cancellation policies and rates with hotel or authorized provider."},
   {headers:HEADERS});
 }catch{return NextResponse.json({error:"Catalog temporarily unavailable"},{status:503,headers:HEADERS});}
}
