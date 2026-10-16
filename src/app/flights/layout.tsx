import type { Metadata } from "next";
import "./flights.css";

export const metadata: Metadata = {
  alternates: { canonical: "/flights" },
  title: "Search Flights & Airport Travel Services | GTH PRO",
  description:
    "Search Aviasales White Label flights on GTH PRO and explore verified airport transfers, insurance, car rentals and destination booking partners.",
  keywords: ["flight fare comparison", "flight discovery", "GTH PRO travel", "airline fares"],
  openGraph: {
    title: "Worldwide Flights & Airport Services | GTH PRO",
    description: "Explore flight supplier results, airport transfers, insurance and complete travel services.",
    type: "website",
  },
};

export default function FlightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
