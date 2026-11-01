import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {resolveUniversalTarget} from "@/lib/mobile/universal-search";
import {ArrowLeft,ArrowRight,Bookmark,Building2,FileSearch,Globe2,Hotel,Search,ShieldCheck} from "lucide-react";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileDiscoveryRail from "@/components/mobile/MobileDiscoveryRail";
import {appQueryHref} from "@/lib/mobile/catalog";
import {normalizeExploreQuery,searchGlobalRecords,type ExplorePillar} from "@/lib/mobile/global-discovery";
import type {MobileDiscoveryKind} from "@/lib/mobile/discovery";
import type {MobileSection} from "@/lib/mobile/routes";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Discover Everywhere | GTH PRO App",
 description:"One source-aware search across destinations, hotels, real estate and public tenders.",
 robots:{index:false,follow:false}};

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
const choices=[
 {id:"all",title:"Everything",Icon:Globe2,description:"Search all public sources"},
 {id:"travel",title:"Travel",Icon:Hotel,description:"Destinations & hotels"},
 {id:"property",title:"Property",Icon:Building2,description:"Project records"},
 {id:"tender",title:"Tenders",Icon:FileSearch,description:"Published notices"},
] as const;

const meta:Record<"destinations"|"hotels"|"property"|"tenders",{kind:MobileDiscoveryKind;heading:string;description:string}>={
 destinations:{kind:"destination",heading:"Destination guides",description:"Curated city guides, not live booking offers"},
 hotels:{kind:"hotel",heading:"Accommodation records",description:"Source-backed locations; verify availability with providers"},
 property:{kind:"property",heading:"Property research",description:"Public project records; independently confirm ownership and price"},
 tenders:{kind:"tender",heading:"Open procurement notices",description:"Source-verified published notices; confirm deadlines with the authority"},
};
function exploreHref(q:string,pillar:ExplorePillar){
 // Category tiles must go to working specialist engines, not reload the same page.
 if(pillar!=="all"){
  const params=new URLSearchParams({category:pillar});
  if(q)params.set("q",q);
  return "/app/search?"+params.toString();
 }
 return "/app/explore"+(q?"?"+new URLSearchParams({q}).toString()+"#search-results":"");
}

