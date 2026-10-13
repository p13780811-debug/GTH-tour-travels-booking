import type { Metadata } from "next";
import DestinationPage, { generateMetadata as destinationMetadata } from "../[slug]/page";

// Keep the legacy Digha URL, but render the same connected destination guide.
// No unverified prices, fake hotels, video placeholders or "verified" badges.
const params = Promise.resolve({ slug: "digha" });

export async function generateMetadata(): Promise<Metadata> {
  return destinationMetadata({ params });
}

export default function DighaPage() {
  return <DestinationPage params={params} />;
}
