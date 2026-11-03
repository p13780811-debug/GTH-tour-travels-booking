import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";
import TransportRouteDiscovery from "@/components/travel/TransportRouteDiscovery";
import TwelveGoSearchWidget from "@/components/travel/TwelveGoSearchWidget";

export const metadata: Metadata = {
  alternates: { canonical: "/bus" },
  title: "Bus Travel Planning and Partner Booking | GTH PRO",
  description: "Plan a bus journey and compare current departures and final ticket prices directly with independent operators.",
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
        { name: "12Go bus and regional transport", url: "https://12go.asia/en", description: "Browse supported bus, train and ferry journeys; the partner handles ticketing and payment. No affiliate tracking is configured." },
        { name: "Busbud global bus and rail booking", url: "https://www.busbud.com/en", description: "Explore operators and routes in supported countries; check live departures with the partner." },
      ]}
    >
      <TransportPlanner key={verifiedRouteValue(query.from) + ":" + verifiedRouteValue(query.to)} mode="bus" initialFrom={verifiedRouteValue(query.from)} initialTo={verifiedRouteValue(query.to)} />
      <TwelveGoSearchWidget mode="bus" />
      <TransportRouteDiscovery mode="bus" />
    </TravelServicePage>
  );
}
