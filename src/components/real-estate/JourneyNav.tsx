import Link from "next/link"
import styles from "./Listing.module.css"

export default function JourneyNav() {
 return <nav aria-label="Property workspace" className={`${styles.heroLinks} mb-8 border-b border-[var(--border)] pb-5`}><Link href="/real-estate">Explore properties</Link><Link href="/real-estate/saved">Saved & compare</Link><Link href="/real-estate/post-property">List a property</Link><Link href="/real-estate/profile">My account</Link></nav>
}
