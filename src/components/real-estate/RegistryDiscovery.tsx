"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Building2 } from "lucide-react"
import SavePropertyButton from "./SavePropertyButton"

type Record = {slug:string;title:string;rera_id:string;developer:string|null;city:string|null}

/** Text-only project discovery; never represent a registration as an available offer. */
export default function RegistryDiscovery({query:applied = "", attempt = 0}:{query?:string;attempt?:number}) {
  const [retry,setRetry] = useState(0)
  const [items,setItems] = useState<Record[]>([])
  const [state,setState] = useState<"loading"|"ready"|"error">("loading")
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(),18_000)
    setState("loading"); setItems([])
    fetch(`/api/real-estate/registry-preview?q=${encodeURIComponent(applied)}`,{signal:controller.signal,cache:"no-store"})
      .then(async response => { const result = await response.json(); if (!response.ok || !Array.isArray(result.items)) throw Error(); if (active && !controller.signal.aborted) {setItems(result.items);setState("ready")} })
      .catch(() => { if (active) setState("error") })
      .finally(() => clearTimeout(timeout))
    return () => {active=false;clearTimeout(timeout);controller.abort()}
  },[applied,attempt,retry])
  const href = `/real-estate/registry${applied ? `?q=${encodeURIComponent(applied)}` : ""}`
  return <section id="registry-discovery" aria-labelledby="registry-discovery-title" className="mt-5 scroll-mt-24">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="gold-text text-xs font-semibold">PROJECT RESEARCH</p><h2 id="registry-discovery-title" className="mt-1 text-xl font-semibold">Explore registered projects</h2></div><Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm underline">Full directory<ArrowUpRight size={14}/></Link></div>
    <p className="mt-2 text-sm leading-6">MahaRERA records · Registration is separate from sale availability, pricing and GTH verification.</p>
    <div aria-live="polite" aria-busy={state==="loading"}>
      {state==="loading" && <p role="status" className="gth-glass mt-3 rounded-xl p-5 text-sm">Loading registered projects…</p>}
      {state==="error" && <div role="status" className="gth-glass mt-3 rounded-xl p-5"><h3 className="font-semibold">Registry connection is temporarily unavailable</h3><p className="mt-2 text-sm">Project records could not be retrieved. You can retry or open the directory.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" className="gth-btn" onClick={()=>setRetry(value=>value+1)}>Retry registry</button><Link href={href} className="gth-btn">Open registry directory</Link></div></div>}
      {state==="ready" && items.length===0 && <p className="gth-glass mt-3 rounded-xl p-5 text-sm">No registered projects matched this search. Try another locality or use the directory filters.</p>}
      {state==="ready" && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(project=><article key={project.slug} className="gth-glass min-w-0 rounded-xl p-4"><div className="flex items-start justify-between gap-2"><span className="gth-badge inline-flex items-center gap-1 text-xs"><Building2 size={13}/>Registry record</span><SavePropertyButton slug={project.slug} className="inline-flex min-h-11 min-w-11 items-center justify-center"/></div><h3 className="mt-2 break-words font-semibold"><Link href={`/real-estate/${encodeURIComponent(project.slug)}`}>{project.title}</Link></h3><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs opacity-70">Location</dt><dd>{project.city || "Not recorded"}</dd></div><div><dt className="text-xs opacity-70">Promoter</dt><dd className="break-words">{project.developer || "Not recorded"}</dd></div><div><dt className="text-xs opacity-70">RERA reference</dt><dd>{project.rera_id}</dd></div></dl><Link href={`/real-estate/${encodeURIComponent(project.slug)}`} className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm underline">Research project<ArrowUpRight size={14}/></Link></article>)}</div>}
    </div>
    <Link href={href} className="gth-btn mt-4 inline-flex min-h-11 items-center">Search, filter & compare registry projects<ArrowUpRight size={14}/></Link>
  </section>
}
