import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public editorial URL compatibility. A former /tender/guides link must not
  // fall through to the protected /tender/[id] UUID route.
  async redirects() {
    return [{source:"/tender/guides",destination:"/knowledge/tenders",permanent:true}];
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
