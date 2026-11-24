import type { Metadata } from "next";
import Link from "next/link";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import TenderServiceForm from "@/components/tender/TenderServiceForm";
import { getCachedPublicTender } from "@/lib/tender/public-reader";
import { SERVICE_UUID, serviceChoice } from "@/lib/tender/services";

export const metadata: Metadata = {
  title: "Tender Assistance | GTH PRO App",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AppTenderQuote({ searchParams }: Props) {
  const params = await searchParams;
  const initialService = serviceChoice(params.service) ?? "eligibility_review";
  const id = typeof params.tenderId === "string" && SERVICE_UUID.test(params.tenderId) ? params.tenderId : null;
  const result = id ? await getCachedPublicTender(id) : null;
  const tender = result?.ok && result.item ? { id: result.item.id, title: result.item.title } : null;

  return <main className="min-h-dvh bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]">
    <MobileAppHeader />
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:px-6">
      <Link href="/app/tenders" className="inline-flex min-h-11 items-center text-sm underline">Back to tenders</Link>
      <h1 className="text-2xl font-bold">Tender assistance</h1>
      {params.tenderId !== undefined && !tender
        ? <p role="alert" className="rounded-xl border border-[var(--border)] p-4 text-sm">
          The selected notice could not be confirmed. <Link className="underline" href="/app/tenders/quote">Open a general quote request</Link>
        </p>
        : <TenderServiceForm appMode key={initialService + (tender?.id ?? "")} initialService={initialService} tender={tender} />}
    </div>
  </main>;
}
