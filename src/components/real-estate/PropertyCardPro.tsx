"use client"

import Link from "next/link"
import { MapPin, BedDouble, Bath, Maximize } from "lucide-react"
import SavePropertyButton from "./SavePropertyButton"
import PropertyImage from "./PropertyImage"
import styles from "./Listing.module.css"

export default function PropertyCardPro({ p }: any) {
    const detailUrl = `/real-estate/${encodeURIComponent(p.slug)}`
    return (
        <article className="gth-glass gth-card-premium relative overflow-hidden rounded-[32px]">
            <div className={`${styles.media} h-44 md:h-52`}>
                <Link href={detailUrl} aria-label={`View ${p.title}`} className="block h-full">
                    <PropertyImage slug={p.slug} src={p.image} alt={p.title || "Property"} className="h-full w-full" />
                </Link>
                {p.is_featured && <span className="gth-badge gth-badge-gold absolute top-4 left-4">Featured</span>}
                <SavePropertyButton slug={p.slug} className={`${styles.save} gth-glass p-3 rounded-xl`} />
            </div>
            <div className="p-5">
                <p className="text-xs opacity-70">Listed price</p>
                <p className="gold-text text-2xl font-bold mt-1">{p.formatted_price || "Price on request"}</p>
                <h2 className="text-lg font-bold mt-4"><Link href={detailUrl} className="hover:underline">{p.title || "Property listing"}</Link></h2>
                <p className="flex items-start gap-2 text-sm opacity-70 mt-2"><MapPin size={16} className="gold-text shrink-0" aria-hidden="true" />{p.location || p.city || "Location not provided"}</p>
                <dl className="grid grid-cols-3 gap-3 mt-5 text-center">
                    {[
                        { label: "Beds", value: p.beds || "—", Icon: BedDouble },
                        { label: "Baths", value: p.baths || "—", Icon: Bath },
                        { label: "Reported area", value: p.sqft ? `${p.sqft} ft²` : "—", Icon: Maximize },
                    ].map(({ label, value, Icon }) => <div key={label} className="gth-glass rounded-2xl p-3"><Icon size={16} className="gold-text mx-auto mb-2" aria-hidden="true" /><dt className="text-xs opacity-70">{label}</dt><dd className="font-bold text-sm mt-1">{value}</dd></div>)}
                </dl>
                <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">
                    <span className="gth-badge">{p.verified ? "Verified listing" : "Listed property"}</span>
                    <Link href={`${detailUrl}#enquiry`} className={`gth-btn-gold ${styles.action}`}>Enquire</Link>
                </div>
            </div>
        </article>
    )
}
