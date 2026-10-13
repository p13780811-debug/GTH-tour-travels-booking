import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Flight Fare Observations | GTH PRO Travel",
  description:
    "Explore previously observed flight fares with transparent filters, then check current availability and booking terms directly with the travel partner.",
  keywords: ["flight fare comparison", "flight discovery", "GTH PRO travel", "airline fares"],
  openGraph: {
    title: "Flight Fare Discovery | GTH PRO",
    description: "Find routes, filter observed fares and continue with the booking partner.",
    type: "website",
  },
};

export default function FlightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
