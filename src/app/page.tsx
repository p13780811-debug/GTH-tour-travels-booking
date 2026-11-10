import type { Metadata } from "next";
import FlagshipHome from "@/components/home/FlagshipHome";

export const metadata: Metadata = {
  title: "GTH PRO | Global Travel, Real Estate & Tender Platform",
  description: "Explore GTH PRO property records and buyer tools, flight and hotel searches, tours, destination guides, and source-backed public tender research.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <FlagshipHome />;
}
