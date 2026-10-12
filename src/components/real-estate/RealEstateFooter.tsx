import Link from "next/link"
import styles from "./Listing.module.css"

const portfolioUrl = "https://gth-pro-portfolio.pages.dev/"

export default function RealEstateFooter() {
  return <footer className={`${styles.estateFooter} border-t border-[var(--border)] pt-10 pb-28 md:pb-10`}>
    <div className="gth-container">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <Link href="/real-estate" className="gold-text text-lg font-bold">GTH PRO Global Real Estate</Link>
          <p className="text-sm opacity-70 leading-7 mt-4">Discover property markets through recorded project data, reviewed marketplace inventory and clearly separated verification states.</p>
        </div>
        <nav aria-label="Real estate footer">
          <h2 className="font-bold mb-4">Property journey</h2>
          <div className="grid gap-4 text-sm">
            <Link href="/real-estate">Explore markets</Link>
            <Link href="/real-estate/saved">Saved & compare</Link>
            <Link href="/real-estate/post-property">Submit a property</Link>
            <Link href="/real-estate/profile">Your account</Link>
            <Link href="/real-estate/tools">Property tools</Link>
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">GTH PRO portfolio <span className="sr-only">(opens in a new tab)</span></a>
          </div>
        </nav>
        <nav aria-label="Real estate legal links">
          <h2 className="font-bold mb-4">Trust & legal</h2>
          <div className="grid gap-4 text-sm">
            <Link href="/real-estate">Real Estate home</Link>
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/terms-and-conditions">Terms & conditions</Link>
            <Link href="/refund-policy">Refund policy</Link>
          </div>
        </nav>
      </div>
      <p className="text-xs opacity-70 mt-8 pt-6 border-t border-[var(--border)]">Registry data, reviewed listings and GTH verification are separate statuses. Property information does not replace legal, financial or technical due diligence. Market coverage varies with available sources and inventory.</p>
    </div>
  </footer>
}
