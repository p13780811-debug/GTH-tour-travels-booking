"use client"
import CrossVerticalLinks from "@/components/synergy/CrossVerticalLinks";

import Link from "next/link"
import { ArrowUpRight, BedDouble, Check, MapPin, Maximize, ShieldCheck, Sparkles } from "lucide-react"
import PropertyLeadActions from "@/components/property/PropertyLeadActions"
import { coverage, known, type ExplorerProperty } from "@/lib/real-estate/explorer"
import PropertyImage from "./PropertyImage"
import { projectCover } from "@/lib/property-media/published-media"
import SavePropertyButton from "./SavePropertyButton"
import styles from "./Explorer.module.css"

export default function ExplorerCard({ property: p, selected, compareFull, onCompare, onInfo }: {
  property: ExplorerProperty; selected: boolean; compareFull: boolean;
  onCompare: () => void; onInfo: (kind: "ranking" | "verification") => void;
}) {
  const url = `/real-estate/${encodeURIComponent(p.slug)}`
  const score = coverage(p).score
  const registry = p.registry_only || p.data_quality_limited
  return <article className={styles.card}>
    <div className={styles.cardMedia}><Link href={url} aria-label={`Open ${p.title}`}><PropertyImage slug={p.slug} src={p.image} published={projectCover(p.publishedMedia||[])} alt={p.title} district={p.district} locality={p.location || p.city} propertyType={p.property_type} reraId={p.rera_id} className={styles.approvedImage} /></Link><span className={styles.cardStatus}>{Number(p.active_inventory_count) > 0 ? "Reviewed inventory" : registry ? "Registry record" : "Property record"}</span><SavePropertyButton slug={p.slug} className={styles.save} /></div>
    <div className={styles.cardBody}><div className={styles.cardMeta}><span>{known(p.property_type) || "Project record"}</span><button onClick={() => onInfo("verification")}><ShieldCheck size={12} />{p.verified ? "GTH Verified" : "Review pending"}</button></div>
      <h3 className={styles.cardTitle}><Link href={url}>{p.title}</Link></h3>
      <p className={styles.location}><MapPin size={13} />{[known(p.location) || known(p.city) || p.district, known(p.country)].filter(Boolean).join(" · ") || "Location not recorded"}</p>
      <dl className={styles.recordFacts}><div><dt>Registration</dt><dd>{p.rera_id || "Not recorded"}</dd></div><div><dt>Recorded entity</dt><dd>{p.developer || p.builder_name || "Not recorded"}</dd></div></dl>
      <div className={styles.cardNumbers}><strong>{registry ? "Price on request" : p.formatted_price || "Price on request"}</strong><div><span><BedDouble size={14} />{p.beds || "—"}<small>beds</small></span><span><Maximize size={14} />{p.sqft ? p.sqft.toLocaleString("en-IN") : "—"}<small>sq ft</small></span></div></div>
      <button className={styles.rank} onClick={() => onInfo("ranking")}><Sparkles size={14} /><span>Record coverage</span><strong>{score}<small>/100</small></strong><ArrowUpRight size={13} /></button>
      <div className={styles.cardBottom}><label title="Compare up to three properties"><input type="checkbox" aria-label={`Compare ${p.title}`} checked={selected} disabled={!selected && compareFull} onChange={onCompare} /><span>{selected ? <><Check size={13} />Selected</> : "Compare"}</span></label><Link href={url}>View details<ArrowUpRight size={14} /></Link></div>
      <PropertyLeadActions property={{ id: Number(p.id), title: p.title, slug: p.slug, rera_id: p.rera_id }} compact />
      {["mumbai","goa"].includes((p.city || "").trim().toLowerCase()) && <CrossVerticalLinks kind="property" city={p.city} compact />}
    </div>
  </article>
}
