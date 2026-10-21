import type { Metadata } from "next";
import ToursExplorer from "@/components/tours/ToursExplorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/tours" },
  title: "Worldwide Tours, Activities & Attraction Tickets | GTH PRO Travel",
  description: "Find global tours, attraction tickets, city passes, audio tours and activities with independent booking partners and source-backed GTH PRO records.",
  openGraph: { title: "GTH PRO Tours & Activities", description: "Explore international tours and experiences, with provider-managed booking handoffs.", url: "/tours", type: "website", images: ["/images/mega/tours.jpg"] },
  twitter: { card: "summary_large_image", title: "GTH PRO Tours & Activities", images: ["/images/mega/tours.jpg"] },
};

export default function ToursPage({ searchParams }: { searchParams: Promise<Record<string, unknown>> }) {
  return <ToursExplorer searchParams={searchParams} basePath="/tours" />;
}
