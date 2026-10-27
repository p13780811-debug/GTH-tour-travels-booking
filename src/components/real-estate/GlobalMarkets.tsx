import { ArrowUpRight, Globe2 } from "lucide-react"
import styles from "./Listing.module.css"

// Search entry points only: no fabricated counts, sale/rent availability or
// per-visitor database calls during an upstream connection-pool incident.
const researchLocations=["Mumbai","Thane","Kalyan","Dombivli"] as const
export default function GlobalMarkets() {
 return <section className={styles.globalMarkets} aria-labelledby="global-markets-title">
   <div className={styles.sectionEyebrow}><Globe2 size={16} aria-hidden="true" /><span>Recorded project research</span></div>
   <div className={styles.sectionHeadingRow}>
     <div>
       <h2 id="global-markets-title" className="text-2xl md:text-3xl font-bold">Explore Maharashtra registered projects</h2>
       <p className="opacity-70 leading-7 mt-3 max-w-3xl">Search documented project registrations by location. These are research shortcuts, not counts or currently available property offers. Sale and rental listings remain separate.</p>
     </div>
     <a href="/real-estate/registry" className="text-sm underline inline-flex items-center gap-2">Open registry explorer <ArrowUpRight size={15} aria-hidden="true" /></a>
   </div>
   <div className={styles.marketGrid}>
     {researchLocations.map(city=>
       <a key={city} href={`/real-estate/registry?q=${encodeURIComponent(city)}`} className={styles.marketCard}>
         <div><p className="text-xs uppercase tracking-widest opacity-60">Maharashtra, India</p><h3 className="text-xl font-bold mt-2">{city}</h3></div>
         <p className="text-sm opacity-70 leading-6">Search registered project records · Not live sale/rent inventory</p>
         <span className="text-sm inline-flex items-center gap-2">Research {city} registrations <ArrowUpRight size={14} aria-hidden="true" /></span>
       </a>
     )}
   </div>
 </section>
}
