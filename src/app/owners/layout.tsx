import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Owner Tools | GTH PRO",
  robots: { index: false, follow: false },
};
export default function OwnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
