"use client"

import Link from "next/link"
import { MapPin, BedDouble, Bath, Maximize, BadgeCheck, FileCheck2 } from "lucide-react"
import SavePropertyButton from "./SavePropertyButton"
import PropertyImage from "./PropertyImage"
import styles from "./Listing.module.css"

export default function PropertyCardPro({ p }: any) {
 const detailUrl = `/real-estate/${encodeURIComponent(p.slug)}`
 const registryOnly = Boolean(p.registry_only)
 const activeInventory = Number(p.active_inventory_count) || 0
 const officialSource = typeof p.official_source_url === "string" ? p.official_source_url : ""
 return <article className={`gth-glass ${styles.card}`}>
  <div className={`${styles.media} h-52 md:h-60`}><Link href={detailUrl} aria-label={`View ${p.title || "property listing"}`} className="block h-full"><PropertyImage slug={p.slug} src={p.image} alt={p.title || "Property"} reraId={p.rera_id} locality={p.location || p.city} district={p.district} propertyType={p.property_type} className="h-full w-full" /></Link><SavePropertyButton slug={p.slug} className={`${styles.save} gth-btn inline-flex items-center justify-center`} />{registryOnly && <span className="gth-badge absolute bottom-3 left-3">Registry record</span>}{!registryOnly && activeInventory > 0 && <span className="gth-badge absolute bottom-3 left-3">Reviewed inventory</span>}</div>
  <div className={styles.cardBody}>
   <p className="text-xs opacity-70 mb-3">{registryOnly ? "MahaRERA registry record" : ([p.property_type, p.listing_type === "buy" ? "For sale" : p.listing_type === "rent" ? "For rent" : ""].filter(Boolean).join(" · ") || "Property listing")}</p>
   <h2 className={styles.cardTitle}><Link href={detailUrl} className="hover:underline">{p.title || "Property listing"}</Link></h2>
   <p className="flex items-start gap-2 text-sm opacity-70 mt-3"><MapPin size={16} className="gold-text shrink-0" aria-hidden="true" />{[p.location || p.city, p.country && p.country !== "Country not provided" ? p.country : ""].filter(Boolean).join(" · ") || "Location not provided"}</p><div className={styles.trustPills}>{registryOnly && <span className={styles.trustPill}><FileCheck2 size={14} aria-hidden="true" />Registry record</span>}{activeInventory > 0 && <span className={styles.trustPill}><FileCheck2 size={14} aria-hidden="true" />Reviewed listing</span>}{p.verified && <span className={styles.trustPill}><BadgeCheck size={14} aria-hidden="true" />GTH Verified</span>}</div>
   {(p.developer || p.builder_name || p.rera_id) && <dl className={styles.recordPreview}>{(p.developer || p.builder_name) && <div><dt>Developer</dt><dd>{p.developer || p.builder_name}</dd></div>}{p.rera_id && <div><dt>Registration reference</dt><dd>{p.rera_id}</dd></div>}</dl>}
   {registryOnly ? <p className="text-sm opacity-70 leading-6 mt-5">Public registry identity only. Current price, unit inventory and listing contact have not been supplied to GTH PRO.</p> : <>
    <p className="gold-text text-2xl font-bold mt-5">{p.formatted_price || "Price on request"}</p>
    <dl className={styles.cardFacts}>{[{label:"Beds",value:p.beds || "—",Icon:BedDouble},{label:"Baths",value:p.baths || "—",Icon:Bath},{label:"Reported area",value:p.sqft ? `${p.sqft} ft² · ${Math.round(Number(p.sqft) * 0.092903)} m²` : "—",Icon:Maximize}].map(({label,value,Icon}) => <div key={label}><Icon size={16} className="gold-text" aria-hidden="true" /><dt className="sr-only">{label}</dt><dd>{value} {label === "Beds" ? "beds" : label === "Baths" ? "baths" : ""}</dd></div>)}</dl>
   </>}
   <div className={styles.cardFooter}><Link href={detailUrl} className="text-sm underline">{registryOnly ? "View project record" : "View details"}</Link>{registryOnly ? <Link href={`${detailUrl}#enquiry`} className={`gth-btn gth-btn-gold inline-flex items-center justify-center gap-2`}>Request details</Link> : <Link href={`${detailUrl}#enquiry`} className={`gth-btn gth-btn-gold inline-flex items-center justify-center gap-2`}>Enquire</Link>}</div>
   {registryOnly && officialSource && <a href={officialSource} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-70 mt-3 self-start">Official MahaRERA source</a>}
  </div>
 </article>
}
