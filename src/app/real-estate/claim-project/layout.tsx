import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Claim a registered project | GTH PRO",
  description: "Private project authorization request and rights-cleared media review.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/real-estate/claim-project" },
};
export default function ClaimProjectLayout({children}:{children:React.ReactNode}) {return children;}
