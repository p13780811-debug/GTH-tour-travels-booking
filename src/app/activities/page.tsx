import type { Metadata } from "next";
import TourLanding from "@/components/tours/TourLanding";

export const metadata: Metadata = {
  alternates: { canonical: "/activities" },
  title: "Activities & Experiences | GTH PRO Travel",
  description: "Explore destination experiences and activities. Verify current availability and final prices with each booking provider.",
};

// Activities has its own route identity and experience categories.
export default function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string,unknown>>;
}) {
  return <TourLanding searchParams={searchParams} basePath="/activities" />;
}
