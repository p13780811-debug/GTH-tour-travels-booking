"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import PropertyCardPro from "./PropertyCardPro"

type Related = { id: string | number; slug: string; [key: string]: unknown }
export default function AIRecommendations({ slug }: { slug: string; user?: unknown }) {
 const [data, setData] = useState<Related[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)
 useEffect(() => {
  const controller = new AbortController()
  setLoading(true); setError(false); setData([])
  fetch("/api/ai-recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), signal: controller.signal })
   .then(async response => { if (!response.ok) throw new Error("unavailable"); return response.json() })
   .then(result => { if (!controller.signal.aborted) setData(Array.isArray(result) ? result.filter(p => p && typeof p.slug === "string") : []) })
   .catch(() => { if (!controller.signal.aborted) setError(true) })
   .finally(() => { if (!controller.signal.aborted) setLoading(false) })
  return () => controller.abort()
 }, [slug])
 return <section aria-label="Related property suggestions" className="mt-12">
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="gold-text text-xs font-bold uppercase tracking-widest">Explore further</p><h2 className="mt-2 text-2xl md:text-3xl font-bold">Properties you may also consider</h2><p className="mt-3 text-sm text-[var(--muted)]">Related by available recorded location or property type, not personalized AI matching.</p></div><Link href="/real-estate" className="gth-btn">Browse all properties</Link></div>
  {loading ? <p role="status" className="gth-glass rounded-2xl p-6">Loading related listings…</p> : error ? <p role="alert" className="gth-glass rounded-2xl p-6">Related listings are temporarily unavailable.</p> : data.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.map(p => <PropertyCardPro key={p.id} p={p as any} />)}</div> : <p className="gth-glass rounded-2xl p-6">No related listings are available for this property.</p>}
 </section>
}
