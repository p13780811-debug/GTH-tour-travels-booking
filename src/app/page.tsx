import type { Metadata } from "next";
import FlagshipHome from "@/components/home/FlagshipHome";

export const metadata: Metadata = {
  title: "GTH PRO | Global Intelligence Ecosystem",
  description: "One connected global ecosystem for Real Estate, Travel, and Tender Intelligence.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <FlagshipHome />;
}
