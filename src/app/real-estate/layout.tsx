import type { Metadata } from "next"
import Link from "next/link"
import styles from "@/components/real-estate/Listing.module.css"

const isProduction = process.env.VERCEL_ENV === "production"

export const metadata: Metadata = {
 metadataBase: new URL("https://gth-pro.vercel.app"),
 title: { default: "Global property discovery | GTH PRO Real Estate", template: "%s" },
 description: "Explore global property markets, official project records and reviewed real-estate inventory with transparent source and verification status on GTH PRO.",
 keywords: [
  "global real estate",
  "international property",
  "property investment",
  "luxury real estate",
  "verified property listings",
  "MahaRERA projects",
  "Dubai property",
  "London property",
  "Mumbai property",
 ],
 robots: isProduction ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
 alternates: { canonical: "/real-estate" },
 openGraph: {
  title: "GTH PRO Global Real Estate",
  description: "Global property discovery with transparent project records, reviewed inventory and verification status.",
  url: "/real-estate",
  siteName: "GTH PRO",
  type: "website",
 },
 twitter: {
  card: "summary_large_image",
  title: "GTH PRO Global Real Estate",
  description: "Explore property markets, project records and reviewed inventory with source transparency.",
 },
}

export default function RealEstateLayout({ children }: { children: React.ReactNode }) {
 return <div className={styles.estateScope}>{children}<footer className={`${styles.estateFooter} border-t border-[var(--border)] pt-10 pb-28 md:pb-10`}><div className="gth-container"><div className="grid gap-8 md:grid-cols-3"><div><Link href="/real-estate" className="gold-text text-lg font-bold">GTH PRO Global Real Estate</Link><p className="text-sm opacity-70 leading-7 mt-4">Discover property markets through recorded project data, reviewed marketplace inventory and clearly separated verification states.</p></div><nav aria-label="Real estate footer"><h2 className="font-bold mb-4">Property journey</h2><div className="grid gap-4 text-sm"><Link href="/real-estate">Explore markets</Link><Link href="/real-estate/saved">Saved & compare</Link><Link href="/real-estate/post-property">Submit a property</Link><Link href="/real-estate/profile">Your account</Link><Link href="/real-estate/tools">Property tools</Link><Link href="/real-estate/portfolio">GTH PRO portfolio</Link></div></nav><nav aria-label="Policies and ecosystem"><h2 className="font-bold mb-4">Trust & ecosystem</h2><div className="grid gap-4 text-sm"><Link href="/">GTH PRO home</Link><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms-and-conditions">Terms & conditions</Link></div></nav></div><p className="text-xs opacity-70 mt-8 pt-6 border-t border-[var(--border)]">Registry data, reviewed listings and GTH verification are separate statuses. Property information does not replace legal, financial or technical due diligence. Market coverage varies with available sources and inventory.</p></div></footer></div>
}
