import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";

export const metadata: Metadata = {
  alternates: { canonical: "/bus" },
  title: "Bus Travel Planning and Partner Booking | GTH PRO",
  description: "Plan a bus journey and compare current departures and final ticket prices directly with independent operators.",
};

export default function BusPage() {
  return (
    <TravelServicePage
      eyebrow="GTH PRO · Ground transport"
      title="Plan your bus journey with confidence"
      description="Explore bus travel without invented fares, seat counts or ticket confirmations. Start with your route and continue to an established booking service for actual inventory."
      image="/images/dighabus.jpg"
      noLiveDataNotice="GTH PRO does not have a live bus inventory connection. Search results, fares, seating, cancellation conditions and ticket confirmation are provided by the booking partner."
      whatToCheck={[
        "Confirm departure and arrival terminals, travel date and boarding time on the provider site.",
        "Review operator ratings, luggage rules and facilities as displayed by the provider.",
        "Check the full payable fare, cancellation policy and refund conditions before booking.",
        "Keep your ticket and any support reference from the provider; GTH PRO does not issue tickets.",
      ]}
      partners={[
        { name: "redBus India", url: "https://www.redbus.in/", description: "Search Indian bus routes and book directly with redBus." },
        { name: "redBus International", url: "https://www.redbus.com/", description: "Explore supported international bus routes; coverage depends on region." },
      ]}
    >
      <TransportPlanner mode="bus" />
    </TravelServicePage>
  );
}
