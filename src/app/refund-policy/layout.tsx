import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | GTH PRO",
  description: "Guidance about GTH PRO third-party booking referrals, cancellation rules and provider-managed refunds.",
  alternates: { canonical: "/refund-policy" },
};
export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
