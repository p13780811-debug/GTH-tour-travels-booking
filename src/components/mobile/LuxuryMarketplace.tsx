import {LUXURY_VISUALS} from "@/lib/destinations/visual-media";
import Link from "next/link";
import Image from "next/image";
import {ArrowRight,Search,ShieldCheck} from "lucide-react";
import type {ReactNode} from "react";
const services=[
 ["Hotels & stays","/app/hotels",LUXURY_VISUALS.hotels],
 ["Global flights","/app/flights",LUXURY_VISUALS.flights],
 ["Match passes","/app/services/tickets",LUXURY_VISUALS.tickets],
 ["Travel packages","/app/packages",LUXURY_VISUALS.packages],
 ["Destinations","/app/destinations",LUXURY_VISUALS.hero],
 ["Transport","/go/transport",LUXURY_VISUALS.transport],
 ["Real estate","/app/property",LUXURY_VISUALS.property],
 ["Tenders","/app/tenders",LUXURY_VISUALS.tenders]
] as const;
export function MarketplaceHero({title,subtitle,image}:{title:string;subtitle:string;image:string}){
 return <section data-marketplace-hero="true" className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6" aria-label={title}>
 <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
 <div className="relative aspect-[16/7] overflow-hidden"><Image src={image} alt="" fill unoptimized={image.startsWith("/images/luxury/")} sizes="(max-width:768px) 100vw, 1100px" className="object-cover"/><span className="absolute bottom-2 right-2 rounded-full bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative visual</span></div>
 <div className="p-4"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO Global</p><p className="mt-1 text-2xl font-bold tracking-tight">{title}</p><p className="mt-1 text-sm text-[var(--text-soft)]">{subtitle}</p></div>
 </div></section>;
}
export function MarketplaceServices(){return <section data-marketplace-services="true" className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><h2 className="text-xl font-bold">Explore the marketplace</h2><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{services.map(([name,href,image])=><Link key={href} href={href} prefetch={false} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]"><div className="relative aspect-[16/10]"><Image src={image} alt="" fill unoptimized={image.startsWith("/images/luxury/")} sizes="(max-width:768px) 50vw,25vw" className="object-cover"/></div><div className="p-3"><span className="block text-[10px] text-[var(--text-soft)]">AI illustrative visual</span><span className="flex min-h-11 items-center justify-between gap-1 text-sm font-semibold">{name}<ArrowRight size={15} className="shrink-0"/></span></div></Link>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-soft)]"><ShieldCheck size={18} className="shrink-0"/> Provider-operated booking handoffs · confirm prices and availability with the provider.</p></section>}

const hubs=[
 {name:"Melbourne (MCG)",subtitle:"Australia · cricket and events",href:"/stadiums/melbourne-cricket-ground",image:LUXURY_VISUALS.melbourne},
 {name:"Mumbai (Wankhede)",subtitle:"India · cricket and events",href:"/stadiums/wankhede-stadium",image:LUXURY_VISUALS.mumbai},
 {name:"Eden Gardens",subtitle:"India · cricket",href:"/stadiums/eden-gardens",image:LUXURY_VISUALS.tickets}
] as const;
export function FlagshipHubRail(){return <section data-marketplace-hubs="true" aria-label="Featured stadium hubs" className="mx-auto max-w-7xl px-4 pt-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold text-[var(--text)]">Flagship stadium hubs</h2><Link prefetch={false} href="/stadiums" className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)]">Explore venue guides</Link></div><div className="mt-3 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible">{hubs.map(hub=><Link key={hub.href} href={hub.href} prefetch={false} className="w-[62vw] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:w-auto sm:max-w-none"><div className="relative aspect-[4/3]"><Image src={hub.image} alt="" fill sizes="(max-width:640px) 62vw,25vw" className="object-cover" unoptimized/><span className="absolute bottom-2 left-2 rounded bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--text)]">AI illustrative visual</span></div><div className="p-3"><p className="font-bold text-[var(--text)]">{hub.name}</p><p className="mt-1 text-xs text-[var(--text-soft)]">{hub.subtitle}</p><span className="mt-3 flex min-h-10 items-center justify-between gap-1 text-sm font-semibold text-[var(--text)]">Explore hub <ArrowRight size={16}/></span></div></Link>)}</div><p className="text-xs text-[var(--text-soft)]">Illustrations are travel inspiration, not verified venue photographs. Actual tickets and bookings remain with the selected provider.</p></section>}

