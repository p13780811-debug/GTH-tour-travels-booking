import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import GTHTransportSearchWidget from "@/components/travel/GTHTransportSearchWidget";
import TransportRouteDiscovery from "@/components/travel/TransportRouteDiscovery";

export const metadata: Metadata = {
  alternates: { canonical: "/bus" },
  title: "Worldwide Bus Journey Search | GTH PRO",
  description: "Plan bus journeys with GTH PRO and continue to the connected booking platform to check supported routes and current availability.",
};

export default function BusPage() {
  return (
    <TravelServicePage
      searchFirstLayout
      eyebrow="GTH PRO · Ground transport"
      title="Explore worldwide bus journeys"
      description="Search bus tickets through GTH PRO's integrated booking form. Enter your journey once and continue to provider-managed results and checkout."
      image="/images/dighabus.jpg"
      noLiveDataNotice="GTH PRO does not issue bus tickets or hold live seat inventory. Route availability, fares, payments and ticket confirmation come from the connected booking provider."
      whatToCheck={[
        "Confirm departure and arrival terminals, travel date and boarding time on the provider site.",
        "Review operator ratings, luggage rules and facilities as displayed by the provider.",
        "Check the full payable fare, cancellation policy and refund conditions before booking.",
        "Keep your ticket and any support reference from the provider; GTH PRO does not issue tickets.",
      ]}
      partners={[]}
    >
      <GTHTransportSearchWidget mode="bus" />
      <TransportRouteDiscovery mode="bus" />
    </TravelServicePage>
  );
}
