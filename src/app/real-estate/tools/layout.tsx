import type { Metadata } from "next"

const title = "Property decision calculators & buying checklist | GTH PRO"
const description = "Compare rent versus buy, loan prepayment, sale proceeds, ownership costs and affordability using your own assumptions. Includes area conversion and a buying checklist."
const url = "/real-estate/tools"

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
