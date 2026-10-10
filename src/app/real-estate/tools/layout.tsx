import type { Metadata } from "next"

const title = "Repayment calculator & property checklist | GTH PRO"
const description = "Estimate monthly repayments from your own loan figures and prepare a property buying checklist. Estimates are not lender offers."
const url = "https://gth-pro.vercel.app/real-estate/tools"

export const metadata: Metadata = {
 title,
 description,
 alternates: { canonical: url },
 openGraph: { title, description, url, type: "website", siteName: "GTH PRO" },
 twitter: { card: "summary", title, description },
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
 return children
}
