import {seoShard,seoShardCounts,knownSeoKind} from "@/lib/seo/large-sitemaps";
import {isPublicLaunch} from "@/lib/seo/site";
export const dynamic="force-dynamic";
type Props={params:Promise<{kind:string;page:string}>};
const ESC=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function GET(_req:Request,{params}:Props){
 if(!isPublicLaunch())return new Response("Not available",{status:404,headers:{"Cache-Control":"no-store"}});
 const {kind,page}=await params;
 if(!knownSeoKind(kind)||! /^(0|[1-9][0-9]{0,2})\.xml$/.test(page))
  return new Response("Invalid sitemap",{status:404,headers:{"Cache-Control":"no-store"}});
 const index=Number(page.slice(0,-4));
 try{
  const available=(await seoShardCounts()).find(x=>x.kind===kind)?.pages||0;
  if(index>=available)return new Response("Sitemap not published",{status:404,headers:{"Cache-Control":"no-store"}});
  const urls=await seoShard(kind,index);
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n'+
   '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
   urls.map(e=>"<url><loc>"+ESC(e.url)+"</loc>"+
    (e.lastModified?"<lastmod>"+new Date(e.lastModified).toISOString()+"</lastmod>":"")+
    (e.changeFrequency?"<changefreq>"+e.changeFrequency+"</changefreq>":"")+
    (e.priority!==undefined?"<priority>"+e.priority+"</priority>":"")+"</url>").join("")+
   "</urlset>";
  return new Response(xml,{headers:{"Content-Type":"application/xml; charset=utf-8",
   "Cache-Control":"public, s-maxage=3600, stale-while-revalidate=600",
   "X-Content-Type-Options":"nosniff"}});
 }catch{return new Response("Sitemap unavailable",{status:503,headers:{"Cache-Control":"no-store"}});}
}
