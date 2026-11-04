import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";
import TransportRouteDiscovery from "@/components/travel/TransportRouteDiscovery";

export const metadata: Metadata = {
  alternates: { canonical: "/bus" },
  title: "Worldwide Bus Journey Search | GTH PRO",
  description: "Plan bus journeys with GTH PRO and continue to the connected booking platform to check supported routes and current availability.",
};

type RouteSearch = { from?: string | string[]; to?: string | string[] };
type Props = { searchParams: Promise<RouteSearch> };
function verifiedRouteValue(value: unknown): string {
  return typeof value === "string" && /^[\p{L} .'-]{2,80}$/u.test(value) ? value : "";
}

export default async function BusPage({ searchParams }: Props) {
  const query = await searchParams;
  return (
    <TravelServicePage
      searchFirstLayout
      eyebrow="GTH PRO · Ground transport"
      title="Explore worldwide bus journeys"
      description="Plan journeys with GTH PRO’s own search form and continue to the connected booking experience for supported routes, schedules and tickets."
      image="/images/dighabus.jpg"
      noLiveDataNotice="GTH PRO does not have a live bus inventory connection. Search results, fares, seating, cancellation conditions and ticket confirmation are provided by the booking partner."
      whatToCheck={[
        "Confirm departure and arrival terminals, travel date and boarding time on the provider site.",
        "Review operator ratings, luggage rules and facilities as displayed by the provider.",
        "Check the full payable fare, cancellation policy and refund conditions before booking.",
        "Keep your ticket and any support reference from the provider; GTH PRO does not issue tickets.",
      ]}
      partners={[
        { name: "GTH PRO Bus Booking", url: "/go/transport", actionLabel: "Search available journeys", description: "Continue to the connected booking experience for supported bus routes. Availability, tickets, payments and refunds are handled by the authorized booking provider. GTH PRO may earn a referral commission." },
      ]}
    >
      <TransportPlanner key={verifiedRouteValue(query.from) + ":" + verifiedRouteValue(query.to)} mode="bus" initialFrom={verifiedRouteValue(query.from)} initialTo={verifiedRouteValue(query.to)} />
      <TransportRouteDiscovery mode="bus" />
    </TravelServicePage>
  );
}
