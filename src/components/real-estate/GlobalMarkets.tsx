import Link from "next/link"
import { ArrowUpRight, Globe2 } from "lucide-react"
import styles from "./Listing.module.css"

const markets = [
  { city:"Mumbai", country:"India", note:"Financial capital & premium residential corridors" },
  { city:"Dubai", country:"UAE", note:"Global investment, waterfront and luxury communities" },
  { city:"London", country:"United Kingdom", note:"Prime residential, new-build and international demand" },
  { city:"New York", country:"United States", note:"Urban residential and global capital market" },
  { city:"Singapore", country:"Singapore", note:"Asia-Pacific gateway and high-trust property market" },
  { city:"Bangkok", country:"Thailand", note:"Regional city living and investment districts" },
  { city:"Paris", country:"France", note:"Prime urban homes and international lifestyle market" },
  { city:"Tokyo", country:"Japan", note:"Global city living and resilient residential demand" },
]

export default function GlobalMarkets() {
  return <section className={styles.globalMarkets} aria-labelledby="global-markets-title">
    <div className={styles.sectionEyebrow}><Globe2 size={16} aria-hidden="true" /><span>Global market discovery</span></div>
    <div className={styles.sectionHeadingRow}>
      <div>
        <h2 id="global-markets-title" className="text-2xl md:text-3xl font-bold">Explore important property markets</h2>
        <p className="opacity-70 leading-7 mt-3 max-w-3xl">Move from city discovery to verified project records and reviewed marketplace inventory. Coverage reflects the data currently available to GTH PRO.</p>
      </div>
      <Link href="#listing-results" className="text-sm underline inline-flex items-center gap-2">Browse all results <ArrowUpRight size={15} aria-hidden="true" /></Link>
    </div>
    <div className={styles.marketGrid}>
      {markets.map(market => <Link key={market.city} href={`/real-estate?city=${encodeURIComponent(market.city)}`} className={styles.marketCard}>
        <div><p className="text-xs uppercase tracking-widest opacity-60">{market.country}</p><h3 className="text-xl font-bold mt-2">{market.city}</h3></div>
        <p className="text-sm opacity-70 leading-6">{market.note}</p>
        <span className="text-sm inline-flex items-center gap-2">Explore market <ArrowUpRight size={14} aria-hidden="true" /></span>
      </Link>)}
    </div>
  </section>
}
