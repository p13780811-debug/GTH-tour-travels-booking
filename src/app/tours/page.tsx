import type { Metadata } from "next";
import TourLanding from "@/components/tours/TourLanding";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/tours" },
  title: "Worldwide Tours & Day Trips | GTH PRO Travel",
  description: "Find guided city tours, self-guided audio walks and day trips worldwide with independent booking partners and source-backed GTH PRO records.",
  openGraph: { title: "GTH PRO Tours", description: "Explore international tours and experiences, with provider-managed booking handoffs.", url: "/tours", type: "website", images: ["/images/mega/tours.jpg"] },
  twitter: { card: "summary_large_image", title: "GTH PRO Tours", images: ["/images/mega/tours.jpg"] },
};

export default function ToursPage({ searchParams }: { searchParams: Promise<Record<string, unknown>> }) {
  return <TourLanding searchParams={searchParams} basePath="/tours" />;
}
