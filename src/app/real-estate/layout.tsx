import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
 title: { default: "Explore properties | GTH PRO Real Estate", template: "%s" },
 description: "Explore available property listings, compare recorded project details and submit enquiries on GTH PRO Real Estate.",
}

export default function RealEstateLayout({ children }: { children: React.ReactNode }) {
 return <>{children}<footer className="border-t border-[var(--border)] pt-10 pb-28 md:pb-10"><div className="gth-container"><div className="grid gap-8 md:grid-cols-3"><div><Link href="/real-estate" className="gold-text text-lg font-bold">GTH PRO Real Estate</Link><p className="text-sm opacity-70 leading-7 mt-4">Explore available listings and recorded project information. Confirm details with source documents and the listing contact.</p></div><nav aria-label="Real estate footer"><h2 className="font-bold mb-4">Your property journey</h2><div className="grid gap-4 text-sm"><Link href="/real-estate">Explore properties</Link><Link href="/real-estate/saved">Saved & compare</Link><Link href="/real-estate/post-property">Submit a property</Link><Link href="/real-estate/profile">Your account</Link></div></nav><nav aria-label="Policies and ecosystem"><h2 className="font-bold mb-4">GTH PRO ecosystem</h2><div className="grid gap-4 text-sm"><Link href="/">GTH PRO home</Link><Link href="/privacy-policy">Privacy policy</Link><Link href="/terms-and-conditions">Terms & conditions</Link></div></nav></div><p className="text-xs opacity-70 mt-8 pt-6 border-t border-[var(--border)]">Property registration, publication and listing data do not replace legal due diligence. Coverage varies by available inventory.</p></div></footer></>
}
