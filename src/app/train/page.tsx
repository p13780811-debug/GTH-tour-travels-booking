import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";
import TransportRouteDiscovery from "@/components/travel/TransportRouteDiscovery";

export const metadata: Metadata = {
  alternates: { canonical: "/train" },
  title: "Global Train & Rail Journey Planning | GTH PRO",
  description: "Explore rail journeys across Asia and beyond with GTH PRO’s global planner. Continue to 12Go for supported routes and partner-managed ticket availability.",
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
      eyebrow="GTH PRO · Global rail journeys"
      title="Explore global rail journeys — Asia & beyond"
      description="Plan train journeys across supported countries with GTH PRO’s own search form. Continue to the 12Go White Label to check available routes, schedules, prices and tickets. Coverage varies by country."
      image="/brand/travel-story.jpg"
      noLiveDataNotice="GTH PRO does not provide direct live train inventory, fare confirmation or ticket issuance. The 12Go partner supports selected global routes; Indian Railways / IRCTC is not integrated with GTH PRO."
      whatToCheck={[
        "Verify departure and arrival stations, local travel dates and any border-crossing requirements with the booking provider.",
        "Compare operator terms, ticket class, transfer connections, baggage rules and the total final fare before paying.",
        "For India-specific PNR and official train-running enquiries, use the railway authority directly; do not enter PNR information on this page.",
        "Check current travel documentation, boarding details and refund rules with the operating provider.",
      ]}
      partners={[
        { name: "IRCTC — India-only official booking", url: "https://www.irctc.co.in/nget/train-search", description: "Independent official option for Indian Railways. This is not integrated with GTH PRO or the 12Go White Label." },
        { name: "National Train Enquiry System", url: "https://enquiry.indianrail.gov.in/ntes/", description: "Official running-train and schedule enquiries (not a ticket booking service)." },
        { name: "12Go regional train and ground transport", url: "/go/12go", description: "The approved 12Go White Label opens automatically when HTTPS is ready; otherwise continue through our official tracked affiliate link. 12Go handles availability, checkout and tickets." },
        { name: "Busbud intercity buses and trains", url: "https://www.busbud.com/en", description: "Explore bus and rail bookings in supported markets; confirm actual route and date with Busbud." },
      ]}
    >
      <TransportPlanner key={verifiedRouteValue(query.from) + ":" + verifiedRouteValue(query.to)} mode="train" initialFrom={verifiedRouteValue(query.from)} initialTo={verifiedRouteValue(query.to)} />
      <TransportRouteDiscovery mode="train" />
    </TravelServicePage>
  );
}
