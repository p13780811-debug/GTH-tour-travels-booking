import type { Metadata } from "next";
import MegaAggregator, { metadata as megaMetadata } from "./mega-aggregator/page";

// The approved mega-aggregator is the GTH PRO homepage. Keep one source of UI truth.
export const revalidate = 60;
export const metadata: Metadata = {
  ...megaMetadata,
  alternates: { canonical: "/" },
};

export default function Home() {
  return <MegaAggregator />;
}
