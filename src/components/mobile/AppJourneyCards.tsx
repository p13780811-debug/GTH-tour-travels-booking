import Image from "next/image";
import Link from "next/link";
import {ArrowUpRight,Building2,Globe2,BriefcaseBusiness,Ticket} from "lucide-react";

/** Editorial journeys only; imagery is never presented as a specific verified listing. */
const journeys=[
 {id:"travel",eyebrow:"01 · Discover",title:"Go somewhere extraordinary",description:"Plan flights, stays and experiences.",href:"/app/flights",image:"/images/mega/welcome.jpg",Icon:Globe2,links:[{title:"Hotels",href:"/app/hotels"},{title:"Tours",href:"/app/services/tours"}]},
 {id:"property",eyebrow:"02 · Explore",title:"Find your next address",description:"Research properties and registry projects.",href:"/app/property",image:"/images/real-estate.jpg",Icon:Building2,links:[{title:"Projects",href:"/app/property"},{title:"Property tools",href:"/app/services/property-tools"}]},
 {id:"tender",eyebrow:"03 · Grow",title:"Turn opportunity into progress",description:"Discover published tenders and sources.",href:"/app/tenders",image:"/images/tender.jpg",Icon:BriefcaseBusiness,links:[{title:"Find tenders",href:"/app/tenders"},{title:"Tender services",href:"/app/services/tender-help"}]},
 {id:"tickets",eyebrow:"04 · Experience",title:"Discover tickets worldwide",description:"Stadiums, live events, concerts and official ticket sources.",href:"/tickets",image:"/images/editorial/sports.svg",Icon:Ticket,links:[{title:"Ticket finder",href:"/tickets"},{title:"Stadiums",href:"/stadiums"}]}
] as const;

export default function AppJourneyCards(){
 return <section aria-labelledby="app-journeys-heading" className="mx-4 mt-5 sm:mx-6">
  <div className="mb-3 flex items-end justify-between gap-3">
   <div>
    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--gold)]">Made for your next move</p>
    <h2 id="app-journeys-heading" className="mt-1 text-lg font-bold tracking-tight sm:text-xl">Your world, beautifully connected.</h2>
   </div>
   <Link href="/app/explore" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-bold text-[var(--gold)]">
    Explore all <ArrowUpRight size={15} aria-hidden="true"/>
   </Link>
  </div>
  <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
   {journeys.map(({id,eyebrow,title,description,href,image,Icon,links})=>
    <article key={id} className="w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] sm:w-auto sm:max-w-none sm:shrink">
     <Link href={href} aria-label={title} className="group block focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
      <div className="relative h-32 overflow-hidden bg-[var(--bg-soft)] sm:h-36">
       <Image src={image} alt="" fill sizes="(max-width:640px) 80vw,(max-width:1024px) 33vw,380px" className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none"/>
       <span className="absolute bottom-3 left-3 inline-flex size-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--gold)] shadow-[var(--shadow)]">
        <Icon size={20} aria-hidden="true"/>
       </span>
      </div>
      <div className="px-4 pb-2 pt-3">
       <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--gold)]">{eyebrow}</p>
       <h3 className="mt-1 text-base font-bold leading-snug tracking-tight">{title}</h3>
       <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{description}</p>
      </div>
     </Link>
     <div className="mx-4 flex items-center gap-2 border-t border-[var(--border)] py-2">
      {links.map(link=><Link href={link.href} key={link.title} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-[var(--text-soft)] hover:text-[var(--gold)]">
       {link.title} <ArrowUpRight size={13} aria-hidden="true"/>
      </Link>)}
     </div>
    </article>)}
  </div>
  <p className="sr-only">Swipe horizontally to browse journeys on small screens.</p>
 </section>;
}
