import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";
import TransportRouteDiscovery from "@/components/travel/TransportRouteDiscovery";
import TwelveGoSearchWidget from "@/components/travel/TwelveGoSearchWidget";

export const metadata: Metadata = {
  alternates: { canonical: "/train" },
  title: "Indian Rail Journey Planning | GTH PRO",
  description: "Prepare a rail route and continue to official Indian Railways services for train schedules, ticketing and status checks.",
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
      eyebrow="GTH PRO · Rail journeys"
      title="Plan an Indian Railways journey"
      description="Choose your stations and journey date, then use official Indian Railways services for schedules, ticket availability, PNR enquiries and ticketing."
      image="/brand/travel-story.jpg"
      noLiveDataNotice="GTH PRO has no verified Indian Railways API connection. Train availability, PNR status, platform details, fares and live-running status are not supplied by this page."
      whatToCheck={[
        "Use the official provider to confirm station codes, train number and departure date.",
        "Review quota, class, waitlist status and final fare on IRCTC before payment.",
        "For PNR and running enquiries, check official railway services; do not share your PNR on this page.",
        "Check current railway rules and boarding information with the operator before travelling.",
      ]}
      partners={[
        { name: "IRCTC ticket booking", url: "https://www.irctc.co.in/nget/train-search", description: "Official Indian Railways online ticketing service." },
        { name: "National Train Enquiry System", url: "https://enquiry.indianrail.gov.in/ntes/", description: "Official running-train and schedule enquiries (not a ticket booking service)." },
        { name: "12Go regional train and ground transport", url: "https://12go.asia/en", description: "Compare supported regional ground-transport services on the partner site. Independent ticketing; no affiliate tracking is configured." },
        { name: "Busbud intercity buses and trains", url: "https://www.busbud.com/en", description: "Explore bus and rail bookings in supported markets; confirm actual route and date with Busbud." },
      ]}
    >
      <TransportPlanner key={verifiedRouteValue(query.from) + ":" + verifiedRouteValue(query.to)} mode="train" initialFrom={verifiedRouteValue(query.from)} initialTo={verifiedRouteValue(query.to)} />
      <TwelveGoSearchWidget mode="train" />
      <TransportRouteDiscovery mode="train" />
    </TravelServicePage>
  );
}
