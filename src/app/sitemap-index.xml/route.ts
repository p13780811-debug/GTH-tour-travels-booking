import {seoShardCounts} from "@/lib/seo/large-sitemaps";
import {siteOrigin,isPublicLaunch} from "@/lib/seo/site";
export const dynamic="force-dynamic";
const ESC=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function GET(){
 if(!isPublicLaunch())return new Response("Not available",{status:404,headers:{"Cache-Control":"no-store"}});
 try{
  const origin=siteOrigin(),counts=await seoShardCounts();
  const urls=[origin+"/sitemap.xml",...counts.flatMap(({kind,pages})=>Array.from({length:pages},(_,n)=>origin+"/seo-sitemaps/"+kind+"/"+n+".xml"))];
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
   '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
   urls.map(url=>"<sitemap><loc>"+ESC(url)+"</loc></sitemap>").join("")+"</sitemapindex>";
  return new Response(xml,{headers:{"Content-Type":"application/xml; charset=utf-8",
   "Cache-Control":"public, s-maxage=3600, stale-while-revalidate=600",
   "X-Content-Type-Options":"nosniff"}});
 }catch{
  return new Response("SEO sitemap index temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
