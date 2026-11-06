import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowUpRight,Anchor,Check,MapPin,Search,Ship} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import IndianWaters,{indianWaterOptions,filterIndianWaters,indianCruiseHref} from "@/components/travel/IndianWaters";
import {cruises,cruisePhotos,cruiseTypes,filterCruises,CRUISE_REVIEWED_ON,type Cruise} from "@/lib/travel/cruises";
import {buildCruiseProviderSearch,type CruiseSearchType} from "@/lib/travel/cruise-provider-search";

export const metadata:Metadata={title:"Cruises | Cruise Holidays, Harbour & Dinner Sailings | GTH PRO",description:"Explore Disney Adventure, Genting Dream, Royal Caribbean and sightseeing cruises with GTH PRO. Browse reviewed Klook and GetYourGuide cruise product listings and search for more destinations.",alternates:{canonical:"/cruises"}};

type Params=Record<string,string|string[]|undefined>;
function CruiseCard({item}:{item:Cruise}){
 return <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]" data-cruise={item.slug}>
  <div className="relative aspect-[16/9] overflow-hidden">
   <Image src={item.image} alt={item.photo.alt} fill unoptimized sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover"/>
   <a href={`/go/cruises/${item.slug}`} target="_blank" rel="noopener noreferrer sponsored" aria-label={`View ${item.title} on Klook`} className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--gold)]"/>
  </div>
  <div className="flex flex-1 flex-col p-5">
   <p className="text-xs text-[var(--text-soft)]">{item.photo.caption}</p>
   <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--gold)]"><span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true"/>{item.city}</span><span>{item.duration}</span></div>
   <h3 className="mt-3 text-xl font-bold leading-snug"><a href={`/go/cruises/${item.slug}`} target="_blank" rel="noopener noreferrer sponsored" className="hover:underline focus-visible:underline">{item.title}</a></h3>
   <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{item.summary}</p>
   <ul className="mt-4 space-y-2 text-sm">{item.highlights.map(text=><li key={text} className="flex items-start gap-2"><Check size={15} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/><span>{text}</span></li>)}</ul>
   <div className="mt-auto pt-5">
    <a href={`/go/cruises/${item.slug}`} target="_blank" rel="noopener noreferrer sponsored" aria-label={`Check dates and packages for ${item.title}`} className="gth-btn-gold flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">Check dates & packages<ArrowUpRight size={16} aria-hidden="true"/></a>
    <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">Opens this cruise on Klook. Final fares and availability are confirmed there.</p>
   </div>
  </div>
 </article>;
}
export default async function CruisesPage({searchParams}:{searchParams:Promise<Params>}){
 const params=await searchParams;
 const rawCity=params.destination??"",rawType=params.type??"",rawProvider=params.provider??"";
 const destination=typeof rawCity==="string"?rawCity.normalize("NFKC").trim().replace(/\s+/gu," "):"";
 const type=typeof rawType==="string"?rawType:"";
 const provider=typeof rawProvider==="string"?rawProvider:"invalid";
 const valid=typeof rawCity==="string"&&typeof rawType==="string"&&destination.length<=80&&(!destination||(destination.length>=2&&/^[\p{L}\p{M}\p{N}\s.'’-]+$/u.test(destination)))&&(!type||cruiseTypes.some(item=>item.id===type))&&["","gyg","klook"].includes(provider);
 const selected=valid?filterCruises(destination,type):[...cruises];
 const selectedIndia=valid?filterIndianWaters(destination,type):[...indianWaterOptions];
 const holiday=selected.filter(item=>item.type==="holiday"),day=selected.filter(item=>item.type!=="holiday");
 // Exact reviewed titles use the SAME link as the displayed card. Broad city
 // and partial-name searches filter both collections; unknown places hand off.
 const normalizedTitle=(value:string)=>value.normalize("NFKC").trim().toLocaleLowerCase();
 const namedInternational=valid&&destination?selected.find(item=>normalizedTitle(item.title)===normalizedTitle(destination)):undefined;
 const namedIndia=valid&&destination?selectedIndia.find(item=>item.sourceUrl&&normalizedTitle(item.title)===normalizedTitle(destination)):undefined;
 const exactProduct=provider===""&&valid?(namedInternational?`/go/cruises/${namedInternational.slug}`:namedIndia?indianCruiseHref(namedIndia):null):null;
 if(exactProduct)redirect(exactProduct);
 const shouldHandoff=valid&&Boolean(destination)&&(provider!==""||(selected.length===0&&selectedIndia.length===0));
 const outbound=shouldHandoff?buildCruiseProviderSearch(destination,provider==="klook"?"klook":"gyg",type as CruiseSearchType):null;
 if(outbound)redirect(outbound);
 return <main className="min-h-screen min-w-0 bg-[var(--bg)] text-[var(--text)]">
  <TravelSectionNav/>
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
   <header className="gth-glass rounded-3xl border border-[var(--border)] p-5 sm:p-8">
    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Ship size={18} aria-hidden="true"/>GTH PRO · Cruise journeys</p>
    <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">A different way to see the world.</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">Find your next cruise holiday, harbour escape or dinner on the water. Explore the options here, then choose your dates and package with Klook or GetYourGuide.</p>
    <nav aria-label="Cruise collections" className="mt-5 flex flex-wrap gap-3"><a href="#cruise-options" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">Explore cruises<Anchor size={16} aria-hidden="true"/></a><a href="#indian-waters" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-sm">Explore Indian Waters</a><Link href="/ferry" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-sm">Need a ferry instead?</Link></nav>
   </header>
   <section id="cruise-options" aria-label="Find a cruise" className="mt-6 scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
    <h2 className="text-xl font-bold">Find your cruise</h2>
    <form key={valid?`${destination}:${type}:${provider}`:"invalid"} action="/cruises#cruise-options" method="GET" role="search" aria-label="Filter cruise options" className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto]">
     <label className="block w-full min-w-0 text-sm font-semibold">Destination or cruise name<input type="search" name="destination" maxLength={80} defaultValue={valid?destination:""} placeholder="Singapore, Goa, Kerala, Mumbai, Andaman…" className="mt-2 block min-h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"/></label>
     <label className="block w-full min-w-0 text-sm font-semibold">Cruise type<select aria-label="Cruise type" name="type" defaultValue={valid?type:""} className="mt-2 block min-h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"><option value="">All cruises</option>{cruiseTypes.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
     <label className="block w-full min-w-0 text-sm font-semibold">Search provider<select aria-label="Search provider" name="provider" defaultValue={valid?provider:""} className="mt-2 block min-h-12 w-full min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-[var(--text)]"><option value="">Auto · GetYourGuide for new destinations</option><option value="gyg">GetYourGuide results</option><option value="klook">Klook results</option></select></label>
     <button className="gth-btn-gold inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold lg:w-auto" type="submit"><Search size={16} aria-hidden="true"/>Show cruises</button>
     {(destination||type)&&<Link href="/cruises#cruise-options" className="inline-flex min-h-12 items-center px-2 text-sm underline">Clear filters</Link>}
    </form>
    <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">Known destinations and partial cruise names filter cards here. Enter an exact published cruise title to open its product; other destinations search GetYourGuide. Select Klook to search there instead. Supplier results may vary.</p>
    {!valid&&<p role="alert" className="mt-3 text-sm">Choose a valid destination and cruise type. All cruise options are shown below.</p>}
    <p className="mt-4 text-sm text-[var(--text-soft)]" role="status">{selected.length+selectedIndia.length} matching cruise options · {selected.length} international · {selectedIndia.length} Indian waters</p>
   </section>
   {holiday.length>0&&<section aria-labelledby="holiday-cruises" className="mt-8"><h2 id="holiday-cruises" className="text-2xl font-bold">Cruise holidays</h2><p className="mt-2 text-sm text-[var(--text-soft)]">Compare ships, sailing dates and cabin options for your time at sea.</p><div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">{holiday.map(item=><CruiseCard key={item.slug} item={item}/>)}</div></section>}
   {day.length>0&&<section aria-labelledby="day-cruises" className="mt-10"><h2 id="day-cruises" className="text-2xl font-bold">Harbour, river & dinner cruises</h2><p className="mt-2 text-sm text-[var(--text-soft)]">Shorter experiences for a day out or an evening on the water.</p><div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">{day.map(item=><CruiseCard key={item.slug} item={item}/>)}</div></section>}
   <IndianWaters options={selectedIndia}/>
   <section aria-labelledby="cruise-planning" className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"><h2 id="cruise-planning" className="text-xl font-bold">Before you book</h2><div className="mt-4 grid gap-4 text-sm leading-6 sm:grid-cols-3"><p><strong>Choose the right package.</strong> Check the sailing date, itinerary, cabin occupancy, child ages and boarding port.</p><p><strong>Review the full fare.</strong> Confirm taxes, port charges, gratuities, transfers and cancellation conditions for the selected package.</p><p><strong>Check travel requirements.</strong> Confirm passports, visas and the cruise operator’s boarding rules before paying.</p></div><p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">GTH PRO provides cruise discovery and affiliate referrals. Booking, payment, confirmation and support are handled by the selected partner (Klook or GetYourGuide) and the cruise operator. We may earn a commission from eligible bookings. Product pages last reviewed: {CRUISE_REVIEWED_ON}. Vessel photographs are historical editorial images; representative boat images do not identify a guaranteed package vessel. Catalogue listings do not guarantee current sailings or cabin availability.</p></section>
   <details id="cruise-photo-credits" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-xs text-[var(--text-soft)]"><summary className="flex min-h-11 cursor-pointer items-center font-semibold">Cruise photo credits</summary><ul className="mt-3 space-y-3">{cruisePhotos.map(photo=><li key={photo.path}><a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{photo.caption} — {photo.author}</a>{" · "}<a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{photo.license}</a>{" · "}{photo.modifications}</li>)}</ul></details>
  </div>
 </main>;
}
