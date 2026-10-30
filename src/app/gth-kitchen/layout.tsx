import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thali Treats Palava | Bengali Food & Ordering | GTH PRO",
  description:
    "Order Thali Treats Bengali meals in Palava and Dombivli through the GTH PRO ecosystem. Live menu, cart and secure kitchen-backed ordering.",
  alternates: { canonical: "/gth-kitchen" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Thali Treats Palava | GTH PRO",
    description:
      "Bengali home-kitchen ordering in Palava and Dombivli, connected to the GTH PRO ecosystem.",
    url: "/gth-kitchen",
    type: "website",
  },
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
