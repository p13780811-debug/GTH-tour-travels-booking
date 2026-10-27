"use client"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Heart, Search, ShieldCheck, Sparkles } from "lucide-react"
import styles from "./Explorer.module.css"

type Props = { query: string; onQuery: (value: string) => void; onSearch: (value: string) => void;
  loading: boolean; intent: string; onIntent: (value: string) => void;
  onInfo: (kind: "ranking" | "verification") => void }

export default function ExplorerHero({ query, onQuery, onSearch, loading, intent, onIntent, onInfo }: Props) {
  return <>
    <div className={styles.breadcrumb}><Link href="/">GTH PRO</Link><span>/</span><span>Real Estate</span><span>/</span><strong>Property Explorer</strong></div>
    <section className={styles.hero} aria-labelledby="explorer-title">
      <div className={styles.heroCopy}><p className={styles.eyebrow}>A MORE INFORMED NEXT MOVE</p>
        <h1 id="explorer-title" className={styles.heroTitle}>Find your place.<br /><span>Know the details.</span></h1>
        <p className={styles.heroDescription}>Discover reviewed sale and rental inventory, compare the details and research official project registrations separately.</p>
        <div className={styles.heroPills}><button onClick={() => onInfo("ranking")}><Sparkles size={14} />Ranking explained<ArrowUpRight size={13} /></button><button onClick={() => onInfo("verification")}><ShieldCheck size={14} />Source & review status<ArrowUpRight size={13} /></button></div>
      </div>
      <div className={styles.heroImage}><img src="/images/real-estate.jpg" alt="GTH PRO architectural brand artwork" fetchPriority="high" /><span>GTH PRO brand visual · Not a listed property</span></div>
      <div className={styles.heroAside}><p className={styles.eyebrow}>YOUR RESEARCH, IN FOCUS</p><h2>Explore.<br />Compare.<br />Move forward.</h2><p>Project records and reviewed listings, with their status made clear.</p><Link href="/real-estate/saved"><Heart size={14} />Your shortlist<ArrowUpRight size={14} /></Link></div>
    </section>
    <div className={`${styles.searchIntent} flex-wrap`} aria-label="Property search purpose">{[{label:"Buy",value:"buy"},{label:"Rent",value:"rent"},{label:"New Launches",value:"new_launch"},{label:"Commercial",value:"commercial"},{label:"Plots",value:"plots"},{label:"Registry Lookup",value:"registry"}].map(item => <button type="button" key={item.value} aria-pressed={intent === item.value} onClick={() => onIntent(item.value)}>{item.label}</button>)}</div>
    <form className={styles.searchPanel} role="search" onSubmit={event => { event.preventDefault(); onSearch(query.trim()) }}>
      <Search size={20} aria-hidden="true" /><label className={styles.searchInput}><span className="sr-only">Project name, location or registration reference</span><input type="search" maxLength={120} value={query} onChange={event => onQuery(event.target.value)} placeholder="Project name, location or RERA number" /></label>
      <button className={`gth-btn gth-btn-gold ${styles.button}`} disabled={loading}>{loading ? "Searching…" : "Explore properties"}<ArrowRight size={16} /></button>
    </form>
    <nav className="scrollbar-hide mt-4 flex max-w-full gap-2 overflow-x-auto pb-2" aria-label="Micro-market shortcuts">{["Andheri", "Borivali", "Kurla", "Thane West", "Dombivli", "Palava", "Panvel", "Kharghar"].map(place => <button key={place} type="button" className="gth-badge min-h-11 shrink-0" onClick={() => { onQuery(place); onSearch(place) }}>{place}</button>)}</nav>
    <div className={styles.sourceNote}><ShieldCheck size={16} /><p><strong>A clear starting point.</strong> Registry records, reviewed listings and GTH verification have separate meanings.</p><button onClick={() => onInfo("verification")}>About this data<ArrowUpRight size={13} /></button></div>
  </>
}
