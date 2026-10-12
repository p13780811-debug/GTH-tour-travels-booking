"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Globe2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import styles from "./Listing.module.css"

type Market = { city:string; country:string; result_count:number }

export default function GlobalMarkets() {
  const [markets,setMarkets] = useState<Market[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.rpc("marketplace_market_counts").then(({data,error}) => {
      if (!active) return
      if (!error && Array.isArray(data)) {
        setMarkets(data.map((row:any) => ({
          city:String(row.city || ""),
          country:String(row.country || ""),
          result_count:Number(row.result_count) || 0,
        })).filter((row:Market) => row.city && row.country && row.result_count > 0))
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  if (!loading && markets.length === 0) return null

  return <section className={styles.globalMarkets} aria-labelledby="global-markets-title">
    <div className={styles.sectionEyebrow}><Globe2 size={16} aria-hidden="true" /><span>Available property markets</span></div>
    <div className={styles.sectionHeadingRow}>
      <div>
        <h2 id="global-markets-title" className="text-2xl md:text-3xl font-bold">Explore markets with live GTH PRO records</h2>
        <p className="opacity-70 leading-7 mt-3 max-w-3xl">Only markets with public project records or reviewed inventory are shown here. New cities appear automatically as verified data becomes available.</p>
      </div>
      <a href="/real-estate#listing-results" className="text-sm underline inline-flex items-center gap-2">Browse all results <ArrowUpRight size={15} aria-hidden="true" /></a>
    </div>
    <div className={styles.marketGrid}>
      {loading ? <div className="gth-glass rounded-3xl p-6"><p className="opacity-70">Loading available markets…</p></div> : markets.map(market =>
        <a key={`${market.city}-${market.country}`} href={`/real-estate?city=${encodeURIComponent(market.city)}#listing-results`} className={styles.marketCard}>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60">{market.country}</p>
            <h3 className="text-xl font-bold mt-2">{market.city}</h3>
          </div>
          <p className="text-sm opacity-70 leading-6">{market.result_count} public {market.result_count === 1 ? "record" : "records"} currently available</p>
          <span className="text-sm inline-flex items-center gap-2">View {market.city} results <ArrowUpRight size={14} aria-hidden="true" /></span>
        </a>
      )}
    </div>
  </section>
}
