import type { Metadata } from "next";
import TenderSavedWorkspace from "@/components/tender/TenderSavedWorkspace";

export const metadata: Metadata = {
  title: "Saved Tenders & Comparison Workspace | GTH PRO",
  description: "Revisit your device-only tender shortlist, compare current public notices and prepare for official procurement deadlines.",
  robots: { index: false, follow: false },
};
export default async function SavedTendersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  return <TenderSavedWorkspace initialView={view === "compare" ? "compare" : "saved"}/>;
}
