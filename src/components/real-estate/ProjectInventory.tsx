import Link from "next/link"
import ListingViewEvent from "./ListingViewEvent"
import EnquiryForm from "./EnquiryForm"

export default function ProjectInventory({ items = [] }: { items?: any[] }) {
  if (!Array.isArray(items) || items.length === 0) return null

  return <section id="inventory" className="gth-glass rounded-3xl p-6 md:p-8 mt-6 scroll-mt-24">
    <p className="gold-text text-xs uppercase tracking-widest">Active inventory</p>
    <h2 className="text-2xl md:text-3xl font-bold mt-3">Reviewed units and offers</h2>
    <p className="text-sm opacity-70 leading-7 mt-3">These reviewed marketplace submissions are linked to this project. They are separate from the official MahaRERA registry record and are not GTH Verified unless explicitly marked.</p>
    <div className="grid gap-4 mt-6">
      {items.map((item:any) => {
        const amount = Number(item.price_amount)
        const price = Number.isFinite(amount) && amount > 0
          ? new Intl.NumberFormat("en", { style:"currency", currency:item.currency || "INR", maximumFractionDigits:0 }).format(amount)
          : "Price on request"

        return <article key={item.id} className="gth-glass rounded-2xl p-5"><ListingViewEvent inventoryId={item.id} />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-70">{item.listing_type === "rent" ? "For rent" : "For sale"} · {item.property_type || "Property"}</p>
              <h3 className="gold-text text-xl font-bold mt-2">{price}</h3>
            </div>
            <span className="gth-badge">{item.verified ? "GTH Verified" : "Reviewed listing"}</span>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              ["Beds", item.bedrooms ?? "—"],
              ["Baths", item.bathrooms ?? "—"],
              ["Area", item.area_sqft ? `${item.area_sqft} ft² · ${Math.round(Number(item.area_sqft) * 0.092903)} m²` : "—"],
              ["Stated role", item.submitter_role || "Not stated"],
              ["Possession",item.possession_status?.replace(/_/g," ") || "Not documented"],
              ["Area basis",item.area_basis || "Not documented"],
            ].map(([label,value]) => <div key={String(label)}><dt className="text-xs opacity-70">{label}</dt><dd className="font-medium mt-1">{String(value)}</dd></div>)}
          </dl>
          {item.description && <p className="text-sm opacity-70 leading-7 mt-4">{item.description}</p>}
          <div className="mt-5 flex flex-wrap gap-3"><Link className="gth-btn" href={`/real-estate/workspace?tab=offers&inventory=${item.id}`}>Make a non-binding offer</Link><Link className="gth-btn" href={`/real-estate/workspace?tab=alerts&inventory=${item.id}`}>Watch price changes</Link></div><div className="mt-5"><EnquiryForm propertyId={item.project_id || item.property_id} inventoryId={item.id} mode="inventory" /></div>
        </article>
      })}
    </div>
  </section>
}
