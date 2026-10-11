"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import PropertyCardPro from "./PropertyCardPro"

type Related = { id: string | number; slug: string; [key: string]: unknown }
export default function SimilarProperties({ slug }: { slug: string; user?: unknown }) {
 const [data, setData] = useState<Related[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)
 useEffect(() => {
  const controller = new AbortController()
  setLoading(true); setError(false); setData([])
  fetch(`/api/similar?slug=${encodeURIComponent(slug)}`, { signal: controller.signal })
   .then(async response => { if (!response.ok) throw new Error("unavailable"); return response.json() })
   .then(result => { if (!controller.signal.aborted) setData(Array.isArray(result) ? result.filter(p => p && typeof p.slug === "string") : []) })
   .catch(() => { if (!controller.signal.aborted) setError(true) })
   .finally(() => { if (!controller.signal.aborted) setLoading(false) })
  return () => controller.abort()
 }, [slug])
 return <section aria-label="Similar listings" className="mt-12">
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="gold-text text-xs font-bold uppercase tracking-widest">Continue discovering</p><h2 className="mt-2 text-2xl md:text-3xl font-bold">Similar properties</h2><p className="mt-3 text-sm text-[var(--muted)]">Additional available records selected by recorded location or type. Confirm all listing details independently.</p></div><Link href="/real-estate" className="gth-btn">View all properties</Link></div>
  {loading ? <p role="status" className="gth-glass rounded-2xl p-6">Loading similar listings…</p> : error ? <p role="alert" className="gth-glass rounded-2xl p-6">Similar listings are temporarily unavailable.</p> : data.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.map(p => <PropertyCardPro key={p.id} p={p as any} />)}</div> : <p className="gth-glass rounded-2xl p-6">No similar listings are currently available.</p>}
 </section>
}
