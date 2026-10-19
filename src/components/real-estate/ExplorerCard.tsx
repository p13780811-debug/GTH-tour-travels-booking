"use client"
import Link from "next/link"
import { ArrowUpRight, BedDouble, Check, MapPin, Maximize, ShieldCheck, Sparkles } from "lucide-react"
import { approvedMedia, reviewedInventoryMedia } from "@/lib/real-estate/approved-media"
import { coverage, known, type ExplorerProperty } from "@/lib/real-estate/explorer"
import PropertyImage from "./PropertyImage"
import SavePropertyButton from "./SavePropertyButton"
import styles from "./Explorer.module.css"

function RecordCover({ slug }: { slug: string }) {
  const offset = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3 * 12
  return <div className={styles.recordCover}><svg viewBox="0 0 360 160" fill="none" aria-hidden="true"><path d="M0 140H360M25 112H55V140M304 94H328V140M14 140L82 112M346 140L280 112" /><path d={`M92 140V${54+offset}L157 ${27+offset}V140M157 ${27+offset}L215 ${51+offset}V140M215 ${51+offset}L275 ${35+offset}V140`} /><path d="M112 76V89M132 68V81M112 100V113M132 93V106M177 69V82M197 78V91M177 100V113M197 108V121M235 73V86M255 65V78M235 99V112M255 92V105" /><path d="M92 130L157 118L215 130L275 117M62 140V118M297 140V116M55 118Q62 95 69 118M290 116Q297 90 304 116" /></svg><span>Project record · Photo not supplied</span></div>
}

export default function ExplorerCard({ property: p, selected, compareFull, onCompare, onInfo }: {
  property: ExplorerProperty; selected: boolean; compareFull: boolean;
  onCompare: () => void; onInfo: (kind: "ranking" | "verification") => void;
}) {
  const url = `/real-estate/${encodeURIComponent(p.slug)}`
  const score = coverage(p).score
  const registry = p.registry_only || p.data_quality_limited
  const hasMedia = Boolean(approvedMedia(p.slug, p.image) || reviewedInventoryMedia(p.image))
  return <article className={styles.card}>
    <div className={styles.cardMedia}><Link href={url} aria-label={`Open ${p.title}`}>{hasMedia ? <PropertyImage slug={p.slug} src={p.image} alt={p.title} className={styles.approvedImage} /> : <RecordCover slug={p.slug} />}</Link><span className={styles.cardStatus}>{Number(p.active_inventory_count) > 0 ? "Reviewed inventory" : registry ? "Registry record" : "Property record"}</span><SavePropertyButton slug={p.slug} className={styles.save} /></div>
    <div className={styles.cardBody}><div className={styles.cardMeta}><span>{known(p.property_type) || "Project record"}</span><button onClick={() => onInfo("verification")}><ShieldCheck size={12} />{p.verified ? "GTH Verified" : "Review pending"}</button></div>
      <h3 className={styles.cardTitle}><Link href={url}>{p.title}</Link></h3>
      <p className={styles.location}><MapPin size={13} />{[known(p.location) || known(p.city) || p.district, known(p.country)].filter(Boolean).join(" · ") || "Location not recorded"}</p>
      <dl className={styles.recordFacts}><div><dt>Registration</dt><dd>{p.rera_id || "Not recorded"}</dd></div><div><dt>Recorded entity</dt><dd>{p.developer || p.builder_name || "Not recorded"}</dd></div></dl>
      <div className={styles.cardNumbers}><strong>{registry ? "Price on request" : p.formatted_price || "Price on request"}</strong><div><span><BedDouble size={14} />{p.beds || "—"}<small>beds</small></span><span><Maximize size={14} />{p.sqft ? p.sqft.toLocaleString("en-IN") : "—"}<small>sq ft</small></span></div></div>
      <button className={styles.rank} onClick={() => onInfo("ranking")}><Sparkles size={14} /><span>Record coverage</span><strong>{score}<small>/100</small></strong><ArrowUpRight size={13} /></button>
      <div className={styles.cardBottom}><label title="Compare up to three properties"><input type="checkbox" aria-label={`Compare ${p.title}`} checked={selected} disabled={!selected && compareFull} onChange={onCompare} /><span>{selected ? <><Check size={13} />Selected</> : "Compare"}</span></label><Link href={url}>View details<ArrowUpRight size={14} /></Link></div>
    </div>
  </article>
}
