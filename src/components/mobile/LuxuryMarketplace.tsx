import {LUXURY_VISUALS} from "@/lib/destinations/visual-media";
import Link from "next/link";
import Image from "next/image";
import {ArrowRight,ShieldCheck} from "lucide-react";
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
 <div className="relative aspect-[16/7] overflow-hidden"><Image src={image} alt="" fill sizes="(max-width:768px) 100vw, 1100px" className="object-cover"/><span className="absolute bottom-2 right-2 rounded-full bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative visual</span></div>
 <div className="p-4"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO Global</p><p className="mt-1 text-2xl font-bold tracking-tight">{title}</p><p className="mt-1 text-sm text-[var(--text-soft)]">{subtitle}</p></div>
 </div></section>;
}
export function MarketplaceServices(){return <section data-marketplace-services="true" className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><h2 className="text-xl font-bold">Explore the marketplace</h2><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{services.map(([name,href,image])=><Link key={href} href={href} prefetch={false} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]"><div className="relative aspect-[16/10]"><Image src={image} alt="" fill sizes="(max-width:768px) 50vw,25vw" className="object-cover"/></div><div className="p-3"><span className="block text-[10px] text-[var(--text-soft)]">Illustrative visual</span><span className="flex min-h-11 items-center justify-between gap-1 text-sm font-semibold">{name}<ArrowRight size={15} className="shrink-0"/></span></div></Link>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-soft)]"><ShieldCheck size={18} className="shrink-0"/> Provider-operated booking handoffs · confirm prices and availability with the provider.</p></section>}

const hubs=[
 {name:"Melbourne (MCG)",subtitle:"Australia · cricket and events",href:"/stadiums/melbourne-cricket-ground",image:LUXURY_VISUALS.melbourne},
 {name:"Mumbai (Wankhede)",subtitle:"India · cricket and events",href:"/stadiums/wankhede-stadium",image:LUXURY_VISUALS.mumbai},
 {name:"Tokyo",subtitle:"Japan · city experiences",href:"/app/destinations/tokyo",image:LUXURY_VISUALS.tokyo},
 {name:"London",subtitle:"United Kingdom · city experiences",href:"/app/destinations/london",image:LUXURY_VISUALS.london}
] as const;
export function FlagshipHubRail(){return <section data-marketplace-hubs="true" aria-label="Featured destination and venue hubs" className="mx-auto max-w-7xl px-4 pt-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold text-[var(--text)]">Flagship travel & venue hubs</h2><Link prefetch={false} href="/destinations" className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)]">38,671 destination records audited</Link></div><div className="mt-3 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-4 sm:overflow-visible">{hubs.map(hub=><Link key={hub.href} href={hub.href} prefetch={false} className="w-[62vw] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] sm:w-auto sm:max-w-none"><div className="relative aspect-[4/3]"><Image src={hub.image} alt="" fill sizes="(max-width:640px) 62vw,25vw" className="object-cover" unoptimized/><span className="absolute bottom-2 left-2 rounded bg-[var(--bg)] px-2 py-1 text-[10px] text-[var(--text)]">AI illustrative visual</span></div><div className="p-3"><p className="font-bold text-[var(--text)]">{hub.name}</p><p className="mt-1 text-xs text-[var(--text-soft)]">{hub.subtitle}</p><span className="mt-3 flex min-h-10 items-center justify-between gap-1 text-sm font-semibold text-[var(--text)]">Explore hub <ArrowRight size={16}/></span></div></Link>)}</div><p className="text-xs text-[var(--text-soft)]">Illustrations are travel inspiration, not verified venue photographs. Actual tickets and bookings remain with the selected provider.</p></section>}
