import type { Metadata } from "next";
import FlagshipHome from "@/components/home/FlagshipHome";

export const metadata: Metadata = {
  title: "GTH PRO | Global Travel, Real Estate, Tender & Tickets Platform",
  description: "Explore GTH PRO property records and buyer tools, flight and hotel searches, worldwide tickets, stadium guides, tours, destination guides, and source-backed public tender research.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <FlagshipHome />;
}
