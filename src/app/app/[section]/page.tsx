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
 const q=normalizeAppQuery(await searchParams);
 const current=sections[section];
 const Icon=current.Icon;
 const result=await listAppRecords(section,q);
 const kind=section==="flights"||section==="destinations"?"destination":
   section==="hotels"?"hotel":section==="property"?"property":"tender";
 const facets=section==="hotels"?HOTEL_CATEGORIES:
   section==="tenders"?TENDER_CATEGORIES:
   section==="property"?PROPERTY_CATEGORIES:[];
 const title=q.category?(facets.find(t=>t.id===q.category)?.name||current.name):current.name;
 const destination=appQueryHref(section,q,{page:1});
 const pages=Math.min(100,Math.ceil(result.total/result.size));
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
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
  {section==="flights"?<MobileFlightSearch/>:
   <form action={"/app/"+section} method="get"
     className="mx-4 mt-3 grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 sm:mx-6" role="search">
     {section==="hotels"&&<input type="hidden" name="directory" value="1"/>}
     <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3">
       <Search size={16} className="shrink-0 text-[var(--text-soft)]" aria-hidden="true"/>
       <input name="q" defaultValue={q.q} maxLength={70} aria-label={"Search "+current.name}
        placeholder={section==="hotels"?"Hotel name":section==="property"?"Search properties":section==="tenders"?"Tender keyword":"Destination"}
        className="h-11 min-w-0 w-full bg-transparent text-sm outline-none"/>
     </label>
     {q.category&&<input type="hidden" name="category" value={q.category}/>}
     {q.country&&<input type="hidden" name="country" value={q.country}/>}
     {q.destination&&<input type="hidden" name="destination" value={q.destination}/>}
     <button type="submit" className="gth-btn-gold min-h-11 rounded-xl px-4 text-xs font-semibold">Search</button>
   </form>}
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
       {q.q||q.category?"No matching published records for these filters.":"No public records currently available."}
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
   <Link href="/mega-aggregator" className="underline">Open website</Link>
  </footer>
 </main>;
}
