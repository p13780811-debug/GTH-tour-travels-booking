import type { Metadata } from "next"

export const metadata: Metadata = {
 title: "Listing review | GTH PRO Real Estate",
 description: "Review submitted property listings with your administrator account.",
 robots: { index: false, follow: true },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
 return children
}
