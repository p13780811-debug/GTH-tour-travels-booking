import type { Metadata } from "next"

export const metadata: Metadata = {
 title: "Submit a property | GTH PRO Real Estate",
 description: "Submit property details to GTH PRO for review before publication.",
 robots: { index: false, follow: true },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
 return children
}
