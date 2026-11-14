"use client"
import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { normalizeSaved, normalizeSavedTitles, SAVED_KEY, SAVED_TITLES_KEY } from "@/lib/real-estate/saved"
export default function SavePropertyButton({ slug, title, className = "" }: { slug: string; title?: string; className?: string }) {
 const [saved,setSaved] = useState(false)
 const [error,setError] = useState("")
 useEffect(() => {
  const update = () => { try { setSaved(normalizeSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")).includes(slug)) } catch { setSaved(false) } }
  update(); window.addEventListener("storage",update); window.addEventListener("gth-saved",update)
  return () => { window.removeEventListener("storage",update); window.removeEventListener("gth-saved",update) }
 },[slug])
 return <span><button className={className} aria-pressed={saved} aria-label={saved ? "Remove from saved on this device" : "Save on this device"} title="Saved on this device only" onClick={event => {
  event.stopPropagation(); setError("")
  try {
   const items = normalizeSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"))
   if (!items.includes(slug) && items.length >= 50) { setError("Maximum 50 saved listings"); return }
   const next = normalizeSaved(items.includes(slug) ? items.filter(s => s !== slug) : [...items,slug])
   if (!next.includes(slug) && !items.includes(slug)) { setError("Listing cannot be saved"); return }
   localStorage.setItem(SAVED_KEY,JSON.stringify(next))
   // The shortlist is authoritative. Optional public titles may fail without
   // breaking saving; no privileged data or requests leave the device.
   try {
    const names=normalizeSavedTitles(JSON.parse(localStorage.getItem(SAVED_TITLES_KEY)||"{}"))
    if(next.includes(slug) && typeof title==="string" && title.trim().length>=2){
     names[slug]=title.normalize("NFKC").replace(/[\\u0000-\\u001f\\u007f]/g," ").trim().slice(0,110)
    } else if(!next.includes(slug)) delete names[slug]
    localStorage.setItem(SAVED_TITLES_KEY,JSON.stringify(names))
   }catch{/* Optional labels never block saving or removing a property. */}
   window.dispatchEvent(new Event("gth-saved"))
  } catch { setError("Device storage unavailable") }
 }}><Heart size={18} className={saved ? "fill-current" : ""} /></button>{error && <span role="status" className="text-xs">{error}</span>}</span>
}
