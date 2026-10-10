"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import JourneyNav from "@/components/real-estate/JourneyNav"
import { PropertyService } from "@/lib/real-estate/propertyService"
import { normalizeSaved, SAVED_KEY } from "@/lib/real-estate/saved"
import SavePropertyButton from "@/components/real-estate/SavePropertyButton"
import PropertyImage from "@/components/real-estate/PropertyImage"
import BottomNav from "@/components/mobile/BottomNav"
import styles from "@/components/real-estate/Listing.module.css"

export default function SavedPage() {
    const [items, setItems] = useState<any[]>([])
    const [selected, setSelected] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const generation = useRef(0)
    const load = useCallback(async () => {
        const current = ++generation.current
        setLoading(true); setError("")
        try {
            const slugs = normalizeSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"))
            const rows: any[] = []
            // Bound concurrent reads instead of issuing fifty requests at once.
            for (let i = 0; i < slugs.length; i += 5) {
                if (current !== generation.current) return
                rows.push(...await Promise.all(slugs.slice(i, i + 5).map(slug => PropertyService.getBySlug(slug))))
            }
            if (current !== generation.current) return
            const next = rows.map((row, index) => row || { slug:slugs[index], title:"Listing temporarily unavailable", unavailable:true })
            setItems(next)
            setSelected(previous => previous.filter(slug => next.some(item => item.slug === slug && !item.unavailable)))
        } catch { if (current === generation.current) { setItems([]); setSelected([]); setError("Saved listings could not be loaded. Check device storage and retry.") } }
        finally { if (current === generation.current) setLoading(false) }
    }, [])
    useEffect(() => {
        load()
        const onStorage = (event: StorageEvent) => { if (!event.key || event.key === SAVED_KEY) load() }
        window.addEventListener("storage", onStorage); window.addEventListener("gth-saved", load)
        return () => { generation.current += 1; window.removeEventListener("storage", onStorage); window.removeEventListener("gth-saved", load) }
    }, [load])
    const compared = items.filter(item => selected.includes(item.slug) && !item.unavailable)
    return <main className="gth-container pt-10 pb-28 px-4">
        <JourneyNav />
        <header className="mt-8 mb-8"><p className="gold-text text-xs uppercase tracking-widest">GTH PRO / Your shortlist</p><h1 className="text-3xl md:text-4xl font-bold mt-3">Saved & compare</h1><p className="opacity-70 leading-7 mt-4">Saved on this device. No account sync. Clearing browser storage removes this shortlist.</p></header>
        <div className="flex justify-between gap-4 flex-wrap items-center mb-6"><p role="status">{loading ? "Loading saved listings…" : `${items.length} saved · ${compared.length} selected for comparison`}</p><button className={`gth-btn ${styles.action}`} disabled={loading} onClick={load}>Refresh listings</button></div>
        {error && <p role="alert" className="gth-glass rounded-2xl p-5 mb-6">{error}</p>}
        {!loading && !error && !items.length && <section className="gth-glass rounded-3xl p-8"><h2 className="text-2xl font-bold">Build your property shortlist</h2><p className="opacity-70 leading-7 mt-4">Use the heart button on a listing to save it here, then select up to four listings to compare recorded details.</p><Link href="/real-estate" className={`gth-btn-gold ${styles.action} mt-6`}>Explore listings</Link></section>}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map(item => <article key={item.slug} className="gth-glass rounded-3xl overflow-hidden"><div className="h-44"><PropertyImage slug={item.slug} src={item.image} alt={item.title} className="h-full w-full" /></div><div className="p-5"><h2 className="font-bold text-lg">{item.title}</h2>{!item.unavailable ? <><p className="gold-text mt-3">{item.formatted_price || "Price on request"}</p><Link className="underline inline-block mt-3" href={`/real-estate/${encodeURIComponent(item.slug)}`}>View listing</Link><label className="flex items-center gap-3 my-4 min-h-[44px]"><input type="checkbox" checked={selected.includes(item.slug)} disabled={loading || (!selected.includes(item.slug) && selected.length >= 4)} onChange={event => setSelected(previous => event.target.checked ? [...previous, item.slug] : previous.filter(slug => slug !== item.slug))} />Compare this listing</label></> : <p className="text-sm opacity-70 my-4">This record could not be loaded. Retry later or remove it from your shortlist.</p>}<SavePropertyButton slug={item.slug} className={`gth-btn ${styles.action}`} /></div></article>)}</div>
        {compared.length > 0 && <section className="mt-10"><div className="flex justify-between gap-4 items-center flex-wrap mb-5"><h2 className="text-2xl font-bold">Compare your shortlist</h2><button className={`gth-btn ${styles.action}`} onClick={() => setSelected([])}>Clear comparison</button></div><p className="text-sm opacity-70 mb-4">Compare up to four listings. Measurements and prices require source confirmation. Scroll horizontally on smaller screens.</p><div className="overflow-x-auto gth-glass rounded-3xl" role="region" aria-label="Listing comparison" tabIndex={0}><table className="w-full text-left min-w-[600px]"><caption className="text-left font-bold p-4">Recorded listing details</caption><thead><tr><th scope="col" className="p-4">Detail</th>{compared.map(item => <th scope="col" className="p-4" key={item.slug}>{item.title}</th>)}</tr></thead><tbody>{[["Developer","developer"],["Listing purpose","listing_type"],["Listed price","formatted_price"],["City","city"],["Country","country"],["Property type","property_type"],["Reported bedrooms","beds"],["Reported bathrooms","baths"],["Reported area (ft²)","sqft"],["Registration reference","rera_id"]].map(([label,key]) => <tr key={key} className="border-t border-[var(--border)]"><th scope="row" className="p-4">{label}</th>{compared.map(item => <td className="p-4" key={item.slug}>{(key === "developer" ? item.developer || item.builder_name : item[key]) || "Not provided"}</td>)}</tr>)}</tbody></table></div></section>}
        <BottomNav />
    </main>
}
