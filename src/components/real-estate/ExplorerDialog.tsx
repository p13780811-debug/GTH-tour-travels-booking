"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, Minus, ShieldCheck, Sparkles, X } from "lucide-react"
import { coverage, known, recordedNumber, type ExplorerProperty } from "@/lib/real-estate/explorer"
import styles from "./Explorer.module.css"

export type ExplorerDialogState = { kind: "ranking" | "verification"; property?: ExplorerProperty } | { kind: "compare"; properties: ExplorerProperty[] }

export default function ExplorerDialog({ state, onClose }: { state: ExplorerDialogState; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [differences, setDifferences] = useState(false)
  useEffect(() => {
    const node = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    node?.showModal()
    return () => { node?.close(); document.body.style.overflow = overflow }
  }, [])
  const property = "property" in state ? state.property : undefined
  const score = property ? coverage(property) : null
  const items = state.kind === "compare" ? state.properties : []
  const rows: [string, (p: ExplorerProperty) => string][] = [
    ["Location", p => known(p.location) || known(p.city) || p.district || "Not recorded"],
    ["Recorded entity", p => p.developer || p.builder_name || "Not recorded"],
    ["Registration reference", p => p.rera_id || "Not recorded"],
    ["Property type", p => known(p.property_type) || "Not recorded"],
    ["Listed price", p => p.registry_only || p.data_quality_limited ? "Price on request" : p.formatted_price || "Price on request"],
    ["Reported bedrooms", p => recordedNumber(p.beds)], ["Reported bathrooms", p => recordedNumber(p.baths)],
    ["Reported area", p => recordedNumber(p.sqft, " sq ft")],
    ["Record coverage", p => `${coverage(p).score}/100`],
    ["GTH verification", p => p.verified ? "Recorded as GTH Verified" : "Review pending"],
  ]
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="explorer-dialog-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => {
    if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() }
  }}><header className={styles.dialogHeader}><div><p className={styles.eyebrow}>THE GTH PRO STANDARD</p><h2 id="explorer-dialog-title">{state.kind === "compare" ? "A clearer comparison." : state.kind === "ranking" ? "Smart Ranked. Clearly explained." : "Know the verification status."}</h2>{property && <p>{property.title}</p>}</div><button onClick={onClose} className={`gth-btn ${styles.iconButton}`} aria-label="Close property information"><X size={19} /></button></header>
    <div className={styles.dialogBody}>
      {state.kind === "compare" ? <>{items.length < 2 ? <p>Select two or three properties using the Compare checkbox on their cards.</p> : <><label className={styles.differences}><input type="checkbox" checked={differences} onChange={event => setDifferences(event.target.checked)} />Show differences only</label><div className={styles.comparison} role="region" tabIndex={0} aria-label="Scrollable property comparison"><table><caption className="sr-only">Recorded details for the selected properties</caption><thead><tr><th scope="col">Property details</th>{items.map(item => <th scope="col" key={item.slug}>{item.title}<Link href={`/real-estate/${encodeURIComponent(item.slug)}`}>Open listing ↗</Link></th>)}</tr></thead><tbody>{rows.filter(([, value]) => !differences || new Set(items.map(value)).size > 1).map(([label, value]) => <tr key={label}><th scope="row">{label}</th>{items.map(item => <td key={item.slug}>{value(item)}</td>)}</tr>)}</tbody></table></div><p className={styles.muted}>Missing details stay visible. Confirm prices, measurements, current availability and documents before proceeding.</p></>}</> : state.kind === "ranking" ? <><Sparkles className="gold-text" size={26} /><p>Smart Rank uses the catalog&apos;s stored ranking signals when available. It is a discovery aid, not a valuation or investment prediction.</p>{property && Number(property.ai_score) > 0 && !property.data_quality_limited && <p>Stored catalog score: <strong>{property.ai_score}</strong>. This score does not establish verification.</p>}<h3>{score ? `Record coverage: ${score.score}/100` : "Inspect what is actually recorded"}</h3><p>The separate coverage score counts available fields. Missing information earns no points.</p><div className={styles.scoreRows}>{(score?.parts || coverage({ id:0,slug:"",title:"" }).parts).map(part => <div key={part.label}><span>{score ? part.present ? <Check size={15} /> : <Minus size={15} /> : <Sparkles size={14} />}{part.label}</span><strong>{score ? part.present ? part.points : 0 : part.points}<small>/{part.points}</small></strong></div>)}</div></> : <><ShieldCheck className="gold-text" size={26} /><p>Registry records, reviewed marketplace listings and GTH verification are separate stages. A RERA number alone does not confirm current inventory, legal ownership or delivery.</p>{property && <div className={styles.verificationSummary}><strong>{property.verified ? "Recorded GTH status: verified" : "GTH review: pending"}</strong><p>{property.last_verified_at ? `Recorded review date: ${new Date(property.last_verified_at).toLocaleDateString("en-IN")}` : "No completed review date is supplied for this record."}</p></div>}<h3>AI Verified insights</h3><p>These panels explain the recorded evidence. They do not run an independent AI verification or turn missing information into a verified claim.</p><div className={styles.standardGrid}>{[["Registry record","Recorded project identity and registration reference."],["Reviewed inventory","Separately submitted inventory reviewed before publication."],["GTH Verified","The stored result of the additional GTH verification workflow."]].map(([title, copy]) => <article key={title}><h4>{title}</h4><p>{copy}</p></article>)}</div>{property?.official_source_url && <a href={property.official_source_url} target="_blank" rel="noopener noreferrer">Open the official project source ↗</a>}</>}
      {property && <div className={styles.dialogActions}><Link href={`/real-estate/${encodeURIComponent(property.slug)}`} className={`gth-btn gth-btn-gold ${styles.button}`}>Open full listing</Link><Link href={`/real-estate/${encodeURIComponent(property.slug)}#enquiry`} className={`gth-btn ${styles.button}`}>Request details</Link></div>}
    </div>
  </dialog>
}
