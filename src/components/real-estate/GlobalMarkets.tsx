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
    // This is a registry RESEARCH rail, never a proxy for available sale/rent units.
    // Discover place names with the existing summary, then count only actual
    // MahaRERA-sourced registry rows from public.properties; never property_inventory.
    supabase.rpc("marketplace_market_counts").then(async ({data,error}) => {
      if (!active) return
      if (error || !Array.isArray(data)) { setLoading(false); return }
      const candidates = data.map((row:any) => ({
        city:String(row.city || ""),
        country:String(row.country || ""),
        result_count:0,
      })).filter((row:Market) => row.city && row.country.toLowerCase() === "india").slice(0,12)
      const verified = await Promise.all(candidates.map(async (row:Market) => {
        const { count, error: countError } = await supabase.from("properties")
          .select("id", { count:"exact", head:true })
          .eq("city", row.city).eq("country", row.country)
          .in("source_type", ["registry", "rera"])
          .ilike("ingestion_source", "%maharera%")
        return countError ? null : { ...row, result_count:count || 0 }
      }))
      if (active) { setMarkets(verified.filter((row):row is Market => Boolean(row && row.result_count > 0))); setLoading(false) }
    }, () => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (!loading && markets.length === 0) return null

  return <section className={styles.globalMarkets} aria-labelledby="global-markets-title">
    <div className={styles.sectionEyebrow}><Globe2 size={16} aria-hidden="true" /><span>Recorded project research</span></div>
    <div className={styles.sectionHeadingRow}>
      <div>
        <h2 id="global-markets-title" className="text-2xl md:text-3xl font-bold">Explore Maharashtra registered projects</h2>
        <p className="opacity-70 leading-7 mt-3 max-w-3xl">These are recorded MahaRERA projects for independent research, not properties currently offered for sale or rent. The live marketplace remains separate.</p>
      </div>
      <a href="/real-estate/registry" className="text-sm underline inline-flex items-center gap-2">Open registry explorer <ArrowUpRight size={15} aria-hidden="true" /></a>
    </div>
    <div className={styles.marketGrid}>
      {loading ? <div className="gth-glass rounded-3xl p-6"><p className="opacity-70">Loading available markets…</p></div> : markets.map(market =>
        <a key={`${market.city}-${market.country}`} href={`/real-estate/registry?q=${encodeURIComponent(market.city)}`} className={styles.marketCard}>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60">{market.country}</p>
            <h3 className="text-xl font-bold mt-2">{market.city}</h3>
          </div>
          <p className="text-sm opacity-70 leading-6">{market.result_count} recorded {market.result_count === 1 ? "project" : "projects"} · Not live sale/rent inventory</p>
          <span className="text-sm inline-flex items-center gap-2">Research {market.city} registrations <ArrowUpRight size={14} aria-hidden="true" /></span>
        </a>
      )}
    </div>
  </section>
}
