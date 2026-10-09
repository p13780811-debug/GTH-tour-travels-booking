import type { Metadata } from "next";
import GTHHomeV13 from "@/components/home/GTHHomeV13";

export const metadata: Metadata = {
  title: "GTH PRO | Global Technical Hub",
  description:
    "GTH PRO is a development-stage technology ecosystem for Real Estate, Travel and Tender Intelligence.",
};

export default function Home() {
  return <GTHHomeV13 />;
}
