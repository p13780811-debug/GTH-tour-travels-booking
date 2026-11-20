import type {Metadata} from "next";
import typography from "@/components/maldives/MaldivesTypography.module.css";
import {Suspense} from "react";
import Link from "next/link";
import {ArrowUpRight,ShieldCheck,Sun,Compass} from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import {parseTravelQuery} from "@/lib/router/cityContext";
import {resolveHotelDates} from "@/lib/travel/hotel-routing";
import MaldivesHero, {type MaldivesStaySelection} from "@/components/maldives/MaldivesHero";
import MaldivesStays from "@/components/maldives/MaldivesStays";
import MaldivesExperiences from "@/components/maldives/MaldivesExperiences";
import MaldivesConnectivity from "@/components/maldives/MaldivesConnectivity";

export const dynamic="force-dynamic";

const canonical="https://www.gthproglobal.com/maldives-elite-escape";
const image="https://images.unsplash.com/photo-1632904000334-144b19f78500?auto=format&fit=crop&w=2200&q=80";
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
  return <main className="min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(110px+env(safe-area-inset-bottom))] text-[var(--text)] md:pb-16" data-maldives-elite-escape="true">
    <JsonLd data={schema}/>
    <JsonLd data={breadcrumbs}/>
    <MaldivesHero stay={stay} headingClass={typography.heading}/>
    <MaldivesStays/>
    <MaldivesConnectivity departDate={stay.checkin} today={stay.today}/>
    <Suspense fallback={<div role="status" className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--text-soft)] sm:px-6">Checking original Maldives supplier experiences…</div>}>
      <MaldivesExperiences/>
    </Suspense>
    <section aria-labelledby="maldives-essentials" className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6">
      <div className="gth-glass-strong rounded-3xl border border-[var(--border)] p-5 sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--gold)]"><Sun size={16} aria-hidden="true"/> Before you arrive</p>
        <h2 id="maldives-essentials" className="mt-2 text-2xl font-bold">Your island arrival checklist</h2>
        <div className="mt-5 grid gap-4 text-sm leading-6 text-[var(--text-soft)] md:grid-cols-3">
          <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <strong className="mb-1 block text-[var(--text)]">01 · Confirm the island</strong>
            Atolls span many kilometres. Confirm the resort's island, boat pier, transfer provider and transfer cost before checkout.
          </p>
          <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <strong className="mb-1 block text-[var(--text)]">02 · Plan MLE arrivals</strong>
            Check airport arrival time, any overnight stop, seaplane daylight limits and transfer baggage allowances.
          </p>
          <p className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <strong className="mb-1 block text-[var(--text)]">03 · Compare the final total</strong>
            Verify taxes, meals, resort fees, transfers, weather-sensitive excursions and cancellation conditions with the supplier.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
          <p className="flex max-w-2xl items-start gap-2 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={17} className="mt-1 shrink-0"/> GTH PRO provides travel discovery and provider-operated handoffs, not guaranteed availability, airline tickets or resort-managed transfers.</p>
          <Link href="/affiliate-disclosure" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">
            Booking disclosures <ArrowUpRight size={15} aria-hidden="true"/>
          </Link>
        </div>
        <Link href="/tours?city=Mal%C3%A9#discover" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
          <Compass size={16} className="text-[var(--gold)]" aria-hidden="true"/> Explore actual supplier tours <ArrowUpRight size={16} aria-hidden="true"/>
        </Link>
      </div>
    </section>
  </main>;
}
