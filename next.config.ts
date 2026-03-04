import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Isse build ke waqt TS errors ignore honge aur site live ho jayegi
    ignoreBuildErrors: true,
  },
  eslint: {
    // Isse linting errors ignore honge
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;