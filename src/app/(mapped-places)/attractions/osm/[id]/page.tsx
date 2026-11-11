import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,ArrowUpRight,Compass,ExternalLink,MapPin,Navigation,Route,ShieldCheck,Ticket} from "lucide-react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";
import JsonLd from "@/components/seo/JsonLd";
import {isPublicLaunch,siteUrl} from "@/lib/seo/site";
import {getOsmPlace,relatedOsmPlaces} from "@/lib/travel/osm-place-reader";
import {isIndexableOsmPlace,osmPlacePath,osmPlaceSeo,osmPlaceLinks,osmPlaceSchema} from "@/lib/travel/osm-place";
import {directoryHref} from "@/lib/travel/osmAttractions";
import {ATTRACTION_TICKET_PARTNERS,attractionTicketQueryLabel,isTicketOrientedCategory} from "@/lib/travel/attraction-ticket-partners";

// Never enumerate the imported directory at build time. One requested page is
// generated, then shared as ISR HTML for 24 hours. Source cache is shared too.
export const revalidate=86400;
export const dynamicParams=true;
export function generateStaticParams(){return [];}
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {id}=await params,item=await getOsmPlace(id);
 if(!item)notFound();
 const path=osmPlacePath(item.source_id)!,seo=osmPlaceSeo(item);
 const index=isPublicLaunch()&&isIndexableOsmPlace(item);
 return {...seo,alternates:{canonical:path},robots:{index,follow:true},
 openGraph:{...seo,url:path,type:"website",images:[]},twitter:{card:"summary",...seo,images:[]}};
}
export default async function OsmPlacePage({params}:Props){
 const {id}=await params,item=await getOsmPlace(id);if(!item)notFound();
 const path=osmPlacePath(item.source_id)!,links=osmPlaceLinks(item);
 const location=[item.city,item.country_name].filter(Boolean).join(", ");
 const related=item.country_code?(await relatedOsmPlaces(item.country_code).catch(()=>[])).filter(row=>row.source_id!==item.source_id).slice(0,5):[];
 const browse=directoryHref({country:item.country_code||undefined,city:item.city||undefined});
 const updated=item.updated_at&&Number.isFinite(Date.parse(item.updated_at))?new Date(item.updated_at):null;
 const index=isPublicLaunch()&&isIndexableOsmPlace(item);
 const breadcrumb={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[
 {"@type":"ListItem",position:1,name:"Tours & activities",item:siteUrl("/tours")},
 {"@type":"ListItem",position:2,name:"Mapped attractions",item:siteUrl("/attractions")},
 {"@type":"ListItem",position:3,name:item.name,item:siteUrl(path)}]};
 return <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  {index&&<><JsonLd data={breadcrumb}/><JsonLd data={osmPlaceSchema(item,siteUrl(path))}/></>}
  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
   <header data-travel-hero="true" className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-8">
    <Link prefetch={false} href="/attractions" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><ArrowLeft size={16}/> Explore attractions</Link>
    <div className="mt-5 grid items-start gap-7 md:grid-cols-[minmax(0,1fr)_220px]">
     <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO · Discover a place</p>
      <h1 className="mt-3 break-words text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{item.name}</h1>
      <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[var(--text-soft)]"><MapPin size={18} className="mt-1 shrink-0"/>{location||"Location recorded by OpenStreetMap contributors"}</p>
      <p className="mt-3 inline-flex rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold capitalize">{item.category.replaceAll("-"," ")}</p>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">Find the recorded map location, plan your journey and compare independent experiences around {item.name}. Current visitor access and ticket availability are confirmed by the venue or booking provider.</p>
     </div>
     <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-6 text-center">
      <Compass size={56} strokeWidth={1} className="text-[var(--text-soft)]" aria-hidden="true"/>
      <p className="text-xs font-semibold uppercase tracking-wider">Your starting point</p>
      <p className="font-mono text-xs leading-6 text-[var(--text-soft)]">{item.latitude.toFixed(5)}<br/>{item.longitude.toFixed(5)}</p>
      <a href={links.map} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline">Open map <ArrowUpRight size={15}/></a>
     </div>
    </div>
    <div className="mt-7 flex flex-wrap gap-3">
     <a href={links.directions} target="_blank" rel="noopener noreferrer" className="gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"><Navigation size={17}/> Get directions</a>
     <a href="#experiences" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold"><Ticket size={17}/> Find experiences</a>
     <Link prefetch={false} href={browse} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-5 py-3 text-sm">Explore this area</Link>
    </div>
   </header>
   <TravelSectionNav/>
   <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
    <section aria-labelledby="place-facts" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
     <h2 id="place-facts" className="text-xl font-bold">Know the place</h2>
     <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
      <div><dt className="text-xs text-[var(--text-soft)]">Recorded name</dt><dd className="mt-1 break-words font-semibold">{item.name}</dd></div>
      <div><dt className="text-xs text-[var(--text-soft)]">Mapped category</dt><dd className="mt-1 capitalize">{item.category.replaceAll("-"," ")}</dd></div>
      <div><dt className="text-xs text-[var(--text-soft)]">City tag</dt><dd className="mt-1">{item.city||"Not provided in the source"}</dd></div>
      <div><dt className="text-xs text-[var(--text-soft)]">Country source group</dt><dd className="mt-1">{item.country_name||"Not recorded"}</dd></div>
      <div><dt className="text-xs text-[var(--text-soft)]">Coordinates</dt><dd className="mt-1">{item.latitude}, {item.longitude}</dd></div>
      <div><dt className="text-xs text-[var(--text-soft)]">Source reference</dt><dd className="mt-1 font-mono text-xs">{item.source_id}</dd></div>
     </dl>
     {updated&&<p className="mt-5 text-xs text-[var(--text-soft)]">Record last imported: <time dateTime={updated.toISOString()}>{updated.toLocaleDateString("en-IN",{dateStyle:"long",timeZone:"Asia/Kolkata"})}</time>. This is not a live venue-status check.</p>}
     <a href={item.source_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline">Check original OpenStreetMap record <ExternalLink size={15}/></a>
    </section>
    <section aria-labelledby="visit-checks" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
     <h2 id="visit-checks" className="text-xl font-bold">Before you visit</h2>
     <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[var(--text-soft)]">
      <li>Confirm current opening hours, entry rules and accessibility with the venue.</li>
      <li>Check whether admission is free, ticketed or included in a specific tour.</li>
      <li>Review the actual meeting point, transport, inclusions and cancellation terms before paying.</li>
     </ul>
     <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">The imported record does not contain verified facilities, opening hours, official contact details or ticket prices. No facilities or offers are inferred from map tags.</p>
    </section>
   </div>
   <section id="experiences" aria-labelledby="partner-options" className="mt-8 scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-soft)]">Your next step</p>
    <h2 id="partner-options" className="mt-2 text-2xl font-bold">Find tickets and experiences around {item.name}</h2>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">These links search for the recorded place and location. Results may include nearby or similarly named experiences; they are not a confirmed ticket for this map record. Select your dates and travellers with the provider.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
     <a href={links.klook} target="_blank" rel="sponsored noopener noreferrer" className="flex min-h-36 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5"><span className="text-base font-bold">{attractionTicketQueryLabel(item.category)}</span><span className="text-xs leading-6 text-[var(--text-soft)]">Search this place by name and source location; only the provider confirms a matching offer</span><span className="inline-flex items-center gap-2 text-sm font-semibold underline">Search this place <ArrowUpRight size={16}/></span></a>
     <a href={links.getyourguide} target="_blank" rel="sponsored noopener noreferrer" className="flex min-h-36 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5"><span className="text-base font-bold">Tours & experiences</span><span className="text-xs leading-6 text-[var(--text-soft)]">Search independent tours and experiences</span><span className="inline-flex items-center gap-2 text-sm font-semibold underline">Search this place <ArrowUpRight size={16}/></span></a>
     <a href={ATTRACTION_TICKET_PARTNERS.kkday.href} target="_blank" rel="sponsored noopener noreferrer"
       className="flex min-h-36 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
       <span className="text-base font-bold">KKday attractions & local experiences</span>
       <span className="text-xs leading-6 text-[var(--text-soft)]">Browse KKday through our existing tracked Travelpayouts link. This opens partner discovery; it is not an exact ticket for {item.name}.</span>
       <span className="inline-flex items-center gap-2 text-sm font-semibold underline">Browse partner listings <ArrowUpRight size={16}/></span>
     </a>
     {isTicketOrientedCategory(item.category)&&<a href={ATTRACTION_TICKET_PARTNERS.tiqets.href} target="_blank" rel="noopener noreferrer nofollow"
       className="flex min-h-36 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
       <span className="text-base font-bold">Tiqets museums & attraction entry</span>
       <span className="text-xs leading-6 text-[var(--text-soft)]">Search the independent Tiqets catalogue for matching admission options. Direct website link; affiliate tracking has not yet been verified.</span>
       <span className="inline-flex items-center gap-2 text-sm font-semibold underline">Browse supplier tickets <ArrowUpRight size={16}/></span>
     </a>
}
     <Link prefetch={false} href={links.tours} className="flex min-h-36 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5"><span className="text-base font-bold">Audio & self-guided tours</span><span className="text-xs leading-6 text-[var(--text-soft)]">Browse our existing audio-tour catalogue. Choose a matching product.</span><span className="inline-flex items-center gap-2 text-sm font-semibold underline">Explore supplier tours <ArrowUpRight size={16}/></span></Link>
    </div>
    <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">Affiliate disclosure: eligible bookings may earn GTH PRO a commission. Providers confirm inventory, final prices, payment and cancellation. <Link prefetch={false} href="/affiliate-disclosure" className="underline">How affiliate links work</Link>.</p>
   </section>
   <section aria-labelledby="journey-planning" className="mt-8">
    <h2 id="journey-planning" className="flex items-center gap-2 text-xl font-bold"><Route size={20}/> Complete your journey</h2>
    <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">Use the existing GTH PRO search forms. Choose your real destination, dates and route; no station or supplier product ID is guessed from this place.</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
     {[["/hotels","Find a stay"],["/flights","Compare flights"],["/bus","Bus journeys"],["/train","Train journeys"],["/ferry","Ferry journeys"],["/transfers","Airport transfer"]].map(([href,label])=><Link key={href} prefetch={false} href={href} className="flex min-h-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-center text-sm font-semibold">{label}</Link>)}
    </div>
   </section>
   {related.length>0&&<section aria-labelledby="more-places" className="mt-10">
    <h2 id="more-places" className="text-xl font-bold">More mapped places in {item.country_name}</h2>
    <p className="mt-2 text-xs leading-6 text-[var(--text-soft)]">Other records from the same country source group; distance and access are not verified.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{related.map(row=><Link key={row.source_id} prefetch={false} href={osmPlacePath(row.source_id)!} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><p className="text-xs capitalize text-[var(--text-soft)]">{row.category.replaceAll("-"," ")}</p><h3 className="mt-2 break-words font-semibold">{row.name}</h3><p className="mt-2 text-xs text-[var(--text-soft)]">{row.city||row.country_name}</p></Link>)}</div>
   </section>}
   <footer className="mt-10 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={20} className="mt-1 shrink-0"/><p>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap contributors</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer" className="underline">ODbL 1.0</a>, via Geofabrik. Country labels describe imported extract scope and may include border overlaps. Community map records do not certify operating status, entry availability or bookable tours. Pages refresh on a 24-hour cache cycle.</p></footer>
  </div>
 </main>;
}
