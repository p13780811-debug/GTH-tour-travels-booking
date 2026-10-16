import type { Metadata } from "next";
import FlagshipHome from "@/components/home/FlagshipHome";

export const metadata: Metadata = {
  title: "GTH PRO | Global Travel, Real Estate & Tender Platform",
  description: "Discover travel planning, global property markets and public tender opportunities with GTH PRO, the Global Technical Hub.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <FlagshipHome />;
}
