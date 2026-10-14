import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";

export const metadata: Metadata = {
  alternates: { canonical: "/transfers" },
  title: "Airport Transfers and Pickup Planning | GTH PRO",
  description: "Plan airport arrivals and departures, and confirm vehicle options, prices and availability with an external transfer provider.",
};

export default function TransfersPage() {
  return (
    <TravelServicePage
      eyebrow="GTH PRO · Airport pickups"
      title="Simpler airport transfer planning"
      description="Prepare your airport pickup or drop-off details and continue with an external transfer provider to review local coverage, vehicles and booking terms."
      image="/images/mega/transfers.jpg"
      noLiveDataNotice="No live taxi dispatch, driver tracking, car availability or transfer quote is available through GTH PRO. The provider confirms service availability and the final amount."
      whatToCheck={[
        "Confirm exact terminal, pickup point and flight arrival or departure time.",
        "Allow appropriate time for immigration, baggage collection and terminal transfers.",
        "Check luggage capacity, child seats, meeting instructions and waiting time.",
        "Review the final price, refund policy and provider support contact before paying.",
      ]}
      partners={[
        { name: "Welcome Pickups", url: "https://www.welcomepickups.com/", description: "Explore airport pickup services in supported destinations and complete booking on the provider website." },
      ]}
    >
      <TransportPlanner mode="transfer" />
    </TravelServicePage>
  );
}
