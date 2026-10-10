"use client"

import Link from "next/link"
import { MapPin, BedDouble, Bath, Maximize } from "lucide-react"
import SavePropertyButton from "./SavePropertyButton"
import PropertyImage from "./PropertyImage"
import styles from "./Listing.module.css"

export default function PropertyCardPro({ p }: any) {
 const detailUrl = `/real-estate/${encodeURIComponent(p.slug)}`
 return <article className={`gth-glass ${styles.card}`}>
  <div className={`${styles.media} h-52 md:h-60`}><Link href={detailUrl} aria-label={`View ${p.title || "property listing"}`} className="block h-full"><PropertyImage slug={p.slug} src={p.image} alt={p.title || "Property"} className="h-full w-full" /></Link>{p.is_featured && <span className="gth-badge absolute top-4 left-4">Featured</span>}<SavePropertyButton slug={p.slug} className={`${styles.save} gth-glass p-3 rounded-xl`} /></div>
  <div className={styles.cardBody}>
   <p className="text-xs opacity-70 mb-3">{[p.property_type, p.listing_type === "buy" ? "For sale" : p.listing_type === "rent" ? "For rent" : ""].filter(Boolean).join(" · ") || "Property listing"}</p>
   <h2 className={styles.cardTitle}><Link href={detailUrl} className="hover:underline">{p.title || "Property listing"}</Link></h2>
   <p className="flex items-start gap-2 text-sm opacity-70 mt-3"><MapPin size={16} className="gold-text shrink-0" aria-hidden="true" />{p.location || p.city || "Location not provided"}</p>
   {(p.developer || p.builder_name || p.rera_id) && <dl className={styles.recordPreview}>{(p.developer || p.builder_name) && <div><dt>Developer</dt><dd>{p.developer || p.builder_name}</dd></div>}{p.rera_id && <div><dt>Registration reference</dt><dd>{p.rera_id}</dd></div>}</dl>}
   <p className="gold-text text-2xl font-bold mt-5">{p.formatted_price || "Price on request"}</p>
   <dl className={styles.cardFacts}>{[{label:"Beds",value:p.beds || "—",Icon:BedDouble},{label:"Baths",value:p.baths || "—",Icon:Bath},{label:"Reported area",value:p.sqft ? `${p.sqft} ft²` : "—",Icon:Maximize}].map(({label,value,Icon}) => <div key={label}><Icon size={16} className="gold-text" aria-hidden="true" /><dt className="sr-only">{label}</dt><dd>{value} {label === "Beds" ? "beds" : label === "Baths" ? "baths" : ""}</dd></div>)}</dl>
   <div className={styles.cardFooter}><Link href={detailUrl} className="text-sm underline">View details</Link><Link href={`${detailUrl}#enquiry`} className={`gth-btn-gold ${styles.action}`}>Enquire</Link></div>
  </div>
 </article>
}
