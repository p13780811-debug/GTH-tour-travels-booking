import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600","X-Content-Type-Options":"nosniff"};
const REGIONS=new Set(["goa","india"]);
const CATEGORIES=new Set(["attraction","museum","viewpoint","zoo","theme-park","fort","castle","ruins","monument","archaeological-site","beach","national-park","park","nature-reserve"]);
export async function GET(req:Request){
 const p=new URL(req.url).searchParams;
 if([...p.keys()].some(k=>!["region","category","page"].includes(k)))return NextResponse.json({error:"Invalid filters"},{status:400});
 const region=p.get("region")||"india",category=p.get("category")||"",pageRaw=p.get("page")||"1";
 if(!REGIONS.has(region)||(category&&!CATEGORIES.has(category))||
  !/^[1-9][0-9]{0,2}$/.test(pageRaw)||Number(pageRaw)>100)return NextResponse.json({error:"Invalid filters"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:"Source directory unavailable"},{status:503});
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let q=db.from("gth_osm_attractions").select("source_id,name,category,region_scope,city,latitude,longitude,source_url,source_license")
   .eq("is_public",true).eq("is_community_directory",true).eq("region_scope",region)
   .order("name",{ascending:true}).order("source_id",{ascending:true}).range((Number(pageRaw)-1)*24,Number(pageRaw)*24-1);
  if(category)q=q.eq("category",category);
  const {data,error}=await q;if(error)throw new Error("Source query unavailable");
  return NextResponse.json({items:(data||[]).map(row=>({...row,verified_tickets:false,available_for_booking:false,
   independently_verified:false,photo_url:null})),region,category:category||null,page:Number(pageRaw),
   attribution:"© OpenStreetMap contributors (ODbL 1.0), via Geofabrik.",
   note:"Community-mapped places, not verified attractions, entrance tickets, supplier prices or available tours."},{headers:HEADERS});
 }catch{return NextResponse.json({error:"Source directory temporarily unavailable"},{status:502,headers:{"Cache-Control":"no-store"}});}
}
