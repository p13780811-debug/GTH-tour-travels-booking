import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public editorial URL compatibility. A former /tender/guides link must not
  // fall through to the protected /tender/[id] UUID route.
  async redirects() {
    // Legacy hotel search links often carried ?city=Kolkata without a mode.
    // Do not treat a plain city/name as a request to open our non-bookable
    // public directory. Preserve the original query while selecting the
    // existing Nuitee supplier booking widget. Explicit view=directory stays.
    const bookingKeys=["city","destination","name","country"];
    const bookingRedirects=bookingKeys.map(key=>({
      source:"/hotels",
      has:[{type:"query" as const,key}],
      missing:[{type:"query" as const,key:"view"}],
      destination:"/hotels?view=booking",
      permanent:false,
    }));
    return [
      // Legacy public policy links are not canonical pages. Redirect rather than
      // serving duplicate legal content or letting old crawlers hit a 404.
      {source:"/privacy",destination:"/privacy-policy",permanent:true},
      {source:"/terms",destination:"/terms-and-conditions",permanent:true},
      {source:"/tender/guides",destination:"/knowledge/tenders",permanent:true},
      ...bookingRedirects,
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
};

export default nextConfig;
