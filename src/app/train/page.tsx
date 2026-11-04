import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import GTHTransportSearchWidget from "@/components/travel/GTHTransportSearchWidget";
import TransportRouteDiscovery from "@/components/travel/TransportRouteDiscovery";

export const metadata: Metadata = {
  alternates: { canonical: "/train" },
  title: "Global Train & Rail Journey Planning | GTH PRO",
  description: "Explore worldwide rail journeys with GTH PRO. Check supported routes and live ticket availability through the connected booking experience.",
};

export default function TrainPage() {
  return (
    <TravelServicePage
      searchFirstLayout
      eyebrow="GTH PRO · Global rail journeys"
      title="Explore global rail journeys — Asia & beyond"
      description="Search supported rail journeys through GTH PRO's integrated booking form. Enter the route once and continue to provider-managed results and checkout. Coverage varies by country."
      image="/brand/travel-story.jpg"
      noLiveDataNotice="GTH PRO does not issue rail tickets or provide independent fare confirmation. Routes, fares and tickets depend on the booking provider; official railway PNR services are not integrated."
      whatToCheck={[
        "Verify departure and arrival stations, local travel dates and any border-crossing requirements with the booking provider.",
        "Compare operator terms, ticket class, transfer connections, baggage rules and the total final fare before paying.",
        "For country-specific PNR and train-running enquiries, consult the railway authority directly; do not enter PNR information on this page.",
        "Check current travel documentation, boarding details and refund rules with the operating provider.",
      ]}
      partners={[]}
    >
      <GTHTransportSearchWidget mode="train" />
      <TransportRouteDiscovery mode="train" />
    </TravelServicePage>
  );
}
