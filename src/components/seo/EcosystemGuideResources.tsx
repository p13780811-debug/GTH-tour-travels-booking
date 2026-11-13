import Link from "next/link";
import {ArrowUpRight,BookOpen,ShieldCheck} from "lucide-react";
import {ecosystemGuides} from "@/data/blogEcosystem";
import {findFlightPartner} from "@/lib/flights/partners";
import {hotelProviderSearchUrl} from "@/lib/travel/hotel-provider-search";
import {buildCruiseProviderSearch} from "@/lib/travel/cruise-provider-search";
import {buildPartnerSearch} from "@/lib/travel/partner-search";

const officialHosts=new Set([
  "maharera.maharashtra.gov.in",
  "gem.gov.in",
  "eprocure.gov.in",
  "www.ungm.org",
  "ted.europa.eu",
  "projects.worldbank.org",
]);
function publicResource(href:string):"internal"|"official"|null{
 if(href.startsWith("/")&&!href.startsWith("//")&&!href.includes("\\")&&!href.includes("#"))return "internal";
 try{
  const url=new URL(href);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.hash)return null;
  return officialHosts.has(url.hostname.toLowerCase())?"official":null;
 }catch{return null;}
}

/** Affiliate links come from existing owner-approved public link constants, never fabricated tracking. */
export default function EcosystemGuideResources({slug}:{slug:string}){
 const guide=ecosystemGuides.find(item=>item.slug===slug);
 if(!guide)return null;
 const partners=(guide.partnerSlugs||[]).map(slug=>findFlightPartner(slug)).filter(p=>p!==null);
 const related=ecosystemGuides.filter(item=>item.slug!==guide.slug&&item.pillar===guide.pillar).slice(0,4);
 const whiteLabel=guide.nuitee?hotelProviderSearchUrl("hotels"):null;
 const getYourGuide=guide.gygCruiseDestination?buildCruiseProviderSearch(guide.gygCruiseDestination,"gyg","sightseeing"):null;
 const klook=guide.klookSearchDestination?buildPartnerSearch({kind:"activities",destination:guide.klookSearchDestination}):null;
 const pillarHome=guide.pillar==="Real Estate"?"/real-estate":guide.pillar==="Tenders"?"/tender":"/travel";
 const pillarGuides=guide.pillar==="Real Estate"?"/real-estate/guides":guide.pillar==="Tenders"?"/knowledge/tenders":"/blog";
 const services=[
  {href:"/flights",label:"Flights"},{href:"/hotels",label:"Hotels"},{href:"/tours",label:"Tours"},
  {href:"/activities",label:"Activities"},{href:"/tickets",label:"Worldwide Tickets"},
  {href:"/bus",label:"Buses"},{href:"/train",label:"Trains"},{href:"/ferry",label:"Ferries"},
  {href:"/cruises",label:"Cruises"},{href:"/transfers",label:"Transfers"},
  {href:"/cars",label:"Cars"},{href:"/insurance",label:"Insurance"},
 ];
 return <section className="mt-10 space-y-5" aria-label={guide.pillar+" guide resources"}>
  <div className="gth-glass rounded-2xl border border-[var(--border)] p-5 sm:p-7">
   <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Research and next steps</p>
   <h2 className="mt-2 text-xl font-bold">Useful official, GTH PRO and supplier paths</h2>
   <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
    These are contextual research and booking starting points. Government sources, platform guidance and supplier bookings are separate.
    Final prices, tickets, hotel rooms, bids and property status are never guaranteed by an article.
   </p>
   <nav aria-label="Guide related resources" className="mt-5 grid gap-3 sm:grid-cols-2">
    {guide.resources.filter(x=>publicResource(x.href)).map(item=>{
      const kind=publicResource(item.href);
      const classes="flex min-h-16 items-start justify-between gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:underline";
      return kind==="internal"?
       <Link key={item.href} href={item.href} className={classes}>
        <span><strong className="text-sm">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-[var(--text-soft)]">{item.description}</span></span>
        <ArrowUpRight size={16} className="shrink-0" aria-hidden="true"/>
       </Link>:
       <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={classes}>
        <span><strong className="text-sm">{item.label}</strong><span className="mt-1 block text-xs leading-5 text-[var(--text-soft)]">{item.description} · Official independent source</span></span>
        <ArrowUpRight size={16} className="shrink-0" aria-hidden="true"/>
       </a>;
    })}
   </nav>
  </div>
  {guide.pillar==="Travel"&&
   <div className="gth-glass rounded-2xl border border-[var(--border)] p-5 sm:p-7">
    <h2 className="text-xl font-bold">Existing travel partners and booking options</h2>
    <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
      Affiliate referrals, supplier search pages and embedded GTH widgets are different. Only previously configured public
      referral destinations are listed; the provider controls actual booking, terms and availability.
    </p>
    <nav aria-label="Approved source paths for travel referrals" className="mt-4 grid gap-3 sm:grid-cols-2">
     {partners.map(p=>{
       const body=<><span><strong className="text-sm">{p.name}</strong>
       <span className="mt-1 block text-xs text-[var(--text-soft)]">{p.detail} · {p.external?"Affiliate referral":"Existing GTH supplier widget"}</span></span>
       <ArrowUpRight size={16} className="shrink-0" aria-hidden="true"/></>;
       const css="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4 hover:underline";
       return p.external?<a key={p.slug} href={p.destination} target="_blank" rel="sponsored noopener noreferrer" className={css}>{body}</a>:
        <Link key={p.slug} href={p.destination} className={css}>{body}</Link>;
     })}
     {whiteLabel&&<a href={whiteLabel} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4 text-sm font-semibold hover:underline">
      <span>Nuitee-hosted Hotel White Label <span className="mt-1 block text-xs font-normal text-[var(--text-soft)]">Generic hotel booking search; dates and room quotes only on supplier</span></span>
      <ArrowUpRight size={16} aria-hidden="true" className="shrink-0"/>
     </a>}
     {getYourGuide&&<a href={getYourGuide} target="_blank" rel="sponsored noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4 text-sm font-semibold hover:underline">
      <span>GetYourGuide cruise search <span className="mt-1 block text-xs font-normal text-[var(--text-soft)]">Referral search · not a particular cruise or guaranteed booking</span></span>
      <ArrowUpRight size={16} aria-hidden="true" className="shrink-0"/>
     </a>}
     {klook&&<a href={klook} target="_blank" rel="sponsored noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4 text-sm font-semibold hover:underline">
      <span>Klook destination activity search <span className="mt-1 block text-xs font-normal text-[var(--text-soft)]">Existing Travelpayouts tracking, supplier-controlled results</span></span>
      <ArrowUpRight size={16} aria-hidden="true" className="shrink-0"/>
     </a>}
    </nav>
    <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">
     Eligible referral purchases may generate commission. Not every Travelpayouts programme has an individually verified public deep link on GTH PRO.
     Read the <Link href="/affiliate-disclosure" className="underline">affiliate disclosure</Link>.
    </p>
   </div>}
  <div className="gth-glass rounded-2xl border border-[var(--border)] p-5 sm:p-7">
   <h2 className="flex items-center gap-2 text-lg font-bold"><BookOpen size={18} aria-hidden="true"/> Further GTH PRO reading</h2>
   <nav aria-label="Related editorial articles" className="mt-4 grid gap-3">
    {related.map(item=><Link href={"/blog/"+item.slug} key={item.slug} className="text-sm font-semibold underline underline-offset-4">{item.title}</Link>)}
   </nav>
   <nav aria-label="GTH PRO knowledge pillars" className="mt-6 flex flex-wrap gap-2">
    {[{href:pillarGuides,label:guide.pillar+" guides"},{href:pillarHome,label:guide.pillar+" hub"},
    {href:"/blog",label:"All blog articles"},{href:"/real-estate/guides",label:"Property guides"},
    {href:"/knowledge/tenders",label:"Tender guides"},{href:"/tickets",label:"Ticket guides"}].map(x=>
     <Link key={x.href+x.label} href={x.href} className="gth-btn inline-flex min-h-11 items-center rounded-xl px-4 text-xs font-semibold">{x.label}</Link>
    )}
   </nav>
   {guide.pillar==="Travel"&&<nav aria-label="All related GTH travel services" className="mt-6 flex flex-wrap gap-2">
    {services.map(x=><Link key={x.href} href={x.href} className="gth-btn inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-semibold">{x.label}</Link>)}
   </nav>}
   <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]">
    <ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true"/>
    Check current details with the relevant official authority or supplier. Editorial content is not a reservation, official procurement notice or property title opinion.
   </p>
  </div>
 </section>;
}
