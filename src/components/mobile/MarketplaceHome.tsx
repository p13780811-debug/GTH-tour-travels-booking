import Link from "next/link";
import {ArrowUpRight,Globe2,ShieldCheck} from "lucide-react";
import MarketplaceVisual from "./MarketplaceVisual";
import {flagshipHubs,marketplaceShortcuts} from "@/lib/mobile/marketplace-media";
export default function MarketplaceHome(){
 return <section aria-label="Global marketplace" className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6">
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs font-semibold text-[var(--text)]"><span className="inline-flex items-center gap-2"><Globe2 size={18} aria-hidden="true"/>38,671 catalogued destinations</span><span className="inline-flex items-center gap-2"><ShieldCheck size={18} aria-hidden="true"/>Provider-operated booking handoffs</span></div>
  <div><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold tracking-tight">Featured city &amp; stadium hubs</h2><Link href="/app/services/stadiums" className="inline-flex min-h-11 items-center text-xs font-semibold underline">Browse venue guides</Link></div>
   <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4">{flagshipHubs.map(h=><Link key={h.href} href={h.href} prefetch={false} className="w-[70vw] max-w-[280px] shrink-0 snap-start rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow)] sm:w-auto sm:max-w-none"><MarketplaceVisual media={h.media} compact/><div className="p-2"><h3 className="font-bold">{h.title}</h3><p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{h.description}</p><span className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-semibold underline">Explore hub <ArrowUpRight size={15}/></span></div></Link>)}</div>
  </div>
  <div><h2 className="mb-3 text-xl font-bold tracking-tight">Your global marketplace</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{marketplaceShortcuts.map(s=><Link key={s.href} href={s.href} prefetch={false} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow)]"><MarketplaceVisual media={s.media} compact/><div className="flex items-center justify-between gap-1 px-1 py-2"><div className="min-w-0"><h3 className="text-sm font-bold">{s.label}</h3><p className="mt-1 text-[11px] leading-4 text-[var(--text-soft)]">{s.detail}</p></div><ArrowUpRight size={16} className="shrink-0" aria-hidden="true"/></div></Link>)}</div></div>
  <p className="text-xs leading-5 text-[var(--text-soft)]">Editorial and AI visuals are illustrative, not verified inventory or actual room, seat or property views. Confirm terms with each provider or original source.</p>
 </section>;
}
