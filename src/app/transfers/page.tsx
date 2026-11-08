import type { Metadata } from "next";
import TravelServicePage from "@/components/travel/TravelServicePage";
import TransportPlanner from "@/components/travel/TransportPlanner";
import TransferProviderWidgets from "@/components/travel/TransferProviderWidgets";
import AirportJourneyServices from "@/components/travel/AirportJourneyServices";
import TravelPartnerSearch from "@/components/travel/TravelPartnerSearch";
import TransferAirportFinder from "@/components/travel/TransferAirportFinder";
import TransferHubShowcase from "@/components/travel/TransferHubShowcase";
import Link from "next/link";
import { ArrowRight, CarFront, MapPin } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/transfers" },
  title: "Airport Transfer Hub | Private Pickups, Shuttles & Partners | GTH PRO",
  description: "Explore visual airport pickup, private car, family transfer and shuttle guides. Compare transfer suppliers with existing Kiwitaxi, intui.travel, Welcome Pickups and GetTransfer links.",
  openGraph: { title: "Airport Transfers, Kiwitaxi & Pickups | GTH PRO", description: "Discover arrival airports and compare airport transfer providers with clearly labeled partner booking options.", url: "/transfers", type: "website", images: ["/images/mega/transfers.jpg"] },
};

export default function TransfersPage() {
  return (
    <TravelServicePage
      searchFirstLayout
      eyebrow="GTH PRO · Airport pickups"
      title="Airport transfers, built around your journey"
      description="Explore your airport and compare transfer providers in one full-width GTH PRO experience. Book and pay only with the selected supplier."
      image="/images/mega/transfers.jpg"
      noLiveDataNotice="The search widgets below are operated by an external provider. GTH PRO does not dispatch vehicles, guarantee availability, or process transport reservations. Always confirm final prices, pickup details and conditions with the provider."
      whatToCheck={[
        "Confirm exact terminal, pickup point and flight arrival or departure time.",
        "Allow appropriate time for immigration, baggage collection and terminal transfers.",
        "Check luggage capacity, child seats, meeting instructions and waiting time.",
        "Review the final price, refund policy and provider support contact before paying.",
      ]}
      partners={[
        { name: "Welcome Pickups", url: "https://tpo.lv/GFuzmgYk", actionLabel: "Explore pickup options", description: "Check airport pickups and final availability with the selected supplier. Affiliate referral and supplier-managed checkout." },
      ]}
    >
      <nav aria-label="Airport transfers quick links" className="mb-7 grid min-w-0 gap-3 sm:grid-cols-3">
        <a href="#transfer-provider-heading" className="gth-btn-gold inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
          <CarFront size={18} aria-hidden="true" /> Compare transfer providers <ArrowRight size={16} aria-hidden="true" />
        </a>
        <a href="#airport-pickup-lookup" className="gth-glass inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold">
          <MapPin size={18} aria-hidden="true" /> Find your airport
        </a>
        <Link href="/travel/airports" className="gth-glass inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold">
          Airport Explorer <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
      <TransferHubShowcase />
      <TransferAirportFinder />
      <TransferProviderWidgets />
      <details className="gth-glass mb-10 min-w-0 rounded-2xl border border-[var(--border)] p-4 sm:p-6">
        <summary className="cursor-pointer text-sm font-bold">
          Optional: search other airport transfer activities on Klook
        </summary>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
          This is an additional Klook affiliate destination search, not the Kiwitaxi or intui.travel transfer booking engine.
          It opens Klook in a new tab; location and availability must be confirmed there.
        </p>
        <div className="mt-4"><TravelPartnerSearch kind="transfers" /></div>
      </details>
      <AirportJourneyServices />
      <div className="mb-5">
        <h2 className="text-xl font-bold">Optional journey checklist</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">If you are still planning, review pickup details below. This checklist does not transfer your answers into the supplier widgets.</p>
      </div>
      <TransportPlanner mode="transfer" />
    </TravelServicePage>
  );
}
