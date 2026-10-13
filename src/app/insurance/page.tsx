import type { Metadata } from "next";
import Link from "next/link";
import TravelServicePage from "@/components/travel/TravelServicePage";

export const metadata: Metadata = {
  title: "Travel Insurance Guide & Provider Handoff | GTH PRO",
  description: "Understand international travel insurance coverage, exclusions, cancellation and claims rules, then verify policy terms with the provider.",
  alternates: { canonical: "/insurance" },
};

export default function InsurancePage() {
  return (
    <TravelServicePage
      eyebrow="GTH PRO · Travel protection"
      title="Travel insurance, explained before you buy"
      description="Prepare for international or domestic travel with clear coverage questions. Read the provider's actual policy, eligibility and exclusions before buying."
      image="/images/mega/insurance.jpg"
      noLiveDataNotice="GTH PRO does not underwrite, sell or issue insurance policies. No premium quotes, coverage guarantees or claims approval are provided here."
      whatToCheck={[
        "Confirm the destinations, nationality and age limits your selected plan actually covers.",
        "Read the medical limit, pre-existing condition exclusions, deductibles and evacuation conditions.",
        "Check cancellation, baggage, delays, extreme sports and other optional benefit limits.",
        "Review the underwriter's identity, claims procedure, support number and cancellation policy.",
        "Check destination visa and mandatory travel insurance rules with official authorities.",
      ]}
      partners={[{
        name: "EKTA Travel Insurance",
        url: "https://ektatraveling.tpo.lv/zRNsrOPf",
        description: "External affiliate referral. Review actual coverage, eligibility and policy conditions directly with the provider.",
      }]}
    >
      <div className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-7">
        <h2 className="text-xl font-bold">Compare the policy, not just the headline</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
          Travel insurance is separate from other travel reservations. GTH PRO may earn referral commission for outbound provider visits. Never substitute advertising for the insurer's official policy wording.
        </p>
        <nav aria-label="Related travel services" className="mt-5 flex flex-wrap gap-4 text-sm underline">
          <Link href="/flights">Flights</Link>
          <Link href="/hotels">Hotels</Link>
          <Link href="/activities">Activities</Link>
          <Link href="/guides">Planning guides</Link>
        </nav>
      </div>
    </TravelServicePage>
  );
}
