"use client"

import Link from "next/link"
import { ArrowUpRight, Bath, BedDouble, MapPin, Maximize } from "lucide-react"
import SavePropertyButton from "./SavePropertyButton"
import PropertyImage from "./PropertyImage"
import styles from "./Listing.module.css"

type PropertyCardRecord = {
 id: string | number
 slug: string
 title?: string | null
 image?: string | null
 property_type?: string | null
 listing_type?: string | null
 location?: string | null
 city?: string | null
 formatted_price?: string | null
 beds?: number | string | null
 baths?: number | string | null
 sqft?: number | string | null
 is_featured?: boolean
}
export default function PropertyCardPro({ p }: { p: PropertyCardRecord }) {
 const detailUrl = `/real-estate/${encodeURIComponent(p.slug)}`
 const name = p.title || "Property listing"
 const intent = p.listing_type === "buy" ? "For sale" : p.listing_type === "rent" ? "For rent" : "Explore property"
 const facts = [
  { label: "Beds", value: p.beds ?? "—", Icon: BedDouble },
  { label: "Baths", value: p.baths ?? "—", Icon: Bath },
  { label: "Reported area", value: p.sqft ? `${p.sqft} ft²` : "—", Icon: Maximize }
 ]
 return <article className={`gth-glass ${styles.card} ${styles.editorialCard}`}>
  <div className={`${styles.media} ${styles.editorialMedia}`}>
   <Link href={detailUrl} aria-label={`View ${name}`} className="block h-full">
    <PropertyImage slug={p.slug} src={p.image ?? undefined} alt={name} className="h-full w-full" />
   </Link>
   <div className={styles.cardMediaTop}>
    <span className={styles.cardIntent}>{intent}</span>
    <SavePropertyButton slug={p.slug} className={`${styles.save} gth-glass p-3 rounded-xl`} />
   </div>
   {p.is_featured && <span className={styles.cardFeatured}>Featured listing</span>}
  </div>
  <div className={styles.cardBody}>
   <div className={styles.cardKicker}>{p.property_type || "Property"} <span aria-hidden="true">/</span> GTH PRO COLLECTION</div>
   <h2 className={styles.cardTitle}><Link href={detailUrl}>{name}</Link></h2>
   <p className={styles.cardLocation}><MapPin size={15} aria-hidden="true" />{p.location || p.city || "Location not provided"}</p>
   <div className={styles.cardPriceBlock}><span>RECORDED ASKING PRICE</span><strong>{p.formatted_price || "Price on request"}</strong></div>
   <dl className={styles.cardFacts}>{facts.map(({label,value,Icon}) => <div key={label}><Icon size={16} aria-hidden="true" /><dt className="sr-only">{label}</dt><dd>{value === "" ? "—" : value} {label === "Beds" ? "beds" : label === "Baths" ? "baths" : ""}</dd></div>)}</dl>
   <div className={styles.cardFooter}>
    <Link href={detailUrl} className={styles.cardDetailLink}>Discover property <ArrowUpRight size={17} aria-hidden="true" /></Link>
    <Link href={`${detailUrl}#enquiry`} className={`gth-btn-gold ${styles.action}`}>Enquire</Link>
   </div>
  </div>
 </article>
}
