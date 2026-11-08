import {osmSitemapCountries,escapeXml,OSM_XML_HEADERS} from "@/lib/seo/osm-sitemaps";
import {isPublicLaunch,siteOrigin} from "@/lib/seo/site";
export const dynamic="force-dynamic";
export async function GET(){
 if(!isPublicLaunch()||process.env.GTH_OSM_PLACE_PAGES_ENABLED==="false")return new Response("Not published",{status:404,headers:{"Cache-Control":"no-store"}});
 try{
  const countries=await osmSitemapCountries();
  const urls=countries.flatMap(row=>Array.from({length:row.pages},(_,page)=>`${siteOrigin()}/attractions/sitemaps/${row.country}/${page}.xml`));
  if(urls.length>50000)throw Error("Sitemap index requires further partitioning");
  const xml='<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(url=>`<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join("")+"</sitemapindex>";
  return new Response(xml,{headers:OSM_XML_HEADERS});
 }catch{return new Response("Mapped-place sitemap temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});}
}
