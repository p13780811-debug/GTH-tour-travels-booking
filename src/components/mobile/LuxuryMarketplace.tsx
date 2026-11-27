import Link from "next/link";
import Image from "next/image";
import {ArrowRight,Search,ShieldCheck} from "lucide-react";
const services=[
 ["Hotels & stays","/app/hotels","/images/mega/hotels.jpg"],
 ["Global flights","/app/flights","/images/mega/flights.jpg"],
 ["Match passes","/app/services/tickets","/images/travel.jpg"],
 ["Travel packages","/travel/packages","/images/travel.jpg"],
 ["Destinations","/app/destinations","/images/global-city.jpg"],
 ["Transport","/go/transport","/images/mega/transfers.jpg"],
 ["Real estate","/app/property","/images/real-estate.jpg"],
 ["Tenders","/app/tenders","/images/tender.jpg"]
] as const;
export function MarketplaceHero({title,subtitle,image}:{title:string;subtitle:string;image:string}){
 return <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6" aria-label={title}>
 <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
 <div className="relative aspect-[16/7] overflow-hidden"><Image src={image} alt="" fill sizes="(max-width:768px) 100vw, 1100px" className="object-cover"/><span className="absolute bottom-2 right-2 rounded-full bg-[var(--card)] px-2 py-1 text-[10px] text-[var(--text)]">Illustrative visual</span></div>
 <div className="p-4"><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">GTH PRO Global</p><h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2><p className="mt-1 text-sm text-[var(--text-soft)]">{subtitle}</p></div>
 </div></section>;
}
export function MarketplacePlanner(){return <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><form action="/app/search" method="get" className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)]"><h2 className="text-lg font-bold">Ask GTH · Search & plan</h2><p className="mt-1 text-xs text-[var(--text-soft)]">Guided search across existing services; no generated prices or availability.</p><div className="mt-3 flex min-w-0 gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] px-3"><Search size={18} aria-hidden="true"/><input name="q" required maxLength={70} aria-label="Ask GTH search" placeholder="Hotels in Melbourne" className="min-h-12 min-w-0 w-full bg-transparent text-sm"/></label><button className="gth-btn-gold min-h-12 rounded-xl px-4" aria-label="Search marketplace"><ArrowRight size={20}/></button></div></form></section>}
export function MarketplaceServices(){return <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><h2 className="text-xl font-bold">Explore the marketplace</h2><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{services.map(([name,href,image])=><Link key={href} href={href} prefetch={false} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]"><div className="relative aspect-[16/10]"><Image src={image} alt="" fill sizes="(max-width:768px) 50vw,25vw" className="object-cover"/></div><div className="p-3"><span className="block text-[10px] text-[var(--text-soft)]">Illustrative visual</span><span className="flex min-h-11 items-center justify-between gap-1 text-sm font-semibold">{name}<ArrowRight size={15} className="shrink-0"/></span></div></Link>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-soft)]"><ShieldCheck size={18} className="shrink-0"/> Provider-operated booking handoffs · confirm prices and availability with the provider.</p></section>}
