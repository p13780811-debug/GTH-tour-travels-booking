import {ModuleHomeHero} from "@/components/mobile/LuxuryMarketplace";
import {destinationServicePhoto} from "@/lib/destinations/visual-media";
import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeft,ArrowRight,Building2,FileSearch,Globe2,Hotel,Plane,ShieldCheck,Search} from "lucide-react";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileDiscoveryRail from "@/components/mobile/MobileDiscoveryRail";
import MobileFlightSearch from "@/components/mobile/MobileFlightSearch";
import {appQueryHref,HOTEL_CATEGORIES,PROPERTY_CATEGORIES,TENDER_CATEGORIES,
 listAppRecords,normalizeAppQuery} from "@/lib/mobile/catalog";
import {isMobileSection, MOBILE_SECTIONS} from "@/lib/mobile/routes";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Explore | GTH PRO App",
 description:"App-only compact discovery and searches backed by existing GTH PRO public records.",
 robots:{index:false,follow:false}
};
const sections={
 flights:{name:"Flights",subtitle:"Airport search · verified data type",Icon:Plane},
 hotels:{name:"Hotels & stays",subtitle:"Source-attributed lodging · no invented prices",Icon:Hotel},
 property:{name:"Properties",subtitle:"Published real estate records",Icon:Building2},
 tenders:{name:"Open tenders",subtitle:"Official public procurement notices",Icon:FileSearch},
 destinations:{name:"Destinations",subtitle:"Explore world cities and travel guides",Icon:Globe2}
} as const;
export function generateStaticParams(){return MOBILE_SECTIONS.map(section=>({section}));}
type Props={params:Promise<{section:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function MobileAppSection({params,searchParams}:Props){
 const {section}=await params;
 if(!isMobileSection(section))notFound();
 const q=normalizeAppQuery(await searchParams,section);
 const current=sections[section];
 const Icon=current.Icon;
 const result=await listAppRecords(section,q);
 const kind=section==="flights"||section==="destinations"?"destination":
   section==="hotels"?"hotel":section==="property"?"property":"tender";
 const facets=section==="hotels"?HOTEL_CATEGORIES:
   section==="tenders"?TENDER_CATEGORIES:
   section==="property"?PROPERTY_CATEGORIES:[];
 const isBusiness=section==="property"||section==="tenders";
 const businessLinks=section==="property"?[
   ["/app/services/property-registry","Project registry"],
   ["/app/services/list-property","List a property"],
   ["/app/services/claim-project","Claim a project"],
 ]:[["/app/tenders/quote","Request a tender quote"]];
 const title=q.category?(facets.find(t=>t.id===q.category)?.name||current.name):current.name;
 const destination=appQueryHref(section,q,{page:1});
 const pages=Math.min(section==="destinations"?2000:100,Math.ceil(result.total/result.size));
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <ModuleHomeHero module={section==="property"?"Real estate":section==="tenders"?"Tenders":current.name} title={section==="property"?"Find your next address.":section==="tenders"?"Discover your next opportunity.":section==="destinations"?"A world of places to discover.":"Explore "+current.name.toLowerCase()} subtitle={current.subtitle} image={destinationServicePhoto(section==="property"?"properties":section)}>
  {section==="flights"?<MobileFlightSearch/>:
   <form action={"/app/"+section} method="get"
     className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3" role="search">
     {section==="hotels"&&<input type="hidden" name="directory" value="1"/>}
     <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
       <Search size={16} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true"/>
       <input name="q" defaultValue={q.q} maxLength={70} aria-label={"Search "+current.name}
        placeholder={section==="hotels"?"Hotel name":section==="property"?"Search properties":section==="tenders"?"Tender keyword":"Destination"}
        className="h-11 min-w-0 w-full bg-transparent text-sm outline-none"/>
     </label>
     {q.category&&<input type="hidden" name="category" value={q.category}/>}
     {q.country&&section!=="tenders"&&section!=="destinations"&&<input type="hidden" name="country" value={q.country}/>}
     {section==="destinations"&&<label className="col-span-2 text-xs font-semibold">Country code<input name="country" pattern="[A-Za-z]{2}" maxLength={2} defaultValue={q.country} placeholder="IN, JP, AU…" className="gth-input mt-1 w-full"/></label>}
     {section==="property"&&<label className="col-span-2 text-xs font-semibold">City
       <input name="city" maxLength={70} defaultValue={q.city} placeholder="Mumbai, Thane, Kolkata…" className="gth-input mt-1 w-full"/>
     </label>}
     {section==="tenders"&&<div className="col-span-2 grid grid-cols-2 gap-2">
       <label className="text-xs font-semibold">Country code
         <input name="country" pattern="[A-Za-z]{2}" maxLength={2} defaultValue={q.country} placeholder="IN, GB, CA…" className="gth-input mt-1 w-full"/>
       </label>
       <label className="text-xs font-semibold">Closing within
         <select name="closing" defaultValue={q.closing??""} className="gth-input mt-1 w-full">
           <option value="">Any time</option><option value="7">7 days</option><option value="30">30 days</option>
         </select>
       </label>
     </div>}
     {q.destination&&<input type="hidden" name="destination" value={q.destination}/>}
     <button type="submit" className="gth-btn-gold col-start-2 min-h-11 rounded-xl px-4 text-xs font-semibold">Search</button>
   </form>}
  </ModuleHomeHero>
  <header className="mx-4 mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:mx-6">
    <Link href="/app" className="inline-flex min-h-9 items-center gap-2 text-xs font-medium text-[var(--text-soft)]">
      <ArrowLeft size={15}/> App home
    </Link>
    <div className="mt-1 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold leading-tight tracking-tight">{current.name}</h1>
        <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{current.subtitle}</p>
      </div>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)]">
        <Icon size={21} className="text-[var(--gold)]"/>
      </span>
    </div>
  </header>
  {isBusiness&&<nav aria-label={section==="property"?"Property workspace tools":"Tender workspace tools"} className="mx-4 mt-3 flex flex-wrap gap-2 sm:mx-6">
    {businessLinks.map(([href,label],i)=><Link key={href} href={href} className={`inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold ${i===0?"gth-btn-gold":"gth-btn"}`}>{label}</Link>)}
    <Link href="/app/board" className="gth-btn inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold">Research Desk</Link>
  </nav>}
  {section==="destinations"&&<div className="mx-4 mt-3 text-xs text-[var(--text-soft)] sm:mx-6"><Link href="/destinations" prefetch={false} className="underline">Full worldwide directory and regional filters</Link></div>}
  {facets.length>0?<nav aria-label={section+" categories"} className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
    {facets.map(f=><Link key={f.id} href={appQueryHref(section,q,{category:f.id,page:1})}
     aria-current={q.category===f.id?"page":undefined}
     className={"flex min-h-10 shrink-0 items-center rounded-full border px-4 text-xs font-semibold "+
     (q.category===f.id?"border-[var(--gold)] bg-[var(--card)] text-[var(--text)]":"border-[var(--border)] bg-[var(--bg)] text-[var(--text-soft)]")}>
      {f.name}
    </Link>)}
   </nav>:null}
  {section==="flights"?<div className="mx-4 mt-2 text-xs leading-5 text-[var(--text-soft)] sm:mx-6">
      Fares are cached observations, not guaranteed bookable prices.
    </div>:null}
  {result.error?<div role="status" className="mx-4 mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm sm:mx-6">
     {result.error}. <Link href={destination} className="underline">Try again</Link>
   </div>:null}
  <div className="mx-auto mt-3 max-w-6xl">
   {result.total>0?<MobileDiscoveryRail appLinks kind={kind} heading={title} description={
      result.total.toLocaleString()+" records · "+result.items.length+" shown on page "+result.page+
      (section==="hotels"?" · verify rooms with provider":"")
    } href={destination} items={result.items}/>:
     !result.error?<div className="mx-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--text-soft)] sm:mx-6">
       {q.q||q.category||q.city||q.country||q.closing?"No matching published records for these filters.":"No public records currently available."}
     </div>:null}
  </div>
  {pages>1?<nav aria-label="App listing pages" className="mx-4 mt-4 flex items-center justify-between gap-3 sm:mx-6">
   {q.page>1?<Link href={appQueryHref(section,q,{page:q.page-1})}
     className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold">
     <ArrowLeft size={15}/> Previous</Link>:<span/>}
   <span className="text-xs text-[var(--text-soft)]">Page {q.page} of {pages}</span>
   {q.page<pages?<Link href={appQueryHref(section,q,{page:q.page+1})}
     className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold">
     Next <ArrowRight size={15}/></Link>:<span/>}
  </nav>:null}
  {section==="hotels"?<div className="mx-4 mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)] sm:mx-6">
    <ShieldCheck size={16} className="me-2 inline text-[var(--gold)]"/>
    GTH PRO source-backed accommodation directory; no unverified hotel rooms, reviews, ratings or photos.
   </div>:null}
  {section==="tenders"?<p className="mx-4 mt-5 text-xs leading-6 text-[var(--text-soft)] sm:mx-6">
    Official notice controls deadlines, eligibility and submission. Review the issuing authority before bidding.
   </p>:null}
  <footer className="mx-4 mt-6 flex flex-wrap gap-4 text-xs text-[var(--text-soft)] sm:mx-6">
   <Link href="/app" className="underline">Mobile home</Link>
   <Link href="/" className="underline">Website homepage</Link>
  </footer>
 </main>;
}
