import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy Policy | GTH PRO",
  description: "How GTH PRO handles platform enquiries, data use, third-party services and privacy requests.",
  alternates: { canonical: "/privacy-policy" },
};
export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
