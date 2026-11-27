import Link from "next/link";
import Image from "next/image";
import {ArrowRight,ShieldCheck} from "lucide-react";
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
export function MarketplaceServices(){return <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><h2 className="text-xl font-bold">Explore the marketplace</h2><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{services.map(([name,href,image])=><Link key={href} href={href} prefetch={false} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]"><div className="relative aspect-[16/10]"><Image src={image} alt="" fill sizes="(max-width:768px) 50vw,25vw" className="object-cover"/></div><div className="p-3"><span className="block text-[10px] text-[var(--text-soft)]">Illustrative visual</span><span className="flex min-h-11 items-center justify-between gap-1 text-sm font-semibold">{name}<ArrowRight size={15} className="shrink-0"/></span></div></Link>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-soft)]"><ShieldCheck size={18} className="shrink-0"/> Provider-operated booking handoffs · confirm prices and availability with the provider.</p></section>}