export default async function GlobalAppExplore({searchParams}:Props){
 const {q,pillar}=normalizeExploreQuery(await searchParams);
 // Existing saved/bookmarked Explore links must also resolve specialist intents.
 // The generic city search stays federated; hotel/property/tender intent goes
 // directly to its working results page.
 if(q.length>=2){
  const target=resolveUniversalTarget(q,pillar);
  if(target.category!=="all")redirect(target.href);
 }
 const searched=q.length>=2;
 const results=searched?await searchGlobalRecords(q,pillar):[];
 const total=results.reduce((sum,result)=>sum+result.data.total,0);
 const failures=results.filter(result=>Boolean(result.data.error)).length;
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(96px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <div className="mx-auto max-w-6xl">
   <header className="px-4 pt-4 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <Link href="/app" className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
      <ArrowLeft size={16} aria-hidden="true"/> App home
     </Link>
     <Link href="/app/board" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-semibold">
      <Bookmark size={16} className="text-[var(--gold)]" aria-hidden="true"/> Research Desk
     </Link>
    </div>
    <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] sm:p-6">
     <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--gold)]">GTH PRO · Discover everywhere</p>
     <h1 className="mt-2 max-w-xl text-xl font-bold leading-snug tracking-tight sm:text-3xl">
      Find the next opportunity. Anywhere.
     </h1>
     <p className="mt-2 max-w-xl text-xs leading-5 text-[var(--text-soft)] sm:text-sm">
      One starting point for travel, property and public tenders. Real records, their original specialist tools.
     </p>
     <form action="/app/search" method="get" role="search" className="mt-4">
      {pillar!=="all"&&<input type="hidden" name="category" value={pillar}/>}
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1.5 focus-within:outline-2 focus-within:outline-[var(--gold)]">
       <Search size={19} aria-hidden="true" className="ml-2 shrink-0 text-[var(--gold)]"/>
       <input name="q" aria-label="Search global destinations, property and tenders"
        type="search" minLength={2} maxLength={70} required defaultValue={q}
        placeholder="Goa hotels, Mumbai flats, tenders…"
        className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"/>
       <button type="submit" className="gth-btn-gold inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-4 text-xs font-bold sm:text-sm">
        Search <ArrowRight size={15} aria-hidden="true"/>
       </button>
      </div>
     </form>
     <p className="mt-2 text-[11px] leading-5 text-[var(--text-soft)]">
      Searches use existing GTH PRO service engines; prices and availability require source confirmation.
     </p>
    </div>
    <nav aria-label="Choose a discovery ecosystem" className="-mx-4 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
     {choices.map(({id,title,Icon,description})=><Link key={id} href={exploreHref(q,id)}
       aria-current={pillar===id?"page":undefined}
       className={"flex min-h-14 min-w-[118px] shrink-0 snap-start items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--gold)] sm:min-w-0 "+
       (pillar===id?"border-[var(--gold)] bg-[var(--card)]":"border-[var(--border)] bg-[var(--bg-soft)]")}>
       <Icon size={18} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
       <span className="min-w-0"><span className="block">{title}</span>
        <span className="hidden text-[10px] font-normal text-[var(--text-soft)] sm:block">{description}</span>
       </span>
      </Link>)}
    </nav>
   </header>
   {!searched?<section className="px-4 py-7 sm:px-6" aria-label="Popular research journeys">
     <h2 className="text-lg font-semibold">Pick up where your plans begin</h2>
     <p className="mt-1 text-sm text-[var(--text-soft)]">Explore a specialist service, then save what matters to your Research Desk.</p>
     <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {[{href:"/app/destinations",title:"Plan a journey",detail:"Destinations, then verified hotel and flight handoffs",Icon:Globe2},
        {href:"/app/property",title:"Research a property",detail:"Project evidence, source information and existing workspace",Icon:Building2},
        {href:"/app/tenders",title:"Review tenders",detail:"Official notices, deadlines and source links",Icon:FileSearch}
      ].map(({href,title,detail,Icon})=><Link key={href} href={href} className="flex min-h-32 flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
       <Icon size={23} className="text-[var(--gold)]" aria-hidden="true"/>
       <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{detail}</p></div>
      </Link>)}
     </div>
    </section>:
    <section id="search-results" className="scroll-mt-24 pt-6" aria-label="Live public-source search results">
     <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
      <h2 className="text-lg font-semibold">Results for “{q}”</h2>
      <span className="text-xs text-[var(--text-soft)]">{total.toLocaleString("en-IN")} records reported by sources</span>
     </div>
     {failures>0&&<div role="status" className="mx-4 mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm text-[var(--text-soft)] sm:mx-6">
      {failures} public {failures===1?"source is":"sources are"} temporarily unavailable. Other results remain usable.
     </div>}
     {results.every(r=>r.data.items.length===0)&&<div className="mx-4 mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--text-soft)] sm:mx-6">
      No matching public records were returned. Try a broader term or search each specialist directory.
     </div>}
     {results.map(({section,data})=>{
      if(section==="flights")return null;
      const info=meta[section as keyof typeof meta];
      if(!info||data.items.length===0)return null;
      const query={q,country:"",category:"",destination:"",page:1};
      return <MobileDiscoveryRail key={section} kind={info.kind} heading={info.heading}
       description={info.description+" · "+data.total.toLocaleString("en-IN")+" source matches"}
       href={appQueryHref(section,query)} items={data.items.slice(0,8)} appLinks/>;
     })}
     <div className="mx-4 mt-5 flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--text-soft)] sm:mx-6">
      <ShieldCheck size={18} className="mt-1 shrink-0 text-[var(--gold)]" aria-hidden="true"/>
      Search does not certify property ownership or tender eligibility or confirm a hotel room / flight price.
      Open each source or booking provider to verify current details.
     </div>
    </section>}
  </div>
 </main>;
}
