import { Cinzel } from "next/font/google"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"
import ChatBot from "@/components/ChatBot"
import Footer from "@/components/Footer";
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

export const metadata = {
  title: "GTH Luxury Travel | International Premium Travel Ecosystem",
  description:
    "GTH Luxury Travel is an international travel ecosystem offering premium destinations, luxury hotels, verified local guides and seamless booking experiences worldwide.",
  keywords: [
    "Luxury Travel",
    "International Travel Platform",
    "Premium Hotels",
    "Global Travel Booking",
    "Elite Travel Experience",
  ],
  openGraph: {
    title: "GTH Luxury Travel",
    description:
      "Discover premium global destinations with verified luxury hotels and elite travel experiences.",
    type: "website",
  },
}
export const metadata2: Metadata = {
  title: "GTH Luxury | International Travel & Hotels",
  description:
    "Book luxury hotels worldwide with best prices, AI travel assistant and premium destinations.",
  keywords: [
    "luxury hotels",
    "international travel",
    "beach resorts",
    "Dubai hotels",
    "Goa luxury stay"
  ],
  openGraph: {
    title: "GTH Luxury",
    description: "International luxury travel ecosystem",
    url: "https://yourdomain.com",
    siteName: "GTH Luxury",
    locale: "en_US",
    type: "website",
  },
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <ChatBot />

        {children}
        <Footer />
      </body>
    </html>
  );
}
