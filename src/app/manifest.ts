import type { MetadataRoute } from "next";

/** App-mode navigation reuses the existing GTH PRO Next.js routes and APIs. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "GTH PRO — Global Technical Hub",
    short_name: "GTH PRO",
    description: "One mobile ecosystem for Travel, Real Estate and Tender discovery.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#061426",
    theme_color: "#061426",
    prefer_related_applications: false,
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Flights", short_name: "Flights", url: "/flights" },
      { name: "Hotels", short_name: "Hotels", url: "/hotels" },
      { name: "Real Estate", short_name: "Property", url: "/real-estate" },
      { name: "Tender", short_name: "Tender", url: "/tender" },
    ],
  };
}
