import { BadgeCheck, Building2, FileCheck2 } from "lucide-react"
import styles from "./Listing.module.css"

const levels = [
  {
    title:"Registry record",
    text:"Public project identity and registration data from an official or recorded source. It does not imply current inventory or GTH verification.",
    Icon:FileCheck2,
  },
  {
    title:"Reviewed listing",
    text:"Marketplace inventory submitted to GTH PRO and reviewed before publication. Price and availability still require confirmation.",
    Icon:Building2,
  },
  {
    title:"GTH Verified",
    text:"A separate verification status used only when the additional GTH verification workflow has been completed.",
    Icon:BadgeCheck,
  },
]

export default function TrustStandard() {
  return <section className={styles.trustSection} aria-labelledby="trust-standard-title">
    <p className="gold-text text-xs uppercase tracking-widest">Trust standard</p>
    <h2 id="trust-standard-title" className="text-2xl md:text-3xl font-bold mt-3">Know what each property status means</h2>
    <p className="opacity-70 leading-7 mt-3 max-w-3xl">Registration, marketplace review and GTH verification are intentionally separate. GTH PRO does not turn a public registry record into an active listing unless real inventory is supplied.</p>
    <div className={styles.trustGrid}>
      {levels.map(({title,text,Icon}) => <article key={title} className="gth-glass">
        <Icon size={22} className="gold-text" aria-hidden="true" />
        <h3 className="font-bold mt-4">{title}</h3>
        <p className="text-sm opacity-70 leading-7 mt-3">{text}</p>
      </article>)}
    </div>
  </section>
}
