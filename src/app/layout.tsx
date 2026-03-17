import { Cinzel } from "next/font/google"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"
import ChatBot from "@/components/ChatBot"
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import TravelMasterTemplate from "@/components/templates/TravelMasterTemplate"

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gth-ecosystem.vercel.app"),

  title: "GTH Luxury Travel | International Premium Travel Ecosystem",
  description: "GTH Luxury Travel offers premium destinations and luxury hotels worldwide.",
  robots: {
    index: false,
    follow: false,
  },
  keywords: ["Luxury Travel", "Premium Hotels"],
  openGraph: {
    title: "GTH Luxury Travel",
    description: "Premium global destinations.",
    type: "website",
  },



};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${cinzel.className} bg-black text-white`}>

        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXX');
            `,
          }}
        />

        <Navbar />




        <main className="pt-10">
          {children}
        </main>
        <MobileNav />
        <ChatBot />
        <Footer />

      </body>
    </html>
  );
}