type QuickLink=readonly [string,string];
/** Shared module presentation. Existing search forms are passed as children, not cloned. */
export function ModuleHomeHero({module,title,subtitle,image,links=[],children,heading=false}:{module:string;title:string;subtitle:string;image:string;links?:readonly QuickLink[];children?:ReactNode;heading?:boolean}){
 const Heading=heading?"h1":"p";
 return <section data-module-home={module} className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 sm:pt-6" aria-label={module+" discovery"}>
  <div data-module-hero="true" className={"rounded-[2rem] border border-[var(--border)] bg-[var(--bg-soft)] "+(children?"pb-8":"pb-3")}>
   <div className="px-4 pb-3 pt-4 sm:px-6 sm:pt-6"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO · {module}</p><Heading className="mt-2 max-w-3xl text-[clamp(1.65rem,6.4vw,3.25rem)] font-bold leading-[1.12] tracking-tight text-[var(--text)]">{title}</Heading><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">{subtitle}</p>
    {!!links.length&&<nav aria-label={module+" quick links"} className="mt-3 flex flex-wrap gap-2">{links.map(([name,href])=><Link prefetch={false} key={href} href={href} className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--text)] sm:text-sm">{name}</Link>)}</nav>}
   </div>
   <div data-module-photo="true" className="relative mx-3 aspect-[16/9] max-h-[300px] overflow-hidden rounded-2xl sm:aspect-[21/9]"><Image src={image} alt="" fill unoptimized={image.startsWith("/images/luxury/")} sizes="(max-width:768px) 100vw, 1200px" className="object-cover"/><span className="absolute top-2 right-2 rounded bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative visual</span></div>
  </div>
  {children&&<div data-module-floating="true" className="relative z-10 mx-2 -mt-14 min-w-0 rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-3 text-[var(--text)] shadow-[var(--shadow)] backdrop-blur-xl sm:mx-6 sm:-mt-16 sm:p-5">{children}</div>}
 </section>;
}
export function ModuleSearchLink({href,label,description}:{href:string;label:string;description:string}){return <div className="flex min-w-0 items-center gap-3"><Search className="shrink-0" size={21} aria-hidden="true"/><div className="min-w-0 flex-1"><p className="font-bold">{label}</p><p className="mt-1 text-xs text-[var(--text-soft)]">{description}</p></div><Link href={href} prefetch={false} aria-label={label} className="gth-btn-gold flex size-11 shrink-0 items-center justify-center rounded-xl"><ArrowRight size={19} aria-hidden="true"/></Link></div>;}
export function TicketSearchPanel(){return <form action="/app/search" method="get" role="search" aria-label="Find tickets and events" className="space-y-2"><p className="font-bold text-lg">Find your next event</p><div className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-1.5"><Search size={18} className="ml-2 shrink-0" aria-hidden="true"/><input type="search" name="q" required minLength={2} maxLength={80} aria-label="Search event, venue or city" placeholder="Cricket, MCG, concerts…" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text)]"/><input type="hidden" name="category" value="ticket"/><button className="gth-btn-gold flex size-11 shrink-0 items-center justify-center rounded-xl" aria-label="Search events"><ArrowRight size={20}/></button></div><p className="text-xs text-[var(--text-soft)]">Explore reviewed event sources, then confirm admission with the seller.</p></form>;}
const destinations=[
 {name:"Tokyo",href:"/app/destinations/tokyo",image:LUXURY_VISUALS.tokyo},
 {name:"London",href:"/app/destinations/london",image:LUXURY_VISUALS.london},
 {name:"Dubai",href:"/app/destinations/dubai",image:"/images/cities/dubai.jpg"},
 {name:"Singapore",href:"/app/destinations/singapore",image:"/images/cities/singapore.jpg"}
] as const;
export function DestinationInspirationRail(){return <section data-marketplace-destinations="true" className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">Discover the world</h2><Link prefetch={false} href="/app/destinations" className="text-xs font-semibold underline">38,671 destination records</Link></div><div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-4">{destinations.map(d=><Link prefetch={false} key={d.href} href={d.href} className="w-[55vw] max-w-[240px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:w-auto sm:max-w-none"><div className="relative aspect-[4/3]"><Image src={d.image} alt="" fill unoptimized={d.image.startsWith("/images/luxury/")} sizes="(max-width:640px) 55vw,25vw" className="object-cover"/>{d.image.startsWith("/images/luxury/")&&<span className="absolute top-2 right-2 rounded bg-[var(--bg)] px-2 py-1 text-[10px]">Illustrative visual</span>}</div><div className="flex items-center justify-between gap-2 p-3 font-semibold">{d.name}<ArrowRight size={16}/></div></Link>)}</div></section>;}
