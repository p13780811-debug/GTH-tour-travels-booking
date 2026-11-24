import type {Metadata} from "next";
import {notFound,permanentRedirect} from "next/navigation";
import MobilityView from "@/components/mobility/MobilityView";
import {getMobilityCity} from "@/lib/mobility/catalog";
import {mobilityHref} from "@/lib/mobility/city";
import {isPublicLaunch,safeStructuredData,siteUrl} from "@/lib/seo/site";

export const revalidate=3600;
export function generateStaticParams(){return []; }
type Props={params:Promise<{city:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const city=await getMobilityCity((await params).city);
  if(!city)return {title:"City not found",robots:{index:false,follow:true}};
  const place=[city.name,city.country].filter(Boolean).join(", ");
  const title=place+" Mobility · Traffic, Transit & Driver Tools";
  const description="Plan travel in "+city.name+" with local transit information, recent community traffic reports and free driver earnings and fuel tools.";
  const path=mobilityHref(city);
  return {title,description,alternates:{canonical:path},robots:{index:isPublicLaunch(),follow:true},
    openGraph:{title,description,url:siteUrl(path),type:"website"}};
}

export default async function CityMobilityPage({params}:Props){
  const {city:slug}=await params;
  const city=await getMobilityCity(slug);
  if(!city)notFound();
  if(city.slug!==slug)permanentRedirect(mobilityHref(city));
  const schema={"@context":"https://schema.org","@type":"WebApplication",name:city.name+" Mobility",
    url:siteUrl(mobilityHref(city)),applicationCategory:"TravelApplication",operatingSystem:"Web",offers:{"@type":"Offer",price:0},
    description:"Local transit information, community reporting and driver tools for "+city.name+"."};
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeStructuredData(schema)}}/>
    <MobilityView city={city} cityPage/>
  </>;
}
