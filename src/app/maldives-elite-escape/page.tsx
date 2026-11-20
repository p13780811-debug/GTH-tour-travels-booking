import type {Metadata} from "next";
import JsonLd from "@/components/seo/JsonLd";
import {parseTravelQuery} from "@/lib/router/cityContext";
import {resolveHotelDates} from "@/lib/travel/hotel-routing";
import MaldivesBookingHero from "@/components/maldives/MaldivesBookingHero";
import {MALDIVES_PEXELS_FALLBACK,maldivesPexelsHero} from "@/lib/maldives/pexels-hero";
import MaldivesStays, {type MaldivesStaySelection} from "@/components/maldives/MaldivesStays";
import MaldivesExplore from "@/components/maldives/MaldivesExplore";

export const dynamic="force-dynamic";

const canonical="https://www.gthproglobal.com/maldives-elite-escape";
const image=MALDIVES_PEXELS_FALLBACK;
const description="Discover Maldives overwater resorts, island escapes, flights to Malé (MLE), speedboat and seaplane transfers and genuine supplier-backed tours with GTH PRO.";

export const metadata:Metadata={
  title:"Maldives Elite Escape — Luxury Overwater Resorts, Flights & Island Tours | GTH PRO",
  description,
  alternates:{canonical},
  openGraph:{
    type:"website",url:canonical,
    title:"Maldives Elite Escape — Luxury Overwater Resorts, Flights & Island Tours | GTH PRO",
    description,siteName:"GTH PRO",
    images:[{url:image,width:2200,height:1467,alt:"Aerial photograph of overwater resort villas in the Maldives"}],
  },
  twitter:{card:"summary_large_image",title:"Maldives Elite Escape | GTH PRO",description,images:[image]},
};

type Props={
  searchParams?:Promise<Record<string,string|string[]|undefined>>;
};

function stayFromQuery(query:Record<string,string|string[]|undefined>,now:Date):MaldivesStaySelection{
  const raw:Record<string,unknown>={};
  for(const key of ["checkin","checkout","adults","children","currency"]){
    if(query[key]!==undefined)raw[key]=query[key];
  }
  const parsed=parseTravelQuery(raw,now);
  const dates=resolveHotelDates(
    parsed.ok?parsed.value.checkin:null,
    parsed.ok?parsed.value.checkout:null,now,
  );
  return {
    checkin:dates.checkin,checkout:dates.checkout,
    adults:parsed.ok?parsed.value.adults:2,
    children:parsed.ok?parsed.value.children.join(","):"",
    currency:parsed.ok?parsed.value.currency:"USD",
    today:now.toISOString().slice(0,10),
  };
}

const schema={
  "@context":"https://schema.org",
  "@type":"TouristDestination",
  name:"Maldives Elite Escape",
  description,
  url:canonical,
  image,
  touristType:["Island travellers","Resort guests","Nature travellers"],
  containedInPlace:{"@type":"Country",name:"Maldives"},
  provider:{"@type":"Organization",name:"GTH PRO Global",url:"https://www.gthproglobal.com"},
};
const breadcrumbs={
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  itemListElement:[
    {"@type":"ListItem",position:1,name:"GTH PRO Travel",item:"https://www.gthproglobal.com/travel"},
    {"@type":"ListItem",position:2,name:"Maldives Elite Escape",item:canonical},
  ],
};

export default async function MaldivesEliteEscape({searchParams}:Props){
  const query=await (searchParams??Promise.resolve({}));
  const stay=stayFromQuery(query,new Date());
  const photo=await maldivesPexelsHero();
  return <main className="min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(110px+env(safe-area-inset-bottom))] text-[var(--text)] md:pb-16" data-maldives-elite-escape="true">
    <JsonLd data={schema}/>
    <JsonLd data={breadcrumbs}/>
    <MaldivesBookingHero photo={photo}/>
    <MaldivesStays stay={stay}/>
    <MaldivesExplore/>
  </main>;
}
