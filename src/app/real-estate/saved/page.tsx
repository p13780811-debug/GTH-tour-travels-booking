"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { PropertyService } from "@/lib/real-estate/propertyService"
import { normalizeSaved, SAVED_KEY } from "@/lib/real-estate/saved"
import SavePropertyButton from "@/components/real-estate/SavePropertyButton"
export default function SavedPage() {
 const [items,setItems] = useState<any[]>([])
 const [selected,setSelected] = useState<string[]>([])
 const [loading,setLoading] = useState(true)
 const [error,setError] = useState("")
 useEffect(() => {
  let active=true; let generation=0
  const load = async () => { const current=++generation; setLoading(true); setError(""); try {
   const slugs=normalizeSaved(JSON.parse(localStorage.getItem(SAVED_KEY)||"[]"))
   const rows=await Promise.all(slugs.map(slug=>PropertyService.getBySlug(slug)))
   if(active && current===generation) setItems(rows.map((row,i)=>row||{slug:slugs[i],title:"Listing unavailable",unavailable:true}))
  } catch { if(active && current===generation) setError("Saved listings could not be loaded. Check device storage and reload.") } finally { if(active && current===generation) setLoading(false) } }
  load(); window.addEventListener("storage",load); window.addEventListener("gth-saved",load)
  return ()=>{active=false; window.removeEventListener("storage",load); window.removeEventListener("gth-saved",load)}
 },[])
 const compared=items.filter(p=>selected.includes(p.slug)&&!p.unavailable)
 return <main className="gth-container px-4 py-24"><h1 className="gth-title">Saved & compare</h1><p className="gth-sub">Saved on this device. No account sync. Clearing browser storage removes this list.</p><Link className="gth-btn inline-block my-4" href="/real-estate">Browse properties</Link>
 {loading&&<p role="status">Loading saved listings…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&!items.length&&<p>No saved listings yet. Use a listing’s heart button.</p>}
 <div className="grid gap-4 md:grid-cols-3">{items.map(p=><article key={p.slug} className="gth-glass rounded-2xl p-5"><h2>{p.title}</h2>{!p.unavailable&&<><p>{p.formatted_price}</p><Link className="gold-text" href={`/real-estate/${p.slug}`}>View listing</Link><label className="block mt-4"><input type="checkbox" checked={selected.includes(p.slug)} disabled={!selected.includes(p.slug)&&selected.length>=4} onChange={e=>setSelected(prev=>e.target.checked?[...prev,p.slug]:prev.filter(s=>s!==p.slug))} /> Compare (maximum 4)</label></>}<SavePropertyButton slug={p.slug}/></article>)}</div>
 {compared.length>0&&<div className="overflow-x-auto mt-8"><table className="gth-glass w-full text-left"><caption className="text-left font-bold p-4">Recorded listing comparison</caption><thead><tr><th className="p-3">Detail</th>{compared.map(p=><th className="p-3" key={p.slug}>{p.title}</th>)}</tr></thead><tbody>{[["Price","formatted_price"],["City","city"],["Country","country"],["Type","property_type"],["Bedrooms","beds"],["Bathrooms","baths"],["Area (sq ft)","sqft"],["Registry reference","rera_id"]].map(([label,key])=><tr key={key}><th className="p-3">{label}</th>{compared.map(p=><td className="p-3" key={p.slug}>{p[key]||"Not provided"}</td>)}</tr>)}</tbody></table></div>}
 </main>
}
