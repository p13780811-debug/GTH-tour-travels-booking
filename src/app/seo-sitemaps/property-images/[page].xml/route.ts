import { createClient } from "@supabase/supabase-js";
import { isPublicLaunch, siteOrigin } from "@/lib/seo/site";
import { publishedMediaUrl } from "@/lib/property-media/published-media";

export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escapeXml=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;")
 .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const xml=(body:string)=>'<?xml version="1.0" encoding="UTF-8"?>\n'+
 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '+
 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+body+'</urlset>';
/** SEO-owner safe: independent shard endpoint, not a replacement for the existing sitemap-index. */
export async function GET(_req:Request,{params}:{params:Promise<{page:string}>}){
 const {page}=await params;
 if(!isPublicLaunch()||!/^(0|[1-9][0-9]{0,2})$/.test(page))
  return new Response("Not found",{status:404,headers:{"Cache-Control":"no-store"}});
 const offset=Number(page)*500;
 if(offset>250000)return new Response("Not found",{status:404});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return new Response("Source unavailable",{status:503});
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from("property_published_media")
   .select("id,project_id,media_type")
   .eq("status","published")
   .order("published_at",{ascending:true}).order("id",{ascending:true})
   .range(offset,offset+499);
  if(error)throw new Error("Published media query unavailable");
  const eligible=(data||[]).filter(m=>UUID.test(m.id)&&m.media_type!=="floor_plan");
  if(!eligible.length)return new Response(xml(""),{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public,max-age=300"}});
  const ids=[...new Set(eligible.map(m=>m.project_id))];
  const projects=await db.from("gth_seo_properties_v1").select("id,slug").in("id",ids);
  if(projects.error)throw new Error("Eligible registry page query unavailable");
  const slugs=new Map((projects.data||[]).map(v=>[v.id,v.slug]));
  const origin=siteOrigin();
  const grouped=new Map<string,string[]>();
  for(const item of eligible){
   const slug=slugs.get(item.project_id);
   if(typeof slug!=="string"||!slug||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))continue;
   const url=origin+publishedMediaUrl(item.id);
   const list=grouped.get(slug)||[];
   if(list.length<20)list.push(url);
   grouped.set(slug,list);
  }
  const body=[...grouped].map(([slug,images])=>
   '<url><loc>'+escapeXml(origin+'/real-estate/'+encodeURIComponent(slug))+'</loc>'+
    images.map(url=>'<image:image><image:loc>'+escapeXml(url)+'</image:loc></image:image>').join('')+
   '</url>').join('');
  return new Response(xml(body),{headers:{"Content-Type":"application/xml; charset=utf-8",
    "Cache-Control":"public,s-maxage=300,stale-while-revalidate=60","X-Content-Type-Options":"nosniff"}});
 }catch{return new Response("Property image sitemap temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}})}
}
