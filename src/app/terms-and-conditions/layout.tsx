import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Terms and Conditions | GTH PRO",
  description: "Terms of use for GTH PRO travel discovery, property marketplace and tender information.",
  alternates: { canonical: "/terms-and-conditions" },
};
export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
