import Link from "next/link";
import {ArrowRight,Globe2,ShieldCheck} from "lucide-react";
import {marketplaceHubs,marketplaceServices,marketplacePhoto} from "@/lib/mobile/marketplace-visuals";
import DiscoveryCardPhoto from "@/components/destination/DiscoveryCardPhoto";
export default function MobileMarketplaceShowcase(){
 return <section aria-label="GTH PRO marketplace collection" className="mx-auto max-w-7xl space-y-6 px-4 pb-3 pt-6 sm:px-6">
  <nav aria-label="Marketplace quick categories" className="flex gap-2 overflow-x-auto pb-1">
   {marketplaceServices.slice(0,4).map(item=><Link key={item.kind} prefetch={false} href={item.href} className="gth-btn inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-xs font-semibold">{item.title}</Link>)}
  </nav>
  <div className="flex flex-wrap items-end justify-between gap-2">
   <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Match hospitality & city discovery</p><h2 className="mt-2 text-xl font-bold sm:text-3xl">Featured global hubs</h2></div>
   <Link href="/app/destinations" prefetch={false} className="text-xs font-semibold underline">Explore all destinations</Link>
  </div>
  <div role="region" aria-label="Featured global hub cards" className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3">
   {marketplaceHubs.map(hub=><Link key={hub.kind} href={hub.href} prefetch={false} className="group flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] focus-visible:outline-2 focus-visible:outline-[var(--gold)] sm:w-72">
    <div className="relative aspect-[5/4]"><DiscoveryCardPhoto source={null} fallback={marketplacePhoto(hub.kind)} title=""/></div>
    <div className="p-4"><h3 className="font-bold">{hub.title}</h3><p className="mt-1 text-xs text-[var(--text-soft)]">{hub.detail}</p><span className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--gold)]">Explore hub <ArrowRight size={16}/></span></div>
   </Link>)}
  </div>
  <div><h2 className="text-xl font-bold sm:text-3xl">Your marketplace</h2><p className="mt-1 text-xs text-[var(--text-soft)]">Explore your next journey or business opportunity.</p></div>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
   {marketplaceServices.map(item=><Link key={item.kind} href={item.href} prefetch={false} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
    <div className="relative aspect-[4/3]"><DiscoveryCardPhoto source={null} fallback={marketplacePhoto(item.kind)} title=""/></div>
    <div className="flex flex-1 flex-col p-3"><h3 className="text-sm font-bold sm:text-base">{item.title}</h3><p className="mt-1 text-xs text-[var(--text-soft)]">{item.detail}</p><span className="mt-auto flex min-h-10 items-center gap-1 pt-2 text-xs font-semibold">Open service <ArrowRight size={14}/></span></div>
   </Link>)}
  </div>
  <div className="gth-glass rounded-2xl border border-[var(--border)] p-4 text-xs leading-6 text-[var(--text-soft)]">
   <p className="flex items-center gap-2 font-bold text-[var(--text)]"><Globe2 size={18} className="text-[var(--gold)]"/> Global destination directory</p>
   <p className="mt-1">38,671 active destination records in the last catalogue audit; not a count of verified stadiums or available rooms.</p>
   <p className="mt-2 flex items-start gap-2"><ShieldCheck size={17} className="mt-1 shrink-0 text-[var(--gold)]"/> Existing booking partner handoffs. Prices, availability and payments are confirmed by the selected provider. <Link href="/affiliate-disclosure" className="underline">Disclosure</Link></p>
  </div>
 </section>;
}
