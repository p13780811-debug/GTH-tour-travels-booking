import type { Metadata } from "next"

export const metadata: Metadata = {
 title: "Saved properties & comparison | GTH PRO Real Estate",
 description: "Review and compare properties saved on your device.",
 robots: { index: false, follow: true },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
 return children
}
