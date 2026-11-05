import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import GTHTransportSearchWidget from "@/components/travel/GTHTransportSearchWidget";

export const metadata: Metadata = {
  alternates: { canonical: "/ferry" },
  title: "Worldwide Ferry and Sea Routes | GTH PRO",
  description: "Search supported ferries, speedboats and island connections worldwide from GTH PRO. Check current operator availability and book through the connected travel provider.",
};

export default function FerryPage() {
  return (
    <TravelServicePage
      searchFirstLayout
      eyebrow="GTH PRO · Worldwide sea transport"
      title="Explore worldwide ferry journeys"
      description="Discover sea, speedboat and island connections using the GTH PRO search. Current fares, sailing times and bookings depend on supported operators."
      image="/images/cities/goa.jpg"
      noLiveDataNotice="GTH PRO does not operate ferries or issue tickets. Routes, sailing schedules, fares and available seats depend on independent operators and the connected booking provider."
      whatToCheck={[
        "Confirm the correct departure pier, arrival terminal and sailing date before booking.",
        "Check weather conditions, boarding cutoff times, baggage limits and any sea-transfer connections.",
        "Review the operator’s cancellation, rescheduling and refund conditions.",
        "If your route is unavailable online, check alternate ports or travel dates with the booking provider.",
      ]}
      partners={[]}
    >
      <GTHTransportSearchWidget mode="ferry" />
    </TravelServicePage>
  );
}
