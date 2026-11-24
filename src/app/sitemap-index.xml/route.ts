import {unstable_cache} from "next/cache";
import {SEO_KINDS,seoShardCountsSafe,seoShardPages} from "@/lib/seo/large-sitemaps";
import {siteOrigin,isPublicLaunch} from "@/lib/seo/site";
export const dynamic="force-dynamic";
const readPages=unstable_cache(seoShardPages,["master-sitemap-source-count-v1"],{revalidate:900});
const ESC=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function GET(){
 if(!isPublicLaunch())return new Response("Not available",{status:404,headers:{"Cache-Control":"no-store"}});
 try{
  const origin=siteOrigin(),counts=await seoShardCountsSafe(readPages);
  if(!counts.length)throw new Error("Sitemap source counts unavailable");
  // OSM has its own index in robots.txt; nested sitemap indexes are not supported.
  const urls=[origin+"/sitemap.xml",...counts.flatMap(({kind,pages})=>Array.from({length:pages},(_,n)=>origin+"/seo-sitemaps/"+kind+"/"+n+".xml"))];
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
   '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
   urls.map(url=>"<sitemap><loc>"+ESC(url)+"</loc></sitemap>").join("")+"</sitemapindex>";
  return new Response(xml,{headers:{"Content-Type":"application/xml; charset=utf-8",
   "Cache-Control":counts.length===SEO_KINDS.length?"public, s-maxage=3600, stale-while-revalidate=600":"public, s-maxage=60",
   "X-Content-Type-Options":"nosniff"}});
 }catch{
  return new Response("SEO sitemap index temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store","Retry-After":"60"}});
 }
}
