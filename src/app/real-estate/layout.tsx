import type { Metadata } from "next"
import RealEstateFooter from "@/components/real-estate/RealEstateFooter"
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
 return <div className={styles.estateScope}>{children}<RealEstateFooter /></div>
}
