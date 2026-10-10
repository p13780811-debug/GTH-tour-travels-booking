import type { Metadata } from "next"

export const metadata: Metadata = {
 title: "Your account | GTH PRO Real Estate",
 description: "Manage your account and view your property submissions.",
 robots: { index: false, follow: true },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
 return children
}
