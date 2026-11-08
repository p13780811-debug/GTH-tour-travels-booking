import {osmSitemapShard,escapeXml,OSM_XML_HEADERS} from "@/lib/seo/osm-sitemaps";
import {isPublicLaunch} from "@/lib/seo/site";
export const dynamic="force-dynamic";
type Props={params:Promise<{country:string;page:string}>};
export async function GET(_request:Request,{params}:Props){
 const {country,page}=await params;
 if(!isPublicLaunch()||process.env.GTH_OSM_PLACE_PAGES_ENABLED==="false"||!/^[A-Z]{2}$/.test(country)||!/^(0|[1-9][0-9]{0,5})\.xml$/.test(page))
  return new Response("Not published",{status:404,headers:{"Cache-Control":"no-store"}});
 try{
  const rows=await osmSitemapShard(country,Number(page.slice(0,-4)));
  if(rows===null)return new Response("Not published",{status:404,headers:{"Cache-Control":"no-store"}});
  const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+rows.map(row=>`<url><loc>${escapeXml(row.url)}</loc>${row.lastModified?`<lastmod>${row.lastModified}</lastmod>`:""}</url>`).join("")+"</urlset>";
  return new Response(xml,{headers:OSM_XML_HEADERS});
 }catch{return new Response("Mapped-place sitemap temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});}
}
