import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";
import TransferProviderWidgets from "@/components/travel/TransferProviderWidgets";
import AirportJourneyServices from "@/components/travel/AirportJourneyServices";

export const metadata: Metadata = {
  alternates: { canonical: "/transfers" },
  title: "Airport Services, Transfers & Travel Extras | GTH PRO",
  description: "Explore airport transfers, flight compensation, car rentals, lounges, luggage services and onward travel with clearly identified external providers.",
};

export default function TransfersPage() {
  return (
    <TravelServicePage
      eyebrow="GTH PRO · Airport pickups"
      title="Airport services and onward travel"
      description="From flight protection and airport pickups to car rentals, hotels and tours, find your next travel service and continue with the relevant provider."
      image="/images/mega/transfers.jpg"
      noLiveDataNotice="The search widgets below are operated by an external provider. GTH PRO does not dispatch vehicles, guarantee availability, or process transport reservations. Always confirm final prices, pickup details and conditions with the provider."
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
      <AirportJourneyServices />
      <TransferProviderWidgets />
      <div className="mb-5">
        <h2 className="text-xl font-bold">Optional journey checklist</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">If you are still planning, review pickup details below. This checklist does not transfer your answers into the supplier widgets.</p>
      </div>
      <TransportPlanner mode="transfer" />
    </TravelServicePage>
  );
}
