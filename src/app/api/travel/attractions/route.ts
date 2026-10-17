import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {safeAffiliateUrl,safeCommonsMedia,type OpenAttraction,type ApprovedTourLink} from "@/lib/travel/open-attractions";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600","X-Content-Type-Options":"nosniff"};
const regions=new Set(["goa","maharashtra"]);
const categories=new Set(["attraction","fort","beach","national-park","castle"]);
const SELECT="wikidata_qid,name,description,region_slug,category,latitude,longitude,wikidata_url,source_license,image_url,commons_page,image_author,image_license,image_license_url";
export async function GET(req:Request){
 if(process.env.GTH_OPEN_ATTRACTIONS_ENABLED==="false")return NextResponse.json({error:"Open attractions temporarily disabled"},{status:503,headers:{"Cache-Control":"no-store"}});
 const args=new URL(req.url).searchParams;
 if([...args.keys()].some(k=>!["region","category","page"].includes(k)))return NextResponse.json({error:"Unsupported filter"},{status:400,headers:{"Cache-Control":"no-store"}});
 const region=args.get("region")||"goa",category=args.get("category")||"",pageRaw=args.get("page")||"1";
 if(!regions.has(region)||(category&&!categories.has(category))||!/^[1-9][0-9]{0,2}$/.test(pageRaw)||Number(pageRaw)>20)
  return NextResponse.json({error:"Invalid region, category or page"},{status:400,headers:{"Cache-Control":"no-store"}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:"Catalog not configured"},{status:503,headers:{"Cache-Control":"no-store"}});
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let q=db.from("gth_open_attractions").select(SELECT).eq("is_public",true).eq("region_slug",region)
   .order("name",{ascending:true}).order("wikidata_qid",{ascending:true}).range((Number(pageRaw)-1)*24,Number(pageRaw)*24-1);
  if(category)q=q.eq("category",category);
  const {data,error}=await q;if(error)throw Error("Catalog query");
  const rows=((data||[]) as unknown as OpenAttraction[]).filter(x=>typeof x.name==="string"&&/^Q[1-9][0-9]{0,14}$/.test(x.wikidata_qid)&&Number.isFinite(x.latitude)&&Number.isFinite(x.longitude));
  const ids=rows.map(x=>x.wikidata_qid),linksBy=new Map<string,ApprovedTourLink[]>();
  if(ids.length&&process.env.GTH_APPROVED_TOUR_LINKS_ENABLED==="true"){
   const links=await db.from("gth_attraction_affiliate_links").select("wikidata_qid,partner,approved_url,provider_product_ref")
     .in("wikidata_qid",ids).eq("is_active",true).eq("approved_by_admin",true);
   if(!links.error)for(const link of (links.data||[]) as ApprovedTourLink[]){
    const safe=safeAffiliateUrl(link.approved_url);if(!safe)continue;
    const found=linksBy.get(link.wikidata_qid)||[];found.push({...link,approved_url:safe});linksBy.set(link.wikidata_qid,found);
   }
  }
  return NextResponse.json({items:rows.map(x=>({...x,image_url:x.commons_page&&x.image_author&&x.image_license&&x.image_license_url?safeCommonsMedia(x.image_url):null,
   partner_links:linksBy.get(x.wikidata_qid)||[],content_type:"public_attraction_reference",bookable_on_gth:false,live_price:null,live_availability:null})),
   page:Number(pageRaw),page_size:24,region,category:category||null,disclaimer:"Wikidata community places, not tickets, tour inventory, venue verification or booking availability."},{headers:HEADERS});
 }catch{return NextResponse.json({error:"Attractions temporarily unavailable"},{status:502,headers:{"Cache-Control":"no-store"}});}
}
