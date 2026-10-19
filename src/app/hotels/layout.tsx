import TravelSectionNav from "@/components/travel/TravelSectionNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/hotels" },
  title: "Explore Hotels & Stays | GTH PRO Travel",
  description: "Browse actual hotel listings and continue to booking partners for room availability, inclusive prices, taxes, fees and cancellation rules.",
  openGraph: {
    title: "GTH PRO Hotels",
    description: "Explore hotels worldwide with transparent booking partner information.",
    type: "website",
  },
};

export default function HotelTravelLayout({ children }: { children: React.ReactNode }) {
  return <><TravelSectionNav />{children}</>;
}
