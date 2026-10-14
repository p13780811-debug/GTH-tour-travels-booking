import type { Metadata } from "next";
import ToursPage from "../tours/page";
import type { TourFilters } from "@/lib/tours";

export const metadata: Metadata = {
  alternates: { canonical: "/tours" },
  title: "Activities & Experiences | GTH PRO Travel",
  description: "Explore destination experiences and activities. Verify current availability and final prices with each booking provider.",
};

// Share the validated real-inventory experience marketplace rather than
// silently redirecting customers to an unrelated external service.
export default function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<TourFilters>;
}) {
  return <ToursPage searchParams={searchParams} />;
}
