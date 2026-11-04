import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";
import TransportRouteDiscovery from "@/components/travel/TransportRouteDiscovery";

export const metadata: Metadata = {
  alternates: { canonical: "/train" },
  title: "Global Train & Rail Journey Planning | GTH PRO",
  description: "Explore worldwide rail journeys with GTH PRO. Check supported routes and live ticket availability through the connected booking experience.",
};

type RouteSearch = { from?: string | string[]; to?: string | string[] };
type Props = { searchParams: Promise<RouteSearch> };
function verifiedRouteValue(value: unknown): string {
  return typeof value === "string" && /^[\p{L} .'-]{2,80}$/u.test(value) ? value : "";
}

export default async function TrainPage({ searchParams }: Props) {
  const query = await searchParams;
  return (
    <TravelServicePage
      searchFirstLayout
      eyebrow="GTH PRO · Global rail journeys"
      title="Explore global rail journeys — Asia & beyond"
      description="Plan global rail journeys with GTH PRO’s own search form, then continue to the connected booking experience for supported routes, schedules and tickets. Coverage varies by country."
      image="/brand/travel-story.jpg"
      noLiveDataNotice="GTH PRO does not provide direct live train inventory, fare confirmation or ticket issuance. Booking coverage varies by country and provider. Domestic railway status and PNR services are not integrated."
      whatToCheck={[
        "Verify departure and arrival stations, local travel dates and any border-crossing requirements with the booking provider.",
        "Compare operator terms, ticket class, transfer connections, baggage rules and the total final fare before paying.",
        "For country-specific PNR and train-running enquiries, consult the railway authority directly; do not enter PNR information on this page.",
        "Check current travel documentation, boarding details and refund rules with the operating provider.",
      ]}
      partners={[
        { name: "GTH PRO Train Booking", url: "/go/transport", actionLabel: "Search available journeys", description: "Explore supported rail journeys through the connected booking experience. Current fares, ticket issuance, payments and refunds are managed by the authorized booking provider. GTH PRO may earn a referral commission." },
      ]}
    >
      <TransportPlanner key={verifiedRouteValue(query.from) + ":" + verifiedRouteValue(query.to)} mode="train" initialFrom={verifiedRouteValue(query.from)} initialTo={verifiedRouteValue(query.to)} />
      <TransportRouteDiscovery mode="train" />
    </TravelServicePage>
  );
}
