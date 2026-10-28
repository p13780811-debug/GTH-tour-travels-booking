"use client"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Search, ShieldCheck, Sparkles } from "lucide-react"
import HeroMedia from "./HeroMedia"
import styles from "./Explorer.module.css"

type Props = { query: string; onQuery: (value: string) => void; onSearch: (value: string) => void;
  loading: boolean; intent: string; onIntent: (value: string) => void;
  filters?: Record<string,string>; onRefine?: (values:Record<string,string>) => void; onFilters?: () => void;
  onInfo: (kind: "ranking" | "verification") => void }

export default function ExplorerHero({ query, onQuery, onSearch, loading, intent, onIntent, onInfo, filters = {}, onRefine, onFilters }: Props) {
  return <>
    <section aria-labelledby="explorer-title" className="pt-4 sm:pt-6">
      <div className="flex items-center justify-between gap-3"><div><p className="gold-text text-xs font-semibold">GTH PRO · Real Estate</p><h1 id="explorer-title" className="mt-1 text-2xl font-semibold sm:text-3xl">Your next property starts here.</h1></div><span className="relative mt-3 inline-flex shrink-0"><Link href="/real-estate/post-property" aria-label="List your property for free" className="gth-btn gth-btn-gold inline-flex min-h-11 shrink-0 items-center gap-1 px-3 text-xs">List property<ArrowUpRight size={14}/></Link><span aria-hidden="true" className="gth-badge gth-badge-gold pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap !border-[var(--bg)] !px-3 !py-1 !text-xs ring-2 ring-[var(--bg)] shadow-[var(--glow-gold)] dark:!bg-none dark:!bg-blue-600 dark:!text-white dark:!shadow-[var(--glow-blue)]">FREE</span></span></div>
    </section>
    <div className={`${styles.searchIntent} scrollbar-hide !flex-nowrap !gap-5 overflow-x-auto pb-1`} aria-label="Property search purpose">{[{label:"Buy",value:"buy"},{label:"Rent",value:"rent"},{label:"New Launches",value:"new_launch"},{label:"Commercial",value:"commercial"},{label:"Plots",value:"plots"},{label:"Registry Lookup",value:"registry"}].map(item => <button type="button" key={item.value} aria-pressed={intent === item.value} className="shrink-0" onClick={() => onIntent(item.value)}>{item.label}</button>)}</div>
    <div className="relative mb-12"><HeroMedia />
    <form className="!absolute left-3 right-3 top-full z-20 flex min-w-0 -translate-y-1/2 items-center gap-2 rounded-xl border border-[var(--border)] !bg-[var(--bg)] p-2 text-[var(--text)] shadow-[var(--shadow)] sm:left-6 sm:right-6" role="search" onSubmit={event => { event.preventDefault(); onSearch(query.trim()) }}>
      <Search className="ml-1 shrink-0" size={20} aria-hidden="true" /><label className="min-w-0 flex-1"><span className="sr-only">Project name, location or registration reference</span><input type="search" maxLength={intent === "registry" ? 70 : 120} autoComplete="off" value={query} onChange={event => onQuery(event.target.value)} className="min-h-11 w-full min-w-0 !border-0 !bg-transparent text-base !text-[var(--text)] !shadow-none placeholder:!text-[var(--text-muted)]" placeholder={intent === "registry" ? "Project, locality or RERA number" : "City, locality or project"} /></label>
      <button className={`gth-btn gth-btn-gold ${styles.button}`} disabled={loading}><span className="sr-only sm:not-sr-only">{loading ? "Searching…" : "Explore properties"}</span><ArrowRight size={16} /></button>
    </form>
    </div>
    {intent !== "registry" && <div className="mt-3 flex flex-wrap items-end gap-2" aria-label="Quick property filters">
      <label className="text-xs">Bedrooms<select aria-label="Quick bedrooms" className="mt-1 block min-h-11 max-w-full" value={filters.bedrooms || ""} disabled={["commercial","plots"].includes(intent)} onChange={event => onRefine?.({bedrooms:event.target.value})}><option value="">Any BHK</option>{["1","2","3","4+"].map(value => <option key={value} value={value}>{value} BHK</option>)}</select></label>
      <label className="text-xs">Possession<select aria-label="Quick possession" className="mt-1 block min-h-11 max-w-full" value={filters.possession || ""} onChange={event => onRefine?.({possession:event.target.value})}><option value="">Any status</option><option value="ready_to_move">Ready to move</option><option value="under_construction">Under construction</option><option value="off_plan">Off plan</option></select></label>
      <button type="button" className="gth-badge min-h-11" onClick={onFilters}>Budget & all filters</button>
    </div>}
    <nav className="scrollbar-hide mt-3 flex max-w-full gap-2 overflow-x-auto pb-2" aria-label="Micro-market shortcuts">{["Andheri", "Borivali", "Kurla", "Thane West", "Dombivli", "Palava", "Panvel", "Kharghar"].map(place => <button key={place} type="button" className="gth-badge min-h-11 shrink-0" onClick={() => { onQuery(place); onSearch(place) }}>{place}</button>)}</nav>
    <details className="mt-3 text-xs"><summary className="min-h-8 cursor-pointer">How listings and registry records differ</summary><p className="mt-2 leading-6">Sale and rental offers need approved photographs. Registry records describe registered projects; they do not confirm availability.</p><div className="mt-2 flex flex-wrap gap-3"><button type="button" onClick={() => onInfo("ranking")}><Sparkles size={14}/>Ranking explained</button><button type="button" onClick={() => onInfo("verification")}><ShieldCheck size={14}/>Source & review status</button><button type="button" onClick={() => onInfo("verification")}>About this data</button></div></details>
  </>
}
