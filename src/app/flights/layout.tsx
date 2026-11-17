import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/flights" },
  title: "Search Flights & Airport Travel Services | GTH PRO",
  description:
    "Search worldwide flights with the GTH Global Booking Engine and explore GTH Mobility airport transfers, car rentals and destination travel services.",
  keywords: ["flight fare comparison", "flight discovery", "GTH PRO travel", "airline fares"],
  openGraph: {
    title: "Worldwide Flights & Airport Services | GTH PRO",
    description: "Explore flight supplier results, airport transfers, insurance and complete travel services.",
    type: "website",
  },
};

export default function FlightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
